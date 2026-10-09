import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { themes, applyTheme, loadSavedTheme, type ThemeName } from "@/lib/themes";
import { 
  LogOut, 
  User, 
  ShieldCheck, 
  Info, 
  CheckCircle2, 
  Lightbulb, 
  Sparkles,
  ChevronRight,
  Users,
  Calendar,
  MapPin,
  CloudSun,
  ClipboardList,
  Bell,
  Leaf,
  Euro,
  Settings,
  Fingerprint,
  Loader2,
  Trash2,
  KeyRound,
  Eye,
  EyeOff,
  Pencil,
  Palette
} from "lucide-react";
import { Link } from "wouter";
import { PushHealthBanner } from "@/components/PushHealthBanner";
import { WorkingHoursSection } from "@/components/WorkingHoursSection";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { startRegistration } from "@simplewebauthn/browser";

const implementedFeatures = [
  {
    icon: Users,
    title: "Gestão de Clientes",
    description: "Adicionar, editar e eliminar clientes com informações de contacto, morada e tipos de serviço."
  },
  {
    icon: Calendar,
    title: "Agendamento de Serviços",
    description: "Agendar compromissos com clientes, ver calendário mensal e lista de agendamentos."
  },
  {
    icon: ClipboardList,
    title: "Registo de Atividades",
    description: "Registar serviços concluídos com descrição, fotos e tipo de serviço."
  },
  {
    icon: MapPin,
    title: "Mapa Interativo",
    description: "Visualizar clientes no mapa com navegação GPS integrada."
  },
  {
    icon: CloudSun,
    title: "Meteorologia",
    description: "Previsão do tempo com alertas para condições adversas."
  },
  {
    icon: Bell,
    title: "Lembretes",
    description: "Sistema de lembretes para manutenções regulares."
  },
  {
    icon: Euro,
    title: "Gestão Financeira",
    description: "Pagamentos, faturação e distribuição salário/empresa."
  },
  {
    icon: Leaf,
    title: "Design Mobile-First",
    description: "Interface otimizada para iPhone com PWA instalável."
  }
];

const futureIdeas = [
  {
    title: "Rotas Otimizadas",
    description: "Planear a melhor rota para vários clientes.",
    source: "sugestão"
  },
  {
    title: "Sincronização Cloud",
    description: "Backup automático dos dados.",
    source: "sugestão"
  }
];

function suggestDeviceName(userAgent: string): string {
  const ua = userAgent || "";
  if (/iPad/i.test(ua)) return "iPad";
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/Android/i.test(ua)) {
    const match = ua.match(/Android[^;)]*;\s*([^;)]+)\)/);
    const model = match?.[1]?.trim();
    return model && model.length < 30 ? model : "Telemóvel Android";
  }
  if (/Macintosh|Mac OS X/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Linux/i.test(ua)) return "Linux";
  return "Dispositivo biométrico";
}

function formatLastUsed(value: string | null): string {
  if (!value) return "Nunca usado";
  try {
    return `Último uso: ${format(new Date(value), "d MMM yyyy 'às' HH:mm", { locale: pt })}`;
  } catch {
    return "Último uso: -";
  }
}

function formatCreatedAt(value: string): string {
  try {
    return `Registado a ${format(new Date(value), "d MMM yyyy", { locale: pt })}`;
  } catch {
    return "Registado a -";
  }
}

function BiometricSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [registering, setRegistering] = useState(false);
  const [platformAvailable, setPlatformAvailable] = useState(false);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [deviceNameInput, setDeviceNameInput] = useState("");
  const [credentialToDelete, setCredentialToDelete] = useState<{ id: string; deviceName: string } | null>(null);
  const [credentialToRename, setCredentialToRename] = useState<{ id: string; deviceName: string } | null>(null);
  const [renameInput, setRenameInput] = useState("");

  useEffect(() => {
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(setPlatformAvailable);
    }
  }, []);

  const { data: credentials = [] } = useQuery<{ id: string; deviceName: string; createdAt: string; lastUsedAt: string | null }[]>({
    queryKey: ["/api/auth/webauthn/credentials"],
    queryFn: async () => {
      const res = await fetch("/api/auth/webauthn/credentials", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, deviceName }: { id: string; deviceName: string }) => {
      const res = await fetch(`/api/auth/webauthn/credentials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ deviceName }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Erro ao renomear");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/webauthn/credentials"] });
      toast({ title: "Nome atualizado" });
      setCredentialToRename(null);
      setRenameInput("");
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (credentialId: string) => {
      const res = await fetch(`/api/auth/webauthn/credentials/${credentialId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao remover");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/webauthn/credentials"] });
      toast({ title: "Biometria removida" });
      setCredentialToDelete(null);
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível remover a credencial", variant: "destructive" });
    },
  });

  const openRegisterDialog = () => {
    setDeviceNameInput(suggestDeviceName(navigator.userAgent));
    setNameDialogOpen(true);
  };

  const handleRegister = async () => {
    const trimmedName = deviceNameInput.trim();
    if (!trimmedName) {
      toast({ title: "Erro", description: "Indica um nome para o dispositivo", variant: "destructive" });
      return;
    }
    setNameDialogOpen(false);
    setRegistering(true);
    try {
      const optionsRes = await fetch("/api/auth/webauthn/register-options", {
        method: "POST",
        credentials: "include",
      });
      if (!optionsRes.ok) throw new Error("Erro ao iniciar registo");
      const optionsJSON = await optionsRes.json();

      const attResp = await startRegistration({ optionsJSON });

      const verifyRes = await fetch("/api/auth/webauthn/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credential: attResp, deviceName: trimmedName.slice(0, 80) }),
      });
      if (!verifyRes.ok) throw new Error("Verificação falhou");
      const result = await verifyRes.json();

      if (result.verified) {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/webauthn/credentials"] });
        toast({ title: "Biometria registada com sucesso", description: trimmedName });
      }
    } catch (error: any) {
      if (error.name !== "NotAllowedError") {
        toast({
          title: "Erro",
          description: error.message || "Não foi possível registar biometria",
          variant: "destructive",
        });
      }
    } finally {
      setRegistering(false);
    }
  };

  if (!platformAvailable) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Segurança</h3>
      <div className="glass-card overflow-hidden divide-y divide-border/30">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Fingerprint className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Face ID / Biometria</p>
              <p className="text-xs text-muted-foreground">Login rápido com biometria do dispositivo</p>
            </div>
          </div>

          {credentials.length > 0 && (
            <div className="space-y-2 mb-3">
              {credentials.map((cred) => (
                <div
                  key={cred.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/30"
                  data-testid={`credential-${cred.id}`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Fingerprint className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate font-medium" data-testid={`text-credential-name-${cred.id}`}>
                        {cred.deviceName || "Dispositivo"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate" data-testid={`text-credential-created-${cred.id}`}>
                        {formatCreatedAt(cred.createdAt)}
                      </p>
                      {cred.lastUsedAt && (
                        <p className="text-xs text-muted-foreground truncate" data-testid={`text-credential-last-used-${cred.id}`}>
                          {formatLastUsed(cred.lastUsedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        const fallback = cred.deviceName || "Dispositivo";
                        setCredentialToRename({ id: cred.id, deviceName: fallback });
                        setRenameInput(cred.deviceName || fallback);
                      }}
                      disabled={renameMutation.isPending}
                      data-testid={`button-rename-credential-${cred.id}`}
                      aria-label="Renomear credencial"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setCredentialToDelete({ id: cred.id, deviceName: cred.deviceName || "Dispositivo" })}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-credential-${cred.id}`}
                      aria-label="Remover credencial"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={openRegisterDialog}
            disabled={registering}
            data-testid="button-register-biometric"
          >
            {registering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Fingerprint className="w-4 h-4" />
            )}
            {credentials.length > 0 ? "Adicionar outro dispositivo" : "Ativar Face ID / Biometria"}
          </Button>
        </div>
      </div>

      <Dialog open={nameDialogOpen} onOpenChange={(open) => !registering && setNameDialogOpen(open)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nome do dispositivo</DialogTitle>
            <DialogDescription>
              Escolhe um nome que te ajude a identificar este telemóvel ou computador na lista de credenciais.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="device-name-input">Nome</Label>
            <Input
              id="device-name-input"
              value={deviceNameInput}
              onChange={(e) => setDeviceNameInput(e.target.value)}
              placeholder="Ex.: iPhone do Tiago"
              maxLength={80}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleRegister();
                }
              }}
              data-testid="input-device-name"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setNameDialogOpen(false)}
              data-testid="button-cancel-device-name"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRegister}
              disabled={!deviceNameInput.trim()}
              data-testid="button-confirm-device-name"
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={credentialToRename !== null}
        onOpenChange={(open) => {
          if (!open && !renameMutation.isPending) {
            setCredentialToRename(null);
            setRenameInput("");
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Renomear credencial</DialogTitle>
            <DialogDescription>
              Escolhe um novo nome para identificar este dispositivo na lista.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="rename-device-input">Nome</Label>
            <Input
              id="rename-device-input"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              placeholder="Ex.: iPhone do Tiago"
              maxLength={80}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const trimmed = renameInput.trim();
                  if (credentialToRename && trimmed) {
                    renameMutation.mutate({ id: credentialToRename.id, deviceName: trimmed.slice(0, 80) });
                  }
                }
              }}
              data-testid="input-rename-device"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCredentialToRename(null);
                setRenameInput("");
              }}
              disabled={renameMutation.isPending}
              data-testid="button-cancel-rename"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                const trimmed = renameInput.trim();
                if (credentialToRename && trimmed) {
                  renameMutation.mutate({ id: credentialToRename.id, deviceName: trimmed.slice(0, 80) });
                }
              }}
              disabled={renameMutation.isPending || !renameInput.trim()}
              data-testid="button-confirm-rename"
            >
              {renameMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={credentialToDelete !== null}
        onOpenChange={(open) => !open && setCredentialToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover esta credencial?</AlertDialogTitle>
            <AlertDialogDescription>
              {credentialToDelete && (
                <>
                  Vais deixar de poder iniciar sessão com biometria a partir de{" "}
                  <span className="font-semibold">{credentialToDelete.deviceName}</span>. Podes voltar a registar a qualquer momento.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-credential">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (credentialToDelete) deleteMutation.mutate(credentialToDelete.id);
              }}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-credential"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PasswordSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const { data: passwordInfo, isLoading } = useQuery<{ hasPassword: boolean }>({
    queryKey: ["/api/auth/has-password"],
  });

  const mutation = useMutation({
    mutationFn: async (data: { currentPassword?: string; newPassword: string }) => {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: data.message });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/has-password"] });
      setShowForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (newPassword.length < 6) {
      toast({ title: "Erro", description: "A palavra-passe deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Erro", description: "As palavras-passe não coincidem", variant: "destructive" });
      return;
    }
    mutation.mutate({
      currentPassword: passwordInfo?.hasPassword ? currentPassword : undefined,
      newPassword,
    });
  };

  if (isLoading) return null;

  const hasPassword = passwordInfo?.hasPassword;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Segurança</h3>
      <div className="glass-card p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{hasPassword ? "Alterar Palavra-passe" : "Definir Palavra-passe"}</p>
            <p className="text-xs text-muted-foreground">
              {hasPassword ? "Atualizar a sua palavra-passe de acesso" : "Adicionar palavra-passe para login com e-mail"}
            </p>
          </div>
        </div>

        {!showForm ? (
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setShowForm(true)}
            data-testid="button-toggle-password-form"
          >
            <KeyRound className="w-4 h-4" />
            {hasPassword ? "Alterar palavra-passe" : "Definir palavra-passe"}
          </Button>
        ) : (
          <div className="space-y-3">
            {hasPassword && (
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  placeholder="Palavra-passe atual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  data-testid="input-current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowCurrent(!showCurrent)}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                placeholder="Nova palavra-passe"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                data-testid="input-new-password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Input
              type="password"
              placeholder="Confirmar nova palavra-passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              data-testid="input-confirm-password"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowForm(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                data-testid="button-cancel-password"
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleSubmit}
                disabled={mutation.isPending}
                data-testid="button-save-password"
              >
                {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PushNotificationSection() {
  const { state, subscribe, unsubscribe, sendTest } = usePushNotifications();
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);

  if (state === "unsupported") {
    return (
      <div className="glass-card p-4 space-y-3">
        <PushHealthBanner />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
            <Bell className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Notificações Push</p>
            <p className="text-xs text-muted-foreground">Não suportado neste navegador</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 space-y-3">
      <PushHealthBanner />
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          state === "granted" ? "bg-green-500/10" : "bg-destructive/10"
        }`}>
          <Bell className={`w-5 h-5 ${state === "granted" ? "text-green-600" : "text-destructive"}`} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">Notificações Push</p>
          <p className="text-xs text-muted-foreground">
            {state === "granted" ? "Ativas neste dispositivo" :
             state === "denied" ? "Bloqueadas pelo navegador" :
             state === "loading" ? "A verificar..." :
             "Recebe alertas de compromissos"}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {state === "granted" ? (
          <>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={async () => {
                setTesting(true);
                const ok = await sendTest();
                setTesting(false);
                toast({
                  title: ok ? "Notificação enviada" : "Erro",
                  description: ok ? "Verifica o teu dispositivo." : "Não foi possível enviar.",
                  variant: ok ? "default" : "destructive",
                });
              }}
              disabled={testing}
              data-testid="button-test-push"
            >
              {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
              Testar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2 text-destructive hover:text-destructive"
              onClick={async () => {
                const ok = await unsubscribe();
                if (ok) toast({ title: "Notificações desativadas" });
              }}
              data-testid="button-disable-push"
            >
              Desativar
            </Button>
          </>
        ) : state === "denied" ? (
          <p className="text-xs text-muted-foreground">
            Para ativar, altera as permissões de notificações nas definições do navegador.
          </p>
        ) : state !== "loading" ? (
          <Button
            size="sm"
            className="w-full gap-2"
            onClick={async () => {
              const ok = await subscribe();
              if (ok) {
                toast({ title: "Notificações ativadas", description: "Receberás alertas neste dispositivo." });
              } else if (Notification.permission === "denied") {
                toast({ title: "Permissão negada", description: "Verifica as definições do navegador.", variant: "destructive" });
              }
            }}
            data-testid="button-enable-push"
          >
            <Bell className="w-3 h-3" />
            Ativar Notificações
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, logout } = useAuth();
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(loadSavedTheme());

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-24 page-transition">
      <PageHeader
        title="Perfil"
        subtitle="Conta e preferências"
        backHref="/more"
      />

      <div className="px-5 -mt-14 relative z-10 space-y-6">
        <div className="glass-card p-5 flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-white shadow-lg">
            {user.profileImageUrl && <AvatarImage src={user.profileImageUrl} />}
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-xl font-bold">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h2 className="text-xl font-bold">{user.firstName} {user.lastName}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              ServNtrak
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Conta</h3>
          
          <div className="glass-card overflow-hidden divide-y divide-border/30">
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">E-mail</p>
                <p className="font-medium text-sm truncate">{user.email || "Sem e-mail"}</p>
              </div>
            </div>

            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                <User className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">ID</p>
                <p className="font-medium text-sm truncate">{user.id.slice(0, 20)}...</p>
              </div>
            </div>
          </div>
        </div>

        <PasswordSection />

        <BiometricSection />

        <PushNotificationSection />

        <WorkingHoursSection />

        <Card data-testid="card-appearance">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" aria-hidden="true" />
              Aparência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Label>Paleta de Cores</Label>
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(themes) as ThemeName[]).map((themeName) => (
                  <button
                    key={themeName}
                    onClick={() => {
                      setSelectedTheme(themeName);
                      applyTheme(themeName);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                      selectedTheme === themeName
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                    aria-pressed={selectedTheme === themeName}
                    aria-label={`Tema ${themeName}`}
                    data-testid={`button-theme-${themeName}`}
                  >
                    <div
                      className="w-12 h-12 rounded-full"
                      style={{ background: `hsl(${themes[themeName].primary})` }}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-medium capitalize">{themeName}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Aplicação</h3>
          
          <div className="glass-card overflow-hidden divide-y divide-border/30">
            <Dialog>
              <DialogTrigger asChild>
                <button 
                  className="w-full p-4 flex items-center gap-3 transition-colors hover:bg-muted/30 active:bg-muted/50"
                  data-testid="button-implemented-features"
                >
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-sm">Funcionalidades</p>
                    <p className="text-xs text-muted-foreground">{implementedFeatures.length} ativas</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[85vh]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Funcionalidades
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[60vh] pr-4">
                  <div className="space-y-3">
                    {implementedFeatures.map((feature, index) => (
                      <div 
                        key={index} 
                        className="flex gap-3 p-3 rounded-xl bg-muted/30"
                        data-testid={`implemented-feature-${index}`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <feature.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{feature.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <button 
                  className="w-full p-4 flex items-center gap-3 transition-colors hover:bg-muted/30 active:bg-muted/50"
                  data-testid="button-future-ideas"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-sm">Ideias Futuras</p>
                    <p className="text-xs text-muted-foreground">{futureIdeas.length} sugestões</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[85vh]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    Ideias Futuras
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[60vh] pr-4">
                  <div className="space-y-3">
                    {futureIdeas.map((idea, index) => (
                      <div 
                        key={index} 
                        className="p-4 rounded-xl border border-border/50 bg-card"
                        data-testid={`future-idea-${index}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm">{idea.title}</p>
                          <Badge variant="secondary" className="text-[10px] shrink-0 bg-muted text-muted-foreground">
                            <Sparkles className="w-3 h-3 mr-1" />
                            {idea.source}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{idea.description}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>

            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                <Info className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Versão</p>
                <p className="font-semibold text-sm">1.0.0</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 pb-4">
          <Button 
            variant="destructive" 
            className="w-full rounded-xl h-12 gap-2 shadow-lg font-semibold"
            onClick={() => logout()}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" /> Terminar Sessão
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
