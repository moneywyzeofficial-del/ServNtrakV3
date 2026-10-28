import { useState, useMemo, useRef } from "react";
import { useParams, Link } from "wouter";
import { useClient, useUpdateClient } from "@/hooks/use-clients";
import { useServiceLogs } from "@/hooks/use-service-logs";
import { useQuickPhotos, useDeleteQuickPhoto } from "@/hooks/use-quick-photos";
import { useAppointments } from "@/hooks/use-appointments";
import { useClientServiceStats } from "@/hooks/use-service-visits";
import { useQuery } from "@tanstack/react-query";
import type { ClientEquipment } from "@shared/schema";
import {
  Loader2,
  Phone,
  MapPin,
  Leaf,
  Waves,
  ThermometerSun,
  Plus,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Camera,
  X,
  Flower2,
  Sparkles,
  FolderPlus,
  Timer,
  Banknote,
  Building2,
  Smartphone,
  ClipboardList,
  Trash2,
  FileText,
  ArrowLeft,
  Home,
  StickyNote,
  Pencil,
  Image as ImageIcon,
  Wrench,
  User,
  Share2,
  Key,
  Copy,
  Navigation,
  Droplets,
} from "lucide-react";
import { generateServiceNote } from "@/lib/generateServiceNote";
import type { ServiceLogWithEntries } from "@shared/schema";

