import { users, webauthnCredentials, type User, type UpsertUser, type WebAuthnCredential } from "@shared/models/auth";
import { db } from "../../db";
import { and, eq, or } from "drizzle-orm";

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmailOrUsername(identifier: string): Promise<User | undefined>;
  getUserByProviderId(provider: string, providerId: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: UpsertUser): Promise<User>;
  updateUserPassword(userId: string, passwordHash: string): Promise<void>;
  updateUserEmailVerified(userId: string): Promise<void>;
  getWebAuthnCredentials(userId: string): Promise<WebAuthnCredential[]>;
  getWebAuthnCredentialById(credentialId: string): Promise<WebAuthnCredential | undefined>;
  saveWebAuthnCredential(credential: typeof webauthnCredentials.$inferInsert): Promise<WebAuthnCredential>;
  updateWebAuthnCounter(credentialId: string, counter: number): Promise<void>;
  updateWebAuthnCredentialName(credentialId: string, userId: string, deviceName: string): Promise<WebAuthnCredential | undefined>;
  deleteWebAuthnCredential(credentialId: string, userId: string): Promise<void>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmailOrUsername(identifier: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.email, identifier), eq(users.username, identifier)));
    return user;
  }

  async getUserByProviderId(provider: string, providerId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.provider, provider), eq(users.providerId, providerId)));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateUserEmailVerified(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ isEmailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async getWebAuthnCredentials(userId: string): Promise<WebAuthnCredential[]> {
    return db.select().from(webauthnCredentials).where(eq(webauthnCredentials.userId, userId));
  }

  async getWebAuthnCredentialById(credentialId: string): Promise<WebAuthnCredential | undefined> {
    const [cred] = await db.select().from(webauthnCredentials).where(eq(webauthnCredentials.id, credentialId));
    return cred;
  }

  async saveWebAuthnCredential(credential: typeof webauthnCredentials.$inferInsert): Promise<WebAuthnCredential> {
    const [cred] = await db.insert(webauthnCredentials).values(credential).returning();
    return cred;
  }

  async updateWebAuthnCounter(credentialId: string, counter: number): Promise<void> {
    await db
      .update(webauthnCredentials)
      .set({ counter, lastUsedAt: new Date() })
      .where(eq(webauthnCredentials.id, credentialId));
  }

  async updateWebAuthnCredentialName(credentialId: string, userId: string, deviceName: string): Promise<WebAuthnCredential | undefined> {
    const [cred] = await db
      .update(webauthnCredentials)
      .set({ deviceName })
      .where(and(eq(webauthnCredentials.id, credentialId), eq(webauthnCredentials.userId, userId)))
      .returning();
    return cred;
  }

  async deleteWebAuthnCredential(credentialId: string, userId: string): Promise<void> {
    await db
      .delete(webauthnCredentials)
      .where(and(eq(webauthnCredentials.id, credentialId), eq(webauthnCredentials.userId, userId)));
  }
}

export const authStorage = new AuthStorage();
