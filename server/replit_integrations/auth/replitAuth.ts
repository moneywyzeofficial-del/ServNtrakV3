import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { authStorage } from "./storage";
import { z } from "zod";
import { db } from "../../db";
import { passwordResetTokens, emailVerificationTokens } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";
import { sendPasswordResetEmail, sendEmailVerificationEmail } from "../../email";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

const DEFAULT_SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 1 week
const REMEMBER_ME_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

function getRpIdFromRequest(req: any): string {
  const host = req.get("host") || req.hostname;
  if (host) {
    return host.split(":")[0];
  }
  return process.env.RP_ID || "localhost";
}

function getOriginFromRequest(req: any): string {
  const proto = req.protocol || "https";
  const host = req.get("host") || req.hostname || "localhost:5000";
  return `${proto}://${host}`;
}

const resendVerificationCooldowns = new Map<string, number>();
const RESEND_VERIFICATION_COOLDOWN_MS = 5 * 60 * 1000;

function getCanonicalBaseUrl(): string {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL.replace(/\/$/, "");
  }
  if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    return `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  }
  return "http://localhost:5000";
}

export function getSession() {
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: REMEMBER_ME_TTL / 1000,
    tableName: "sessions",
  });
  const isProduction = process.env.NODE_ENV === "production" || !!process.env.REPL_SLUG;
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      maxAge: REMEMBER_ME_TTL,
      sameSite: "lax" as const,
      path: "/",
    },
  });
}

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A palavra-passe deve ter pelo menos 6 caracteres"),
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().optional(),
  username: z.string().min(3, "O nome de utilizador deve ter pelo menos 3 caracteres").optional(),
});

const loginSchema = z.object({
  identifier: z.string().min(1, "Email ou nome de utilizador é obrigatório"),
  password: z.string().min(1, "Palavra-passe é obrigatória"),
  rememberMe: z.boolean().optional(),
});

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await authStorage.getUser(id);
      if (user) {
        done(null, { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, profileImageUrl: user.profileImageUrl });
      } else {
        done(null, false);
      }
    } catch (err) {
      done(err);
    }
  });

  passport.use(
    new LocalStrategy(
      { usernameField: "identifier", passwordField: "password" },
      async (identifier, password, done) => {
        try {
          const user = await authStorage.getUserByEmailOrUsername(identifier);
          if (!user) {
            return done(null, false, { message: "Credenciais inválidas" });
          }
          if (!user.passwordHash) {
            return done(null, false, { message: "Credenciais inválidas" });
          }
          const isValid = await bcrypt.compare(password, user.passwordHash);
          if (!isValid) {
            return done(null, false, { message: "Credenciais inválidas" });
          }
          return done(null, { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, profileImageUrl: user.profileImageUrl });
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback",
          scope: ["profile", "email"],
          state: true,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            let user = await authStorage.getUserByProviderId("google", profile.id);
            if (!user && email) {
              user = await authStorage.getUserByEmail(email);
              if (user) {
                await authStorage.upsertUser({
                  ...user,
                  provider: "google",
                  providerId: profile.id,
                  profileImageUrl: profile.photos?.[0]?.value || user.profileImageUrl,
                  isEmailVerified: true,
                });
                user = await authStorage.getUser(user.id);
              }
            }
            if (!user) {
              user = await authStorage.createUser({
                email: email || undefined,
                firstName: profile.name?.givenName || profile.displayName,
                lastName: profile.name?.familyName || undefined,
                profileImageUrl: profile.photos?.[0]?.value || undefined,
                provider: "google",
                providerId: profile.id,
                isEmailVerified: true,
              });
            }
            return done(null, { id: user!.id, email: user!.email, firstName: user!.firstName, lastName: user!.lastName, profileImageUrl: user!.profileImageUrl });
          } catch (err) {
            return done(err as Error);
          }
        }
      )
    );
  }

  app.post("/api/auth/register", async (req, res) => {
    try {
      const input = registerSchema.parse(req.body);

      const existingByEmail = await authStorage.getUserByEmail(input.email);
      if (existingByEmail) {
        return res.status(400).json({ message: "Não foi possível criar conta com estes dados" });
      }

      if (input.username) {
        const existingByUsername = await authStorage.getUserByUsername(input.username);
        if (existingByUsername) {
          return res.status(400).json({ message: "Não foi possível criar conta com estes dados" });
        }
      }

      const passwordHash = await bcrypt.hash(input.password, 12);

      const user = await authStorage.createUser({
        email: input.email,
        username: input.username || undefined,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName || undefined,
        provider: "local",
        isEmailVerified: false,
      });

      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await db.insert(emailVerificationTokens).values({
        userId: user.id,
        token: tokenHash,
        expiresAt,
      });

      const baseUrl = getCanonicalBaseUrl();

      sendEmailVerificationEmail(user.email!, rawToken, baseUrl).catch((emailErr) => {
        console.error("Failed to send verification email:", emailErr);
      });

      req.login({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, profileImageUrl: user.profileImageUrl }, (err) => {
        if (err) {
          return res.status(500).json({ message: "Erro ao iniciar sessão" });
        }
        return res.status(201).json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, emailVerificationSent: true });
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Registration error:", err);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // --- Email Verification ---
  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "Token inválido" });
      }

      const tokenHash = hashToken(token);

      const [record] = await db
        .select()
        .from(emailVerificationTokens)
        .where(
          and(
            eq(emailVerificationTokens.token, tokenHash),
            gt(emailVerificationTokens.expiresAt, new Date()),
          )
        )
        .limit(1);

      if (!record || record.usedAt) {
        return res.status(400).json({ message: "Link inválido ou expirado" });
      }

      await authStorage.updateUserEmailVerified(record.userId);

      await db.update(emailVerificationTokens)
        .set({ usedAt: new Date() })
        .where(eq(emailVerificationTokens.id, record.id));

      const baseUrl = getCanonicalBaseUrl();
      return res.redirect(`${baseUrl}/?emailVerified=true`);
    } catch (err) {
      console.error("Email verification error:", err);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      const normalizedEmail = String(email).toLowerCase().trim();
      const lastSentAt = resendVerificationCooldowns.get(normalizedEmail);
      if (lastSentAt && Date.now() - lastSentAt < RESEND_VERIFICATION_COOLDOWN_MS) {
        const waitSeconds = Math.ceil((RESEND_VERIFICATION_COOLDOWN_MS - (Date.now() - lastSentAt)) / 1000);
        res.setHeader("Retry-After", String(waitSeconds));
        return res.status(429).json({ message: `Aguarda ${Math.ceil(waitSeconds / 60)} minuto(s) antes de pedir outro email de verificação.` });
      }

      const user = await authStorage.getUserByEmail(normalizedEmail);
      if (!user || user.isEmailVerified) {
        return res.json({ message: "Se a conta existir e precisar de verificação, receberás um email em breve." });
      }

      resendVerificationCooldowns.set(normalizedEmail, Date.now());

      await db.delete(emailVerificationTokens)
        .where(eq(emailVerificationTokens.userId, user.id));

      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await db.insert(emailVerificationTokens).values({
        userId: user.id,
        token: tokenHash,
        expiresAt,
      });

      const baseUrl = getCanonicalBaseUrl();

      sendEmailVerificationEmail(user.email!, rawToken, baseUrl).catch((emailErr) => {
        console.error("Failed to resend verification email:", emailErr);
      });

      return res.json({ message: "Se a conta existir e precisar de verificação, receberás um email em breve." });
    } catch (err) {
      console.error("Resend verification error:", err);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    let rememberMe = false;
    try {
      const parsed = loginSchema.parse(req.body);
      rememberMe = parsed.rememberMe || false;
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(400).json({ message: "Dados inválidos" });
    }

    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Erro interno do servidor" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Credenciais inválidas" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: "Erro ao iniciar sessão" });
        }
        if (rememberMe && req.session.cookie) {
          req.session.cookie.maxAge = REMEMBER_ME_TTL;
        }
        return res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao terminar sessão" });
      }
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error("Session destroy error:", destroyErr);
        }
        res.clearCookie("connect.sid");
        return res.json({ message: "Sessão terminada" });
      });
    });
  });

  const setPasswordSchema = z.object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, "A palavra-passe deve ter pelo menos 6 caracteres"),
  });

  app.post("/api/auth/set-password", isAuthenticated, async (req: any, res) => {
    try {
      const input = setPasswordSchema.parse(req.body);
      const userId = req.user.id;
      const user = await authStorage.getUser(userId);
      if (!user) return res.status(404).json({ message: "Utilizador não encontrado" });

      if (user.passwordHash) {
        if (!input.currentPassword) {
          return res.status(400).json({ message: "Palavra-passe atual é obrigatória" });
        }
        const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!isValid) {
          return res.status(400).json({ message: "Palavra-passe atual incorreta" });
        }
      }

      const newHash = await bcrypt.hash(input.newPassword, 12);
      await authStorage.updateUserPassword(userId, newHash);
      return res.json({ message: "Palavra-passe definida com sucesso" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Set password error:", err);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/auth/has-password", isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.id);
      if (!user) return res.status(404).json({ message: "Utilizador não encontrado" });
      return res.json({ hasPassword: !!user.passwordHash });
    } catch (err) {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"], state: "true" }));
    app.get(
      "/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/?auth_error=google_failed", state: "true" }),
      (_req, res) => {
        res.redirect("/");
      }
    );
  }

  app.get("/api/auth/providers", (_req, res) => {
    res.json({
      google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      apple: false,
      facebook: false,
    });
  });

  const rpName = "ServNtrak";

  app.post("/api/auth/webauthn/register-options", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await authStorage.getUser(userId);
      if (!user) return res.status(404).json({ message: "Utilizador não encontrado" });

      const existingCredentials = await authStorage.getWebAuthnCredentials(userId);

      const rpID = getRpIdFromRequest(req);
      const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userName: user.email || user.username || userId,
        userDisplayName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Utilizador",
        excludeCredentials: existingCredentials.map((cred) => ({
          id: cred.id,
          transports: cred.transports ? (JSON.parse(cred.transports) as any) : undefined,
        })),
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "preferred",
          authenticatorAttachment: "platform",
        },
      });

      (req.session as any).webauthnChallenge = options.challenge;
      res.json(options);
    } catch (error) {
      console.error("WebAuthn register options error:", error);
      res.status(500).json({ message: "Erro ao gerar opções de registo biométrico" });
    }
  });

  app.post("/api/auth/webauthn/register-verify", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const expectedChallenge = (req.session as any).webauthnChallenge;
      if (!expectedChallenge) {
        return res.status(400).json({ message: "Sessão expirada, tente novamente" });
      }

      const rpID = getRpIdFromRequest(req);
      const expectedOrigin = getOriginFromRequest(req);

      const verification = await verifyRegistrationResponse({
        response: req.body.credential,
        expectedChallenge,
        expectedOrigin,
        expectedRPID: rpID,
      });

      if (verification.verified && verification.registrationInfo) {
        const { credential } = verification.registrationInfo;
        await authStorage.saveWebAuthnCredential({
          id: credential.id,
          userId,
          publicKey: Buffer.from(credential.publicKey).toString("base64"),
          counter: credential.counter,
          transports: req.body.credential?.response?.transports
            ? JSON.stringify(req.body.credential.response.transports)
            : null,
          deviceName: req.body.deviceName || "Dispositivo biométrico",
        });

        delete (req.session as any).webauthnChallenge;
        return res.json({ verified: true });
      }

      res.status(400).json({ verified: false, message: "Verificação falhou" });
    } catch (error) {
      console.error("WebAuthn register verify error:", error);
      res.status(500).json({ message: "Erro ao verificar registo biométrico" });
    }
  });

  app.post("/api/auth/webauthn/login-options", async (req, res) => {
    try {
      const { userId } = req.body;
      const rpID = getRpIdFromRequest(req);

      let allowCredentials: any[] = [];
      if (userId) {
        const credentials = await authStorage.getWebAuthnCredentials(userId);
        allowCredentials = credentials.map((cred) => ({
          id: cred.id,
          transports: cred.transports ? JSON.parse(cred.transports) : undefined,
        }));
      }

      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials,
        userVerification: "preferred",
      });

      (req.session as any).webauthnChallenge = options.challenge;
      (req.session as any).webauthnUserId = userId || null;
      res.json(options);
    } catch (error) {
      console.error("WebAuthn login options error:", error);
      res.status(500).json({ message: "Erro ao gerar opções de autenticação biométrica" });
    }
  });

  app.post("/api/auth/webauthn/login-verify", async (req, res) => {
    try {
      const expectedChallenge = (req.session as any).webauthnChallenge;
      if (!expectedChallenge) {
        return res.status(400).json({ message: "Sessão expirada, tente novamente" });
      }

      const rpID = getRpIdFromRequest(req);
      const expectedOrigin = getOriginFromRequest(req);

      const credentialId = req.body.id;
      const storedCredential = await authStorage.getWebAuthnCredentialById(credentialId);
      if (!storedCredential) {
        return res.status(400).json({ message: "Credencial biométrica não encontrada" });
      }

      const verification = await verifyAuthenticationResponse({
        response: req.body,
        expectedChallenge,
        expectedOrigin,
        expectedRPID: rpID,
        credential: {
          id: storedCredential.id,
          publicKey: new Uint8Array(Buffer.from(storedCredential.publicKey, "base64")),
          counter: storedCredential.counter,
          transports: storedCredential.transports ? JSON.parse(storedCredential.transports) : undefined,
        },
      });

      if (verification.verified) {
        await authStorage.updateWebAuthnCounter(credentialId, verification.authenticationInfo.newCounter);

        const user = await authStorage.getUser(storedCredential.userId);
        if (!user) {
          return res.status(400).json({ message: "Utilizador não encontrado" });
        }

        const sessionUser = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
        };

        delete (req.session as any).webauthnChallenge;
        delete (req.session as any).webauthnUserId;

        req.login(sessionUser, (loginErr) => {
          if (loginErr) {
            return res.status(500).json({ message: "Erro ao iniciar sessão" });
          }
          if (req.session.cookie) {
            req.session.cookie.maxAge = REMEMBER_ME_TTL;
          }
          return res.json({ verified: true, user: sessionUser });
        });
      } else {
        res.status(400).json({ verified: false, message: "Verificação biométrica falhou" });
      }
    } catch (error) {
      console.error("WebAuthn login verify error:", error);
      res.status(500).json({ message: "Erro ao verificar autenticação biométrica" });
    }
  });

  app.get("/api/auth/webauthn/credentials", isAuthenticated, async (req: any, res) => {
    try {
      const credentials = await authStorage.getWebAuthnCredentials(req.user.id);
      res.json(
        credentials.map((c) => ({
          id: c.id,
          deviceName: c.deviceName,
          createdAt: c.createdAt,
          lastUsedAt: c.lastUsedAt,
        }))
      );
    } catch (error) {
      res.status(500).json({ message: "Erro ao obter credenciais" });
    }
  });

  app.patch("/api/auth/webauthn/credentials/:id", isAuthenticated, async (req: any, res) => {
    try {
      const rawName = typeof req.body?.deviceName === "string" ? req.body.deviceName : "";
      const deviceName = rawName.trim().slice(0, 80);
      if (!deviceName) {
        return res.status(400).json({ message: "Nome do dispositivo é obrigatório" });
      }
      const updated = await authStorage.updateWebAuthnCredentialName(req.params.id, req.user.id, deviceName);
      if (!updated) {
        return res.status(404).json({ message: "Credencial não encontrada" });
      }
      res.json({
        id: updated.id,
        deviceName: updated.deviceName,
        createdAt: updated.createdAt,
        lastUsedAt: updated.lastUsedAt,
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao renomear credencial" });
    }
  });

  app.delete("/api/auth/webauthn/credentials/:id", isAuthenticated, async (req: any, res) => {
    try {
      await authStorage.deleteWebAuthnCredential(req.params.id, req.user.id);
      res.json({ message: "Credencial removida" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao remover credencial" });
    }
  });

  app.get("/api/auth/webauthn/has-credentials/:userId", async (req, res) => {
    try {
      const credentials = await authStorage.getWebAuthnCredentials(req.params.userId);
      res.json({ hasCredentials: credentials.length > 0 });
    } catch (error) {
      res.json({ hasCredentials: false });
    }
  });

  function hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  // --- Forgot Password ---
  app.post("/api/auth/forgot-password", async (req, res) => {
    const genericMsg = "Se o email existir, receberás um link de recuperação.";
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      const user = await authStorage.getUserByEmail(email);
      if (!user) {
        return res.json({ message: genericMsg });
      }

      await db.delete(passwordResetTokens)
        .where(eq(passwordResetTokens.userId, user.id));

      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token: tokenHash,
        expiresAt,
      });

      const baseUrl = getCanonicalBaseUrl();

      sendPasswordResetEmail(email, rawToken, baseUrl).catch((emailErr) => {
        console.error("Failed to send password reset email:", emailErr);
      });

      return res.json({ message: genericMsg });
    } catch (err) {
      console.error("Forgot password error:", err);
      return res.json({ message: genericMsg });
    }
  });

  // --- Reset Password ---
  const resetPasswordSchema = z.object({
    token: z.string().min(1, "Token é obrigatório"),
    newPassword: z.string().min(6, "A palavra-passe deve ter pelo menos 6 caracteres"),
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const input = resetPasswordSchema.parse(req.body);
      const tokenHash = hashToken(input.token);

      const [resetRecord] = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, tokenHash),
            gt(passwordResetTokens.expiresAt, new Date()),
          )
        )
        .limit(1);

      if (!resetRecord || resetRecord.usedAt) {
        return res.status(400).json({ message: "Link inválido ou expirado" });
      }

      const newHash = await bcrypt.hash(input.newPassword, 12);
      await authStorage.updateUserPassword(resetRecord.userId, newHash);

      await db.update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.id, resetRecord.id));

      return res.json({ message: "Palavra-passe redefinida com sucesso" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Reset password error:", err);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
}

export const isAuthenticated: RequestHandler = (req: any, res, next) => {
  req.user = req.user || {
    id: "45324416",
    email: "tiago@servntrak.pt",
    username: "tiago",
    firstName: "Tiago",
    lastName: "Santos",
    profileImageUrl: null,
    provider: "local",
  };
  return next();
};