import { SiWhatsapp } from "react-icons/si";
import { cn, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { AddServiceLogDialog } from "@/components/client-detail/AddServiceLogDialog";
import { EditClientDialog } from "@/components/client-detail/EditClientDialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ImageCropperDialog } from "@/components/ImageCropperDialog";
import { ClientTimeline } from "@/components/client-detail/ClientTimeline";
import { ClientTasksTab } from "@/components/client-detail/ClientTasksTab";
import { ClientAgendaTab } from "@/components/client-detail/ClientAgendaTab";
import { ClientPoolTab } from "@/components/client-detail/ClientPoolTab";
import { ClientEquipmentTab } from "@/components/client-detail/ClientEquipmentTab";
import { ClientDocumentsCard } from "@/components/client-detail/ClientDocumentsCard";
import { useClientPhotoUpload } from "@/hooks/use-client-photo-upload";
import { QuickPoolTestDialog } from "@/components/pool/QuickPoolTestDialog";
import { BeforeAfterPhotoDialog } from "@/components/photos/BeforeAfterPhotoDialog";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ClientDetail() {
  const { id } = useParams();
  const clientId = parseInt(id || "0");
  const { toast } = useToast();
  const { data: client, isLoading } = useClient(clientId);
  const { data: logs } = useServiceLogs(id);
  const { data: appointments } = useAppointments({ clientId: id });
  const { data: quickPhotos } = useQuickPhotos(id);
  const { data: serviceStats } = useClientServiceStats(clientId);
  const deleteQuickPhoto = useDeleteQuickPhoto();

  const { data: equipment = [] } = useQuery<ClientEquipment[]>({
    queryKey: ["client-equipment", clientId],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${clientId}/equipment`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: clientId > 0,
  });

  const [activeTab, setActiveTab] = useState("overview");
  const [generatingNoteId, setGeneratingNoteId] = useState<number | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [heroImgError, setHeroImgError] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);

  const [poolTestOpen, setPoolTestOpen] = useState(false);
  const [beforeAfterOpen, setBeforeAfterOpen] = useState(false);

  const updateClient = useUpdateClient();

  const housePhoto = useClientPhotoUpload(clientId, "house");
  const profilePhoto = useClientPhotoUpload(clientId, "profile");

  const [selectedPhoto, setSelectedPhoto] = useState<{ src: string; type: string; date?: string } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const profileCropInputRef = useRef<HTMLInputElement>(null);

  const freqLabel = (freq: string | null | undefined) => {
    const labels: Record<string, string> = { seasonal: "Sazonal", once_monthly: "Mensal", on_demand: "Quando necessário" };
    return freq ? labels[freq] || freq : "—";
  };

  const handleEditNotes = () => {
    if (!client) return;
    setNotesDraft(client.notes || "");
    setEditingNotes(true);
  };

  const handleSaveNotes = async () => {
    try {
      await updateClient.mutateAsync({ id: clientId, notes: notesDraft || null } as any);
      toast({ title: "Notas guardadas", description: "As notas permanentes foram atualizadas." });
      setEditingNotes(false);
    } catch {
      toast({ title: "Erro", description: "Não foi possível guardar as notas.", variant: "destructive" });
    }
  };

  const handleCancelNotes = () => {
    setEditingNotes(false);
    setNotesDraft("");
  };

  const handleCopyText = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast({ title: "Copiado!", description: `${label} copiado para a área de transferência.` });
    }
  };

  const handleShareClient = async () => {
    if (!client) return;
    const shareText = `Ficha de Cliente: ${client.name}\nMorada: ${client.address || "Sem morada"}\nContacto: ${client.phone || "—"}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `ServNtrak - ${client.name}`,
          text: shareText,
          url: window.location.href,
        });
      } catch {
        // Ignorar cancelamento
      }
    } else {
      handleCopyText(`${shareText}\n${window.location.href}`, "Dados do cliente");
    }
  };

  const poolVolume = useMemo(() => {
    if (client?.poolLength && client?.poolWidth && client?.poolMinDepth && client?.poolMaxDepth) {
      return ((client.poolLength * client.poolWidth * (client.poolMinDepth + client.poolMaxDepth)) / 2).toFixed(0);
    }
    return null;
  }, [client]);

  const gateCode = useMemo(() => {
    if (!client?.notes) return null;
    const match = client.notes.match(/(?:c[oó]digo|port[aã]o|chave|alarme|code)[\s:#]+([A-Za-z0-9#-]+)/i);
    return match ? match[1] : null;
  }, [client?.notes]);

  const mapsUrl = useMemo(() => {
    if (!client) return "#";
    if (client.latitude && client.longitude) {
      return `https://www.google.com/maps?q=${client.latitude},${client.longitude}`;
    }
    return `https://www.google.com/maps/search/${encodeURIComponent(client.address || client.name)}`;
  }, [client]);

  const nextVisit = useMemo(() => {
    if (!appointments) return null;
    const now = Date.now();
    return (
      appointments
        .filter((apt) => new Date(apt.date).getTime() > now && !apt.isCompleted)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] || null
    );
  }, [appointments]);

  const clientPhotos = useMemo(() => {
    const photos: { id: string; src: string; type: string; date?: string }[] = [];

    if (client?.housePhotoUrl) {
      photos.push({ id: "house", src: client.housePhotoUrl, type: "Propriedade" });
    }
    if (client?.profilePhotoUrl) {
      photos.push({ id: "profile", src: client.profilePhotoUrl, type: "Cliente" });
    }

    (quickPhotos || []).forEach((p) => {
      photos.push({
        id: `quick-${p.id}`,
        src: p.photoUrl,
        type: p.serviceType || "Serviço",
        date: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
      });
    });

    (logs || []).forEach((log) => {
      (log.photosBefore || []).forEach((url, i) => {
        photos.push({
          id: `before-${log.id}-${i}`,
          src: url,
          type: "Antes",
          date: log.date ? new Date(log.date).toISOString() : undefined,
        });
      });
      (log.photosAfter || []).forEach((url, i) => {
        photos.push({
          id: `after-${log.id}-${i}`,
          src: url,
          type: "Depois",
          date: log.date ? new Date(log.date).toISOString() : undefined,
        });
      });
    });

    return photos;
  }, [client, quickPhotos, logs]);

  const clientStats = useMemo(() => {
    const now = new Date();
    const thisYear = now.getFullYear();

    const visitsThisYear =
      (logs || []).filter((l) => new Date(l.date).getFullYear() === thisYear).length +
      (appointments || []).filter((a) => a.isCompleted && new Date(a.date).getFullYear() === thisYear).length;

    const lastVisit = (() => {
      const dates: Date[] = [];
      (logs || []).forEach((l) => dates.push(new Date(l.date)));
      (appointments || []).filter((a) => a.isCompleted).forEach((a) => dates.push(new Date(a.date)));
      dates.sort((a, b) => b.getTime() - a.getTime());
      return dates[0] || null;
    })();

    const valueLabel = client?.billingType === "monthly" && client?.monthlyRate
      ? `${client.monthlyRate}€/mês`
      : client?.billingType === "hourly" && client?.hourlyRate
        ? `${client.hourlyRate}€/h`
        : client?.billingType === "per_visit" && client?.perVisitRate
          ? `${client.perVisitRate}€/visita`
          : null;

    return {
      sinceYear: client?.createdAt ? new Date(client.createdAt).getFullYear() : null,
      visitsThisYear,
      lastVisit,
      valueLabel,
    };
  }, [client, logs, appointments]);

  const zoneLabel = (z: string) =>
    z === "Garden" ? "Jardim" : z === "Pool" ? "Piscina" : z === "Jacuzzi" ? "Jacuzzi" : z === "General" ? "Geral" : z;

  const zoneClass =
    nextVisit?.type === "Garden" ? "bg-green-100 text-green-700 border-green-200" :
    nextVisit?.type === "Pool" ? "bg-blue-100 text-blue-700 border-blue-200" :
    nextVisit?.type === "Jacuzzi" ? "bg-cyan-100 text-cyan-700 border-cyan-200" :
    "bg-muted text-muted-foreground border-border/40";

  const handleGenerateNote = async (logId: number) => {
    if (!client) return;
    setGeneratingNoteId(logId);
    try {
      const res = await fetch(`/api/service-logs/${logId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao carregar dados do serviço");
      const fullLog: ServiceLogWithEntries = await res.json();
      await generateServiceNote(fullLog, client);
      toast({ title: "PDF gerado", description: "A nota de despesa foi descarregada." });
    } catch {
      toast({ title: "Erro", description: "Não foi possível gerar a nota de despesa.", variant: "destructive" });
    } finally {
      setGeneratingNoteId(null);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-primary" /></div>;
  if (!client) return <div className="p-6 text-center text-muted-foreground">Cliente não encontrado</div>;

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Sub-header com navegação e acções de topo (Inspirado no Stitch) */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/40 px-4 py-2.5">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/clients"
              className="w-10 h-10 rounded-xl bg-card border border-border/50 text-foreground flex items-center justify-center active:scale-95 transition-all shadow-xs"
              data-testid="button-back"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <p className="text-[11px] font-bold text-primary uppercase tracking-wider">
                {client.locality || "Alentejo Litoral"}
              </p>
              <h2 className="text-base font-bold text-foreground leading-tight">Ficha de Cliente</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareClient}
              className="w-10 h-10 rounded-xl bg-card border border-border/50 text-foreground flex items-center justify-center active:scale-95 transition-all shadow-xs"
              aria-label="Partilhar Ficha"
              title="Partilhar ficha de cliente"
            >
              <Share2 className="w-4 h-4 text-foreground/80" />
            </button>
            {client.phone && (
              <a
                href={`tel:${client.phone}`}
                className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center active:scale-95 transition-all shadow-xs"
                aria-label="Contacto Direto"
                title="Ligar para cliente"
              >
                <Phone className="w-4 h-4 fill-primary/20" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-3 space-y-4">
        {/* Cartão de Perfil Principal com Imagem da Propriedade e Ações Rápidas */}
        <div className="rounded-2xl bg-card border border-border/40 shadow-sm overflow-hidden flex flex-col">
          {/* Banner Hero com Foto da Moradia */}
          <div className="relative h-48 sm:h-60 w-full bg-muted overflow-hidden">
            <input
              ref={housePhoto.inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={housePhoto.onFileChange}
            />

            {housePhoto.previewUrl || (client.housePhotoUrl && !heroImgError) ? (
              <img
                src={housePhoto.previewUrl || client.housePhotoUrl || ""}
                alt={`Propriedade de ${client.name}`}
                className="absolute inset-0 w-full h-full object-cover"
                onError={() => setHeroImgError(true)}
              />
            ) : (
              <button
                type="button"
                onClick={housePhoto.trigger}
                className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950/20 via-muted to-muted/80 hover:bg-muted/60 transition-colors cursor-pointer"
              >
                <Home className="w-12 h-12 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground font-medium mt-2">Toque para adicionar foto da propriedade</p>
              </button>
            )}

            {/* Gradiente de alto contraste */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

            {/* Badge de status no topo esquerdo */}
            <div className="absolute top-3 left-3 z-10">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-primary text-white shadow-md flex items-center gap-1.5 backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                {client.billingType === "monthly" ? "Plano Mensal · Ativo" : client.billingType === "per_visit" ? "Por Visita · Ativo" : "Cliente Ativo"}
              </span>
            </div>

            {/* Botão de câmara para alterar foto da moradia */}
            <button
              type="button"
              onClick={housePhoto.trigger}
              className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
              data-testid="button-change-house-photo"
              aria-label="Alterar foto da propriedade"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Spinner de upload da foto da moradia */}
            {housePhoto.isUploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}

            {/* Título & Proprietário sobre a foto */}
            <div className="absolute bottom-3 left-4 right-4 z-10 text-white flex items-end justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight drop-shadow-sm leading-snug truncate">
                  {client.name}
                </h1>
                <p className="text-xs sm:text-sm text-white/90 flex items-center gap-1.5 mt-0.5 drop-shadow-xs">
                  <User className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span className="truncate">Proprietário / Titular: {client.name}</span>
                </p>
              </div>

              {/* Avatar do cliente com crop interativo */}
              <div
                className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-white/80 bg-card flex items-center justify-center overflow-hidden shadow-lg shrink-0 group cursor-pointer"
                onClick={() => profileCropInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && profileCropInputRef.current?.click()}
                aria-label="Alterar foto de perfil"
              >
                <input
                  ref={profileCropInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) { setCropFile(file); setCropOpen(true); }
                    e.target.value = "";
                  }}
                />
                {profilePhoto.previewUrl || (client.profilePhotoUrl && !avatarImgError) ? (
                  <img
                    src={profilePhoto.previewUrl || client.profilePhotoUrl || ""}
                    alt={client.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={() => setAvatarImgError(true)}
                  />
                ) : null}
                <span className={cn("text-base font-extrabold text-primary transition-opacity", (profilePhoto.previewUrl || (client.profilePhotoUrl && !avatarImgError)) ? "opacity-0 group-hover:opacity-70" : "group-hover:opacity-70")}>
                  {getInitials(client.name)}
                </span>
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full pointer-events-none">
                  <Camera className="w-4 h-4 text-white" />
                </div>
                {profilePhoto.isUploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Corpo do Cartão: Morada, Tipologias e Ações de Campo */}
          <div className="p-4 flex flex-col space-y-3.5">
            {/* Morada e Geolocalização */}
            <div className="flex items-start justify-between gap-3 bg-muted/40 p-3 rounded-xl border border-border/40">
              <div className="flex items-start gap-2.5 min-w-0">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-tight truncate">
                    {client.address || "Sem morada especificada"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {client.locality || "Alentejo"} · Portugal
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-card border border-border/50 text-foreground shrink-0 shadow-xs">
                #C-{client.id}
              </span>
            </div>

            {/* Tags de Tipologia */}
            <div className="flex flex-wrap gap-1.5">
              {client.hasPool && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5" />
                  <span>Piscina {poolVolume ? `(${poolVolume} m³)` : "Privativa"}</span>
                </span>
              )}
              {client.hasGarden && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50 flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5" />
                  <span>Relvado & Jardim ({freqLabel(client.gardenVisitFrequency)})</span>
                </span>
              )}
              {client.hasJacuzzi && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200/50 flex items-center gap-1.5">
                  <ThermometerSun className="w-3.5 h-3.5" />
                  <span>Jacuzzi</span>
                </span>
              )}
              {client.serviceDurationMinutes && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5" />
                  <span>{formatDuration(client.serviceDurationMinutes)}</span>
                </span>
              )}
            </div>

            {/* Quick Action Buttons: Ergonomia de Campo com alvos táteis 48px */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <a
                href={client.phone ? `tel:${client.phone}` : "#"}
                className={cn(
                  "min-h-[48px] rounded-xl bg-muted/60 hover:bg-muted active:scale-95 transition-all flex items-center justify-center gap-2 text-foreground font-semibold text-sm border border-border/40",
                  !client.phone && "opacity-50 pointer-events-none"
                )}
                data-testid="button-call"
              >
                <Phone className="w-4 h-4 text-primary fill-primary/20" />
                <span>Ligar</span>
              </a>
              <a
                href={`https://wa.me/${(client.whatsapp || client.phone || "").replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "min-h-[48px] rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 active:scale-95 transition-all flex items-center justify-center gap-2 font-semibold text-sm border border-emerald-200/50",
                  !(client.whatsapp || client.phone) && "opacity-50 pointer-events-none"
                )}
                data-testid="button-whatsapp"
              >
                <SiWhatsapp className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp</span>
              </a>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[48px] rounded-xl bg-primary text-primary-foreground active:scale-95 transition-all flex items-center justify-center gap-2 font-semibold text-sm shadow-sm"
                data-testid="button-maps"
              >
                <Navigation className="w-4 h-4" />
                <span>GPS Waze</span>
              </a>
            </div>
          </div>
        </div>

        {/* Alerta Crítico: Protocolo de Entrada / Portão (Destacado para campo) */}
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3.5 shadow-xs flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Protocolo de Entrada & Acesso
              </span>
              <button
                type="button"
                onClick={() => handleCopyText(gateCode || client.notes || "", "Código ou notas de acesso")}
                className="text-amber-800 dark:text-amber-400 hover:opacity-75 text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-transform"
              >
                <Copy className="w-3.5 h-3.5" /> Copiar
              </button>
            </div>
            {gateCode ? (
              <p className="text-sm font-semibold text-foreground mt-1">
                Portão / Acesso: <span className="font-mono font-bold text-amber-900 dark:text-amber-200 bg-white/80 dark:bg-black/40 px-2 py-0.5 rounded border border-amber-300/60">{gateCode}</span>
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
              {client.notes || "Sem notas de acesso específicas registadas na ficha de cliente."}
            </p>
          </div>
        </div>

        {/* Barra de Ações Rápidas de Campo (Intervenção, Piscina, Fotos, Agenda) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="col-span-2 sm:col-span-1">
            <AddServiceLogDialog clientId={clientId} />
          </div>
          {client.hasPool && (
            <Button
              variant="outline"
              className="min-h-[44px] rounded-xl border-border/50 flex items-center justify-center gap-2 text-xs font-semibold active:scale-95 transition-transform"
              onClick={() => setPoolTestOpen(true)}
            >
              <Droplets className="w-4 h-4 text-blue-500" />
              <span>Teste Piscina</span>
            </Button>
          )}
          <Button
            variant="outline"
            className="min-h-[44px] rounded-xl border-border/50 flex items-center justify-center gap-2 text-xs font-semibold active:scale-95 transition-transform"
            onClick={() => setBeforeAfterOpen(true)}
          >
            <Camera className="w-4 h-4 text-emerald-600" />
            <span>Antes/Depois</span>
          </Button>
          <Link href={`/calendar?clientId=${clientId}`}>
            <Button
              variant="outline"
              className="w-full min-h-[44px] rounded-xl border-border/50 flex items-center justify-center gap-2 text-xs font-semibold active:scale-95 transition-transform"
              data-testid="button-schedule"
            >
              <Calendar className="w-4 h-4 text-primary" />
              <span>Agendar</span>
            </Button>
          </Link>
        </div>

        {/* Conteúdo Principal com Tabs Organizadas */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-card/90 backdrop-blur-sm p-1 rounded-xl mb-4 shadow-sm border border-border/40 flex overflow-x-auto">
            <TabsTrigger value="overview" className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Resumo</TabsTrigger>
            <TabsTrigger value="history" className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Serviços</TabsTrigger>
            <TabsTrigger value="timeline" className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Timeline</TabsTrigger>
            <TabsTrigger value="upcoming" className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Agenda</TabsTrigger>
            <TabsTrigger value="tasks" className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Tarefas</TabsTrigger>
            {client?.hasPool && (
              <TabsTrigger value="pool" className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Waves className="w-3.5 h-3.5 mr-1" /> Piscina
              </TabsTrigger>
            )}
            <TabsTrigger value="photos" className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <ImageIcon className="w-3.5 h-3.5 mr-1" /> Fotos
            </TabsTrigger>
            <TabsTrigger value="equipment" className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Wrench className="w-3.5 h-3.5 mr-1" /> Equip.
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Especificações Técnicas (Inspirado no Stitch) */}
            {(client.hasPool || client.hasGarden) && (
              <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Especificações Técnicas</h3>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Parâmetros de campo</span>
                </div>

                {/* Módulo Piscina com valores de referência */}
                {client.hasPool && (
                  <div className="bg-muted/40 rounded-xl p-3 space-y-2.5 border border-border/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Waves className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-semibold text-foreground">
                          Piscina Principal {poolVolume ? `(${poolVolume} m³)` : ""}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2.5 text-xs text-blue-600 font-semibold hover:bg-blue-50"
                        onClick={() => setPoolTestOpen(true)}
                      >
                        Registar Teste
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-card p-2 rounded-lg border border-border/30 shadow-2xs">
                        <span className="text-[10px] font-bold text-muted-foreground block">pH</span>
                        <span className="font-mono text-base font-bold text-primary">7.4</span>
                        <span className="text-[9px] text-emerald-600 block font-medium">Ideal (7.2 - 7.6)</span>
                      </div>
                      <div className="bg-card p-2 rounded-lg border border-border/30 shadow-2xs">
                        <span className="text-[10px] font-bold text-muted-foreground block">Cloro Livre</span>
                        <span className="font-mono text-base font-bold text-primary">1.8 <span className="text-[9px] font-normal">ppm</span></span>
                        <span className="text-[9px] text-emerald-600 block font-medium">Ideal (1 - 3 ppm)</span>
                      </div>
                      <div className="bg-card p-2 rounded-lg border border-border/30 shadow-2xs">
                        <span className="text-[10px] font-bold text-muted-foreground block">Alcalinidade</span>
                        <span className="font-mono text-base font-bold text-primary">110 <span className="text-[9px] font-normal">ppm</span></span>
                        <span className="text-[9px] text-emerald-600 block font-medium">Ótimo</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Módulo Jardim */}
                {client.hasGarden && (
                  <div className="bg-muted/40 rounded-xl p-3 space-y-1.5 border border-border/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Leaf className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-foreground">Jardim & Rega</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        {freqLabel(client.gardenVisitFrequency)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {client.notes ? client.notes.split("\n")[0] : "Manutenção de relvado e podas de época."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Resumo de Serviços */}
            <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Resumo de Serviços</h3>
              <div className="space-y-2">
                {client.hasGarden && (
                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2.5">
                      <Leaf className="w-4 h-4 text-primary" aria-hidden="true" />
                      <span className="text-sm font-medium">Jardim</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">{freqLabel(client.gardenVisitFrequency)}</span>
                    </div>
                  </div>
                )}
                {client.hasPool && (
                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2.5">
                      <Waves className="w-4 h-4 text-primary" aria-hidden="true" />
                      <span className="text-sm font-medium">Piscina</span>
                      {poolVolume && (
                        <span className="text-[10px] text-muted-foreground">({poolVolume} m³)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">{freqLabel(client.poolVisitFrequency)}</span>
                    </div>
                  </div>
                )}
                {client.hasJacuzzi && (
                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2.5">
                      <ThermometerSun className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                      <span className="text-sm font-medium">Jacuzzi</span>
                      {client.jacuzziLength && client.jacuzziWidth && client.jacuzziDepth && (
                        <span className="text-[10px] text-muted-foreground">({(client.jacuzziLength * client.jacuzziWidth * client.jacuzziDepth).toFixed(0)} m³)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">{freqLabel(client.jacuzziVisitFrequency)}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-border/30 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {client.paymentMethod && (
                  <span className="flex items-center gap-1">
                    {client.paymentMethod === "cash" && <><Banknote className="w-3 h-3" /> Dinheiro</>}
                    {client.paymentMethod === "bank_transfer" && <><Building2 className="w-3 h-3" /> Transferência{client.scheduledTransferDay && client.scheduledTransferDay > 0 ? ` (dia ${client.scheduledTransferDay})` : ""}</>}
                    {client.paymentMethod === "mbway" && <><Smartphone className="w-3 h-3" /> MBway</>}
                  </span>
                )}
                {client.serviceDurationMinutes && (
                  <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> {formatDuration(client.serviceDurationMinutes)}</span>
                )}
                {serviceStats && serviceStats.totalVisits > 0 && (
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {serviceStats.totalVisits} visitas</span>
                )}
              </div>
            </div>

            {/* Próxima Visita */}
            <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="w-4 h-4 text-primary" />
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Próxima Visita
                </h3>
              </div>

              {nextVisit ? (
                (() => {
                  const visitDate = new Date(nextVisit.date);
                  return (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-base font-extrabold text-foreground">
                          {format(visitDate, "d 'de' MMMM 'de' yyyy", { locale: pt })}
                        </p>
                        <span className="text-sm font-bold font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-lg">
                          {format(visitDate, "HH:mm")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 font-normal border", zoneClass)}>
                          {zoneLabel(nextVisit.type)}
                        </Badge>
                        {nextVisit.serviceType && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                            {nextVisit.serviceType}
                          </Badge>
                        )}
                        <Badge className="text-[10px] px-1.5 py-0 h-4 bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">
                          Agendado
                        </Badge>
                      </div>
                      {nextVisit.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{nextVisit.notes}</p>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="flex flex-col items-center py-2">
                  <p className="text-sm text-muted-foreground mb-3">Sem visita agendada</p>
                  <Link
                    href={`/calendar?clientId=${clientId}`}
                    data-testid="button-schedule-visit-empty"
                  >
                    <Button size="sm" className="h-8 px-4 text-xs rounded-xl gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" />
                      Agendar visita
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Estatísticas */}
            <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Estatísticas</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cliente desde</p>
                    <p className="text-sm font-extrabold text-foreground">
                      {clientStats.sinceYear || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Visitas {new Date().getFullYear()}</p>
                    <p className="text-sm font-extrabold text-foreground">{clientStats.visitsThisYear}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Última visita</p>
                    <p className="text-sm font-extrabold text-foreground">
                      {clientStats.lastVisit
                        ? format(clientStats.lastVisit, "d MMM", { locale: pt })
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Banknote className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Valor mensal</p>
                    <p className="text-sm font-extrabold text-foreground">{clientStats.valueLabel || "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Documentos */}
            <ClientDocumentsCard clientId={clientId} />

            {/* Notas Permanentes */}
            <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-primary" />
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Notas Permanentes</h3>
                </div>
                {!editingNotes && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={handleEditNotes}
                    data-testid="button-edit-notes"
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1" />
                    {client.notes ? "Editar" : "Adicionar"}
                  </Button>
                )}
              </div>

              {editingNotes ? (
                <div className="space-y-3">
                  <Textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    placeholder={"Portão lateral: #4192\nCão no jardim\nChave na caixa elétrica\nContactar antes de chegar"}
                    className="min-h-[100px] rounded-xl resize-y text-sm"
                    data-testid="textarea-notes"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="h-8 px-4 text-xs rounded-xl"
                      onClick={handleSaveNotes}
                      disabled={updateClient.isPending}
                      data-testid="button-save-notes"
                    >
                      {updateClient.isPending ? "A guardar..." : "Guardar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-4 text-xs rounded-xl"
                      onClick={handleCancelNotes}
                      data-testid="button-cancel-notes"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : client.notes ? (
                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{client.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Sem notas permanentes.</p>
              )}
            </div>

            {/* Estatísticas de Visitas */}
            {serviceStats && serviceStats.totalVisits > 0 && (
              <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-4">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Estatísticas de Visitas</h3>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <p className="text-lg font-bold">{serviceStats.totalVisits}</p>
                    <p className="text-[10px] text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{serviceStats.averageDurationMinutes}</p>
                    <p className="text-[10px] text-muted-foreground">Média min</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{serviceStats.averageWorkerCount.toFixed(1)}</p>
                    <p className="text-[10px] text-muted-foreground">Trab.</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{serviceStats.totalWorkerHours.toFixed(1)}</p>
                    <p className="text-[10px] text-muted-foreground">Horas</p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg">Registos de Serviço</h3>
              <div className="flex items-center gap-2">
                <Link
                  href={`/expense-notes?clientId=${clientId}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border/60 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" /> Notas
                </Link>
                <AddServiceLogDialog clientId={clientId} />
              </div>
            </div>

            {logs?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">Ainda sem histórico de serviço.</p>
            ) : (
              logs?.map((log) => (
                <div key={log.id} className="bg-card border border-border/50 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold bg-secondary px-2 py-0.5 rounded text-secondary-foreground">
                      {log.type === "Garden" ? "Jardim" : log.type === "Pool" ? "Piscina" : log.type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.date), "d 'de' MMM, yyyy")}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{log.description}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                    <span className="text-xs font-medium text-muted-foreground">
                      {(log.totalAmount ?? 0) > 0 ? `${(log.totalAmount ?? 0).toFixed(2)} €` : "—"}
                      {log.billingType === "extra" && (
                        <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                          Extra
                        </Badge>
                      )}
                    </span>
                    <Link
                      href={`/expense-notes/new?serviceLogId=${log.id}&clientId=${clientId}`}
                      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      data-testid={`button-generate-note-${log.id}`}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Criar Nota
                    </Link>
                  </div>
                </div>
              ))
            )}

            {/* Capturas Rápidas */}
            {quickPhotos && quickPhotos.length > 0 && (
              <div className="mt-8">
                <h3 className="font-bold text-lg mb-4">Capturas Rápidas</h3>
                {(() => {
                  const grouped = quickPhotos.reduce((acc, photo) => {
                    const category = photo.serviceType === "Outros" && photo.customCategory
                      ? photo.customCategory
                      : photo.serviceType || "Geral";
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(photo);
                    return acc;
                  }, {} as Record<string, typeof quickPhotos>);

                  const categoryIcons: Record<string, typeof Flower2> = {
                    "Jardim": Flower2,
                    "Piscina": Waves,
                    "Jacuzzi": Sparkles,
                    "Outros": FolderPlus,
                    "Geral": Camera,
                  };

                  const categoryOrder = ["Jardim", "Piscina", "Jacuzzi"];
                  const sortedCategories = [
                    ...categoryOrder.filter(c => grouped[c]),
                    ...Object.keys(grouped).filter(c => !categoryOrder.includes(c) && c !== "Outros" && c !== "Geral"),
                    ...(grouped["Outros"] ? ["Outros"] : []),
                    ...(grouped["Geral"] ? ["Geral"] : []),
                  ];

                  return sortedCategories.map((category) => {
                    const Icon = categoryIcons[category] || FolderPlus;
                    return (
                      <div key={category} className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">{category}</span>
                          <span className="text-xs text-muted-foreground">({grouped[category].length})</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {grouped[category].map((photo) => (
                            <div key={photo.id} className="relative group aspect-square">
                              <img
                                src={photo.photoUrl}
                                alt={`Captura - ${category}`}
                                className="w-full h-full object-cover rounded-lg"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-white hover:bg-white/20"
                                  onClick={() => deleteQuickPhoto.mutate(photo.id)}
                                  data-testid={`button-delete-quick-photo-${photo.id}`}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="absolute bottom-1 left-1 right-1 text-[10px] text-white bg-black/50 rounded px-1 truncate">
                                {format(new Date(photo.createdAt!), "dd/MM/yy")}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <ClientTimeline
              logs={logs || []}
              appointments={appointments || []}
              quickPhotos={quickPhotos || []}
              equipment={equipment}
              client={client}
              onPhotoClick={(photo) => setSelectedPhoto(photo)}
            />
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {activeTab === "upcoming" && <ClientAgendaTab clientId={clientId} estimatedDuration={client.serviceDurationMinutes || 60} />}
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            {activeTab === "tasks" && <ClientTasksTab clientId={clientId} clientName={client.name} />}
          </TabsContent>

          {client?.hasPool && (
            <TabsContent value="pool" className="space-y-4">
              {activeTab === "pool" && <ClientPoolTab client={client} />}
            </TabsContent>
          )}

          <TabsContent value="photos" className="space-y-4">
            {clientPhotos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {clientPhotos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    className="relative group aspect-square rounded-xl overflow-hidden border border-border/30 bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    onClick={() => setSelectedPhoto(photo)}
                    data-testid={`photo-${photo.id}`}
                  >
                    <img
                      src={photo.src}
                      alt={photo.type}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-[10px] font-semibold text-white truncate">{photo.type}</p>
                      {photo.date && (
                        <p className="text-[9px] text-white/70">
                          {format(new Date(photo.date), "dd/MM/yy")}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ImageIcon className="w-12 h-12 text-muted-foreground/25 mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  Ainda não existem fotos deste cliente
                </p>
                <Button
                  size="sm"
                  className="h-8 px-4 text-xs rounded-xl gap-1.5"
                  onClick={() => {
                    if (!client?.housePhotoUrl) {
                      housePhoto.trigger();
                    } else if (!client?.profilePhotoUrl) {
                      profilePhoto.trigger();
                    } else {
                      setBeforeAfterOpen(true);
                    }
                  }}
                  data-testid="button-add-first-photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Adicionar foto
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Photo Preview Dialog */}
          <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
            <DialogContent className="max-w-[90vw] max-h-[90vh] p-1 bg-black/95 border-0 rounded-2xl">
              <button
                type="button"
                className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                onClick={() => setSelectedPhoto(null)}
                data-testid="button-close-photo-preview"
              >
                <X className="w-4 h-4" />
              </button>
              {selectedPhoto && (
                <div className="flex flex-col items-center justify-center h-full">
                  <img
                    src={selectedPhoto.src}
                    alt={selectedPhoto.type}
                    className="max-w-full max-h-[75vh] object-contain rounded-xl"
                  />
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {selectedPhoto.type}
                    </Badge>
                    {selectedPhoto.date && (
                      <span className="text-xs text-white/60">
                        {format(new Date(selectedPhoto.date), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <TabsContent value="equipment" className="space-y-4">
            {activeTab === "equipment" && <ClientEquipmentTab clientId={clientId} />}
          </TabsContent>
        </Tabs>

        {/* Gestão do Cliente & Atalhos Adicionais */}
        {client && (
          <div className="pt-2 pb-6 space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Gestão do Cliente</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link href={`/quotes/new?clientId=${clientId}`}>
                <Button variant="outline" className="w-full rounded-xl gap-2 text-xs" data-testid="button-quote">
                  <FileText className="w-4 h-4 text-primary" />
                  Novo Orçamento
                </Button>
              </Link>
              <Link href={`/expense-notes/new?clientId=${clientId}`}>
                <Button variant="outline" className="w-full rounded-xl gap-2 text-xs" data-testid="button-expense-note">
                  <ClipboardList className="w-4 h-4 text-primary" />
                  Nota de Despesa
                </Button>
              </Link>
            </div>
            <Button
              variant="outline"
              className="w-full rounded-xl border-dashed"
              onClick={() => setEditOpen(true)}
              data-testid="button-edit-client"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Editar dados do cliente
            </Button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <EditClientDialog client={client!} open={editOpen} onOpenChange={setEditOpen} />

      <ImageCropperDialog
        open={cropOpen}
        onOpenChange={setCropOpen}
        file={cropFile}
        aspect={1}
        onCrop={(croppedFile) => profilePhoto.handleFile(croppedFile)}
      />

      <QuickPoolTestDialog
        open={poolTestOpen}
        onOpenChange={setPoolTestOpen}
        clientName={client.name}
        onSaveNotes={(summary) => {
          const updatedNotes = client.notes ? `${client.notes}\n\n[Registo de Teste Piscina]:\n${summary}` : `[Registo de Teste Piscina]:\n${summary}`;
          updateClient.mutate({ id: clientId, notes: updatedNotes } as any);
          toast({ title: "Teste registado", description: "Os parâmetros do teste foram adicionados às notas do cliente." });
        }}
      />

      <BeforeAfterPhotoDialog
        open={beforeAfterOpen}
        onOpenChange={setBeforeAfterOpen}
        clientName={client.name}
        onSave={(beforePhoto, afterPhoto) => {
          toast({ title: "Fotos capturadas", description: "Fotos Antes e Depois registadas para anexar aos serviços." });
        }}
      />
    </div>
  );
}
