import { useState, useEffect, useCallback } from "react";
import logoImage from "@assets/Logo_ServNtrak_V.png";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Loader2, Mail, Lock, User, ArrowLeft, Fingerprint, Smartphone } from "lucide-react";
import { SiGoogle, SiApple, SiFacebook } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { startAuthentication } from "@simplewebauthn/browser";

type AuthView = "main" | "login" | "register" | "forgot-password" | "reset-password";

interface AuthProviders {
  google: boolean;
  apple: boolean;
  facebook: boolean;
}

const REMEMBERED_USER_KEY = "servntrak_remembered_user";

interface RememberedUser {
  id: string;
  identifier: string;
  firstName: string;
}

function getRememberedUser(): RememberedUser | null {
  try {
    const oldKey = "trackserv_remembered_user";
    const oldStored = localStorage.getItem(oldKey);
    if (oldStored) {
      localStorage.setItem(REMEMBERED_USER_KEY, oldStored);
      localStorage.removeItem(oldKey);
    }
    const stored = localStorage.getItem(REMEMBERED_USER_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

function setRememberedUser(user: RememberedUser) {
  localStorage.setItem(REMEMBERED_USER_KEY, JSON.stringify(user));
}

function clearRememberedUser() {
  localStorage.removeItem(REMEMBERED_USER_KEY);
}

export default function Login() {
  const [view, setView] = useState<AuthView>("main");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [platformAuthSupported, setPlatformAuthSupported] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [resetToken, setResetToken] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setResetToken(token);
      setView("reset-password");
    }
  }, []);

  const rememberedUser = getRememberedUser();

  useEffect(() => {
    if (!window.PublicKeyCredential) return;
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then((available) => {
      setPlatformAuthSupported(available);
      if (available && rememberedUser) {
        fetch(`/api/auth/webauthn/has-credentials/${rememberedUser.id}`)
          .then((r) => r.json())
          .then((data) => setBiometricAvailable(data.hasCredentials))
          .catch(() => setBiometricAvailable(false));
      }
    });
  }, []);

  const { data: providers } = useQuery<AuthProviders>({
    queryKey: ["/api/auth/providers"],
    queryFn: async () => {
      const res = await fetch("/api/auth/providers");
      return res.json();
    },
  });

  const [loginForm, setLoginForm] = useState({
    identifier: rememberedUser?.identifier || "",
    password: "",
  });
  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    username: "",
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { identifier: string; password: string; rememberMe: boolean }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erro ao iniciar sessão");
      }
      return res.json();
    },
    onSuccess: (user) => {
      if (rememberMe) {
        setRememberedUser({
          id: user.id,
          identifier: loginForm.identifier,
          firstName: user.firstName || loginForm.identifier,
        });
      } else {
        clearRememberedUser();
      }
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: typeof registerForm) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erro ao criar conta");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erro ao enviar email");
      }
      return res.json();
    },
    onSuccess: () => setResetSuccess(true),
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { token: string; newPassword: string }) => {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erro ao redefinir palavra-passe");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Palavra-passe redefinida. Podes iniciar sessão." });
      setLocation("/");
      setView("login");
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ ...loginForm, rememberMe });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerForm);
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const handleBiometricLogin = useCallback(async () => {
    setBiometricLoading(true);
    try {
      const optionsRes = await fetch("/api/auth/webauthn/login-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(rememberedUser ? { userId: rememberedUser.id } : {}),
      });
      if (!optionsRes.ok) throw new Error("Erro ao obter opções");
      const optionsJSON = await optionsRes.json();

      const authResp = await startAuthentication({ optionsJSON });

      const verifyRes = await fetch("/api/auth/webauthn/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(authResp),
      });
      if (!verifyRes.ok) throw new Error("Verificação falhou");
      const result = await verifyRes.json();

      if (result.verified) {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      } else {
        throw new Error("Autenticação biométrica falhou");
      }
    } catch (error: any) {
      if (error.name !== "NotAllowedError") {
        toast({
          title: "Erro",
          description: error.message || "Não foi possível autenticar com biometria",
          variant: "destructive",
        });
      }
    } finally {
      setBiometricLoading(false);
    }
  }, [rememberedUser, queryClient, toast]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex justify-center mb-4">
          <img src={logoImage} alt="ServNtrak Logo" className="w-64 h-auto object-contain" />
        </div>
        <p className="text-muted-foreground mb-6 text-center text-sm">
          Gestão de serviços de manutenção
        </p>

        {view === "main" && (
          <div className="space-y-3">
            {rememberedUser && biometricAvailable && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Olá, <span className="font-medium text-foreground">{rememberedUser.firstName}</span>
                  </p>
                  <Button
                    variant="default"
                    className="w-full gap-3"
                    onClick={handleBiometricLogin}
                    disabled={biometricLoading}
                    data-testid="button-biometric-login"
                  >
                    {biometricLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Fingerprint className="w-5 h-5" />
                    )}
                    <span>Entrar com Face ID / Biometria</span>
                  </Button>
                  <button
                    onClick={() => {
                      clearRememberedUser();
                      setBiometricAvailable(false);
                      setLoginForm({ identifier: "", password: "" });
                    }}
                    className="text-xs text-muted-foreground w-full text-center"
                    data-testid="button-forget-user"
                  >
                    Usar outra conta
                  </button>
                </CardContent>
              </Card>
            )}

            {rememberedUser && biometricAvailable && (
              <div className="flex items-center gap-3 py-1">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">ou</span>
                <Separator className="flex-1" />
              </div>
            )}

            <Card>
              <CardContent className="p-4 space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={handleGoogleLogin}
                  disabled={!providers?.google}
                  data-testid="button-login-google"
                >
                  <SiGoogle className="w-4 h-4 text-red-500" />
                  <span>Continuar com Google</span>
                  {!providers?.google && (
                    <span className="ml-auto text-xs text-muted-foreground">Em breve</span>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                  disabled
                  data-testid="button-login-apple"
                >
                  <SiApple className="w-4 h-4" />
                  <span>Continuar com Apple</span>
                  <span className="ml-auto text-xs text-muted-foreground">Em breve</span>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                  disabled
                  data-testid="button-login-facebook"
                >
                  <SiFacebook className="w-4 h-4 text-blue-600" />
                  <span>Continuar com Facebook</span>
                  <span className="ml-auto text-xs text-muted-foreground">Em breve</span>
                </Button>
              </CardContent>
            </Card>

            <div className="flex items-center gap-3 py-1">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">ou</span>
              <Separator className="flex-1" />
            </div>

            <Card>
              <CardContent className="p-4 space-y-3">
                {platformAuthSupported && !(rememberedUser && biometricAvailable) && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3"
                      onClick={handleBiometricLogin}
                      disabled={biometricLoading}
                      data-testid="button-passkey-login"
                    >
                      {biometricLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Fingerprint className="w-4 h-4 text-primary" />
                      )}
                      <span>Entrar com passkey</span>
                    </Button>
                    <div className="flex items-center gap-3 py-1">
                      <Separator className="flex-1" />
                      <span className="text-xs text-muted-foreground">ou</span>
                      <Separator className="flex-1" />
                    </div>
                  </>
                )}

                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => setView("login")}
                  data-testid="button-goto-login"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Iniciar Sessão com Email
                </Button>

                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => setView("register")}
                  data-testid="button-goto-register"
                >
                  Criar nova conta
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {view === "login" && (
          <Card>
            <CardContent className="p-5">
              <button
                onClick={() => setView("main")}
                className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover-elevate rounded-md px-2 py-1 -ml-2"
                data-testid="button-back-main"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>

              <h2 className="text-lg font-semibold mb-4">Iniciar Sessão</h2>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-identifier">Email ou Nome de Utilizador</Label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="login-identifier"
                      type="text"
                      placeholder="email@exemplo.com"
                      value={loginForm.identifier}
                      onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })}
                      className="pl-10"
                      autoComplete="username"
                      data-testid="input-login-identifier"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Palavra-passe</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="A sua palavra-passe"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="pl-10 pr-10"
                      autoComplete="current-password"
                      data-testid="input-login-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="remember-me"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      data-testid="checkbox-remember-me"
                    />
                    <Label htmlFor="remember-me" className="text-sm text-muted-foreground cursor-pointer">
                      Memorizar sessão
                    </Label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setView("forgot-password")}
                    className="text-xs text-muted-foreground hover:text-primary"
                    data-testid="link-forgot-password"
                  >
                    Esqueceste a palavra-passe?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending || !loginForm.identifier || !loginForm.password}
                  data-testid="button-submit-login"
                >
                  {loginMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Entrar
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setView("register")}
                  className="text-sm text-primary"
                  data-testid="link-goto-register"
                >
                  Não tem conta? Criar conta
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {view === "register" && (
          <Card>
            <CardContent className="p-5">
              <button
                onClick={() => setView("main")}
                className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover-elevate rounded-md px-2 py-1 -ml-2"
                data-testid="button-back-main-register"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>

              <h2 className="text-lg font-semibold mb-4">Criar Conta</h2>

              <form onSubmit={handleRegister} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="register-firstName">Nome</Label>
                    <Input
                      id="register-firstName"
                      type="text"
                      placeholder="Nome"
                      value={registerForm.firstName}
                      onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                      autoComplete="given-name"
                      data-testid="input-register-firstname"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="register-lastName">Apelido</Label>
                    <Input
                      id="register-lastName"
                      type="text"
                      placeholder="Apelido"
                      value={registerForm.lastName}
                      onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                      autoComplete="family-name"
                      data-testid="input-register-lastname"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="register-username">Nome de Utilizador (opcional)</Label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="register-username"
                      type="text"
                      placeholder="utilizador"
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                      className="pl-10"
                      autoComplete="username"
                      data-testid="input-register-username"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="register-email">Email</Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="Email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      className="pl-10"
                      autoComplete="email"
                      data-testid="input-register-email"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="register-password">Palavra-passe</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      className="pl-10 pr-10"
                      autoComplete="new-password"
                      data-testid="input-register-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      data-testid="button-toggle-password-register"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={registerMutation.isPending || !registerForm.email || !registerForm.password || !registerForm.firstName}
                  data-testid="button-submit-register"
                >
                  {registerMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Criar Conta
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setView("login")}
                  className="text-sm text-primary"
                  data-testid="link-goto-login"
                >
                  Já tem conta? Iniciar sessão
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {view === "forgot-password" && (
          <Card>
            <CardContent className="p-5">
              <button
                onClick={() => { setView("login"); setResetSuccess(false); }}
                className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-primary rounded-md px-2 py-1 -ml-2"
                data-testid="button-back-to-login"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>

              <h2 className="text-lg font-semibold mb-1">Recuperar palavra-passe</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Indica o teu email e enviamos um link de recuperação.
              </p>

              {resetSuccess ? (
                <div className="text-center space-y-3 py-4">
                  <Mail className="w-10 h-10 text-primary mx-auto" />
                  <p className="text-sm font-medium">Email enviado</p>
                  <p className="text-xs text-muted-foreground">
                    Se o email existir na nossa base de dados, receberás um link em breve.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="Email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="pl-10"
                        data-testid="input-forgot-email"
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    disabled={forgotPasswordMutation.isPending || !forgotEmail}
                    onClick={() => forgotPasswordMutation.mutate(forgotEmail)}
                    data-testid="button-send-reset-link"
                  >
                    {forgotPasswordMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Enviar link de recuperação
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {view === "reset-password" && (
          <Card>
            <CardContent className="p-5">
              <h2 className="text-lg font-semibold mb-1">Nova palavra-passe</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Escolhe uma nova palavra-passe para a tua conta.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-password-input">Nova palavra-passe</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="reset-password-input"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      className="pl-10 pr-10"
                      autoComplete="new-password"
                      data-testid="input-reset-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  className="w-full"
                  disabled={resetPasswordMutation.isPending || !resetNewPassword || resetNewPassword.length < 6}
                  onClick={() => resetPasswordMutation.mutate({ token: resetToken, newPassword: resetNewPassword })}
                  data-testid="button-reset-password"
                >
                  {resetPasswordMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Redefinir palavra-passe
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <p className="mt-6 text-xs text-muted-foreground/60 text-center">
          Peralta Gardens - Gestão de Serviços
        </p>
      </div>
    </div>
  );
}
