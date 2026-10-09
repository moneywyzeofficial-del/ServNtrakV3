import { useAuth } from "@/hooks/use-auth";
import logoHorizontal from "@assets/Logo_ServNtrak_H.png";
import { useAppointments } from "@/hooks/use-appointments";
import { useClients } from "@/hooks/use-clients";
import { useUnpaidExtraServices } from "@/hooks/use-service-logs";
import { useDetailedWeather, getWeatherInfo } from "@/hooks/use-weather";
import { useGeofencing, type VisitaConcluida, type ClienteComLocalizacao } from "@/hooks/useGeofencing";
import { format, isToday, startOfDay, differenceInMinutes } from "date-fns";
import { pt } from "date-fns/locale";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useLocation } from "wouter";
import {
  Sun, Cloud, CloudSun, CloudRain, CloudDrizzle, Moon, CloudMoon,
  CloudLightning, CloudFog, Snowflake, Wind,
  AlertTriangle, MapPin, Navigation2,
  Droplets, Leaf, CheckCircle2, Camera,
  Loader2, CalendarClock, Plus, UserPlus, Mic,
  Locate, LocateOff, Clock, X, Check, Pencil,
  Navigation, AlertCircle, CreditCard, TrendingUp,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { DocumentScanDialog } from "@/components/DocumentScanDialog";
import VoiceToText from "@/components/VoiceToText";
import { PushHealthBanner } from "@/components/PushHealthBanner";
import { cn, formatDuration } from "@/lib/utils";
import type { PurchaseCategory, Store } from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const SERVICE_COLORS: Record<string, string> = {
  Garden:  "bg-primary/10 text-primary border-primary/20",
  Pool:    "bg-primary/10 text-primary border-primary/20",
  Jacuzzi: "bg-secondary text-secondary-foreground border-border",
  General: "bg-muted text-muted-foreground border-border",
};

const SERVICE_LABELS: Record<string, string> = {
  Garden:  "Jardim",
  Pool:    "Piscina",
  Jacuzzi: "Jacuzzi",
  General: "Geral",
};

function getServiceBadgeClass(type: string) {
  return SERVICE_COLORS[type] ?? SERVICE_COLORS.General;
}

function getServiceLabel(type: string) {
  return SERVICE_LABELS[type] ?? type;
}

const DAY_ICONS: Record<string, typeof Sun> = {
  sun: Sun, cloud: Cloud, "cloud-sun": CloudSun, "cloud-rain": CloudRain,
  "cloud-drizzle": CloudDrizzle, "cloud-lightning": CloudLightning,
  "cloud-fog": CloudFog, snowflake: Snowflake,
};
const NIGHT_ICONS: Record<string, typeof Moon> = {
  sun: Moon, "cloud-sun": CloudMoon, cloud: Cloud, "cloud-rain": CloudRain,
  "cloud-drizzle": CloudDrizzle, "cloud-lightning": CloudLightning,
  "cloud-fog": CloudFog, snowflake: Snowflake,
};

function CountdownBadge({ date }: { date: Date }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);
  const minutes = differenceInMinutes(date, new Date());
  if (minutes <= 0) return <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">A decorrer</span>;
  return <span className={`text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full ${minutes < 60 ? "animate-pulse" : ""}`}>em {formatDuration(minutes)}</span>;
}

function VisitaDuracaoAtiva({ inicio }: { inicio: Date }) {
  const [minutos, setMinutos] = useState(0);
  useEffect(() => {
    const calc = () => setMinutos(Math.max(0, Math.round((Date.now() - inicio.getTime()) / 60_000)));
    calc();
    const t = setInterval(calc, 30_000);
    return () => clearInterval(t);
  }, [inicio]);
  return <span className="tabular-nums font-bold">{formatDuration(minutos)}</span>;
}

export default function HomeAlt() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [ajustarVisita, setAjustarVisita] = useState<VisitaConcluida | null>(null);
  const [ajustarMinutos, setAjustarMinutos] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [showVoiceReport, setShowVoiceReport] = useState(false);
  const [voiceSummary, setVoiceSummary] = useState<string | null>(null);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [draft, setDraft] = useState<{ cliente: string; local: string; data: string; tarefas: string[] } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const { data: categories = [] } = useQuery<PurchaseCategory[]>({ queryKey: ['/api/purchase-categories'] });
  const { data: stores = [] } = useQuery<Store[]>({ queryKey: ['/api/stores'] });
  const { data: allClients = [] } = useClients();
  const { data: weatherData } = useDetailedWeather();

  const todayStart = useMemo(() => startOfDay(new Date()).toISOString(), []);

  const { data: appointments, isLoading } = useAppointments({ from: todayStart });
  const { data: unpaidServices } = useUnpaidExtraServices();

  const userName = user?.firstName || "Utilizador";

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 19) return "Boa tarde";
    return "Boa noite";
  })();

  const todayAppointments = useMemo(
    () =>
      (appointments?.filter(apt => isToday(new Date(apt.date))) ?? []).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    [appointments]
  );

  const completedToday = todayAppointments.filter(a => a.isCompleted);
  const nextAppointment = todayAppointments.find(a => !a.isCompleted);
  const unpaidTotal = unpaidServices?.reduce((s, x) => s + (x.totalAmount ?? 0), 0) ?? 0;
  const unpaidCount = unpaidServices?.length ?? 0;

  const clientesGeofencing: ClienteComLocalizacao[] = useMemo(
    () =>
      todayAppointments
        .filter(ag => !ag.isCompleted && ag.client?.latitude && ag.client?.longitude)
        .map(ag => ({
          id: ag.client.id,
          nome: ag.client.name,
          latitude: ag.client.latitude!,
          longitude: ag.client.longitude!,
          agendamentoId: ag.id,
        })),
    [todayAppointments]
  );

  const handleEntrada = useCallback(async (evento: { agendamentoId?: number; clienteId: number; timestamp: Date }) => {
    try {
      await fetch("/api/geofencing/arrival", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          clientId: evento.clienteId,
          appointmentId: evento.agendamentoId,
          timestamp: evento.timestamp.toISOString(),
        }),
      });
    } catch (err) {
      console.error("Erro ao registar chegada:", err);
    }
  }, []);

  const geo = useGeofencing(clientesGeofencing, {
    raioMetros: 75,
    onEntrada: handleEntrada,
  });

  const finalizarVisita = useCallback(async (visita: VisitaConcluida, duracaoOverride?: number) => {
    try {
      const res = await fetch("/api/geofencing/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          clientId: visita.clienteId,
          appointmentId: visita.agendamentoId,
          inicio: visita.inicio.toISOString(),
          fim: visita.fim.toISOString(),
          duracaoMinutos: duracaoOverride ?? visita.duracaoMinutos,
          fonte: "geofencing",
        }),
      });
      if (!res.ok) return;
      geo.confirmarVisita(visita);
      queryClient.invalidateQueries({ queryKey: [api.appointments.list.path] });
    } catch (err) {
      console.error("Erro ao guardar visita:", err);
    }
  }, [geo, queryClient]);

  const ignorarVisita = useCallback(async (visita: VisitaConcluida) => {
    try {
      await fetch("/api/geofencing/discard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ clientId: visita.clienteId, appointmentId: visita.agendamentoId }),
      });
    } catch (err) {
      console.error("Erro ao descartar visita:", err);
    }
    geo.confirmarVisita(visita);
  }, [geo]);

  const handleVoiceSubmit = useCallback(async (text: string) => {
    setVoiceLoading(true);
    setVoiceSummary(null);
    try {
      const res = await fetch("/api/ai/process-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (res.ok) {
        setDraft(data);
        setShowModal(true);
      } else {
        setVoiceSummary(`Erro: ${data.message ?? "Não foi possível processar o agendamento."}`);
      }
    } catch {
      setVoiceSummary("Erro de ligação ao servidor.");
    } finally {
      setVoiceLoading(false);
    }
  }, []);

  const getAptStatus = (apt: typeof todayAppointments[number]) => {
    if (apt.isCompleted) return "completed";
    if (apt.id === nextAppointment?.id) return "next";
    return "pending";
  };

  const weatherInfo = weatherData ? getWeatherInfo(weatherData.weatherCode) : null;
  const WeatherIconHero = weatherData
    ? weatherData.isDay
      ? (DAY_ICONS[weatherInfo?.icon ?? "sun"] ?? Sun)
      : (NIGHT_ICONS[weatherInfo?.icon ?? "sun"] ?? Moon)
    : Sun;

  const progress = todayAppointments.length > 0
    ? Math.round((completedToday.length / todayAppointments.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background pb-24 page-transition">

      {/* ── HERO HEADER ─────────────────────────── */}
      <header className="relative overflow-hidden px-5 pt-4 pb-5 gradient-primary gradient-mesh">
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
            <div className="bg-white/95 rounded-lg px-2 py-1.5 shadow-sm">
              <img src={logoHorizontal} alt="ServNtrak" className="h-5 block" />
            </div>
            <div className="flex items-center gap-2.5">
              {weatherData && (
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
                  <WeatherIconHero className="w-4 h-4 text-white" strokeWidth={2.5} />
                  <span className="text-xs font-bold text-white">{Math.round(weatherData.temperature)}°</span>
                  {weatherData.windSpeed >= 10 && (
                    <>
                      <span className="text-white/30">·</span>
                      <Wind className="w-3 h-3 text-white/80" />
                      <span className="text-[10px] font-semibold text-white/80">{Math.round(weatherData.windSpeed)}</span>
                    </>
                  )}
                </div>
              )}
              <div className="w-9 h-9 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          <p className="text-white/75 text-[11px] font-semibold tracking-wide uppercase mb-1">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: pt })}
          </p>
          <h1 className="text-white text-[22px] font-extrabold tracking-tight leading-tight" data-testid="text-greeting">
            {greeting}, {userName}
          </h1>

          <div className="flex gap-2.5 mt-4">
            <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/15">
              <p className="text-white/70 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Visitas</p>
              <p className="text-white text-xl font-extrabold tabular-nums">
                {isLoading ? "…" : todayAppointments.length}
              </p>
            </div>
            <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/15">
              <p className="text-white/70 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Concluídas</p>
              <p className="text-white text-xl font-extrabold tabular-nums">
                {isLoading ? "…" : completedToday.length}
              </p>
            </div>
            <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/15">
              <p className="text-white/70 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Próxima</p>
              <p className="text-white text-sm font-extrabold tabular-nums truncate">
                {isLoading ? "…" : nextAppointment ? format(new Date(nextAppointment.date), "HH:mm") : "--:--"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pt-5">

        {/* ── ALERTS ─────────────────────────────── */}
        <div className="mb-4">
          <PushHealthBanner variant="prominent" />
        </div>

        {geo.erro && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-start gap-3 mb-4" data-testid="alert-gps-error">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">Problema com GPS</p>
              <p className="text-xs text-destructive/80 mt-0.5">{geo.erro}</p>
            </div>
          </div>
        )}

        {/* ── ACTIVE VISIT ───────────────────────── */}
        {geo.visitaAtiva && (
          <div
            className="relative overflow-hidden rounded-2xl mb-4 shadow-lg"
            style={{ background: "var(--gradient-primary)" }}
            data-testid="card-active-visit"
          >
            <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute right-4 bottom-4 w-20 h-20 bg-white/5 rounded-full blur-xl pointer-events-none" />
            <div className="relative z-10 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/80">Em visita</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{geo.visitaAtiva.clienteNome}</h3>
              <div className="flex items-center gap-4 text-white/85 text-sm">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Início: {geo.visitaAtiva.inicio.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <VisitaDuracaoAtiva inicio={geo.visitaAtiva.inicio} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PENDING CONFIRMATIONS ──────────────── */}
        {geo.visitasPendentesConfirmacao.map(visita => (
          <div
            key={`${visita.clienteId}-${visita.inicio.getTime()}`}
            className="bg-card rounded-2xl shadow-sm border border-border p-4 space-y-4 mb-4"
            data-testid={`card-confirm-visit-${visita.clienteId}`}
          >
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2.5 rounded-full shrink-0">
                <CheckCircle2 className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Visita concluída</p>
                <h4 className="font-bold text-foreground text-lg truncate">{visita.clienteNome}</h4>
              </div>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-foreground/70">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="tabular-nums">
                  {visita.inicio.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                  {" → "}
                  {visita.fim.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <span className="font-bold text-primary text-sm tabular-nums">{visita.duracaoMinutos} min</span>
            </div>

            {ajustarVisita?.clienteId === visita.clienteId && ajustarVisita.inicio.getTime() === visita.inicio.getTime() ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="flex-1 border border-input rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Duração real (min)"
                  value={ajustarMinutos}
                  onChange={e => setAjustarMinutos(e.target.value)}
                  autoFocus
                  data-testid="input-adjust-duration"
                />
                <button
                  className="bg-primary text-primary-foreground p-2.5 rounded-xl active:scale-95 transition-transform"
                  onClick={() => {
                    const mins = parseInt(ajustarMinutos);
                    if (mins > 0) finalizarVisita(visita, mins);
                    setAjustarVisita(null);
                    setAjustarMinutos("");
                  }}
                  data-testid="button-save-adjusted"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  className="bg-muted text-muted-foreground p-2.5 rounded-xl active:scale-95 transition-transform"
                  onClick={() => { setAjustarVisita(null); setAjustarMinutos(""); }}
                  data-testid="button-cancel-adjust"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm"
                  onClick={() => finalizarVisita(visita)}
                  data-testid="button-confirm-visit"
                >
                  <Check className="w-4 h-4" /> Confirmar
                </button>
                <button
                  className="bg-secondary text-secondary-foreground font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
                  onClick={() => { setAjustarVisita(visita); setAjustarMinutos(String(visita.duracaoMinutos)); }}
                  data-testid="button-adjust-visit"
                >
                  <Pencil className="w-3.5 h-3.5" /> Ajustar
                </button>
                <button
                  className="bg-muted text-muted-foreground font-bold py-3 px-4 rounded-xl active:scale-[0.98] transition-transform"
                  onClick={() => ignorarVisita(visita)}
                  data-testid="button-ignore-visit"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}

        {/* ── QUICK ACTIONS ──────────────────────── */}
        <div className="grid grid-cols-4 gap-2.5 mb-6">
          {[
            { label: "Nova Visita", Icon: Plus, href: "/new-appointment", testid: "button-quick-new-visit" },
            { label: "Cliente", Icon: UserPlus, href: "/clients/new", testid: "button-quick-new-client" },
            { label: "Voz", Icon: Mic, onClick: () => { setShowVoiceReport(v => !v); setVoiceSummary(null); }, testid: "button-quick-voice" },
            { label: "Scanner", Icon: Camera, onClick: () => setScanOpen(true), testid: "button-quick-scan" },
          ].map(action => {
            const inner = (
              <div className="flex flex-col items-center gap-1.5 py-3 px-2">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <action.Icon className="w-5 h-5 text-primary" strokeWidth={2} />
                </div>
                <span className="text-[11px] font-semibold text-foreground/80 text-center">{action.label}</span>
              </div>
            );
            return action.href ? (
              <Link key={action.label} href={action.href} className="bg-card rounded-2xl border border-border active:scale-[0.97] transition-transform" data-testid={action.testid}>
                {inner}
              </Link>
            ) : (
              <button key={action.label} onClick={action.onClick} className="bg-card rounded-2xl border border-border active:scale-[0.97] transition-transform" data-testid={action.testid}>
                {inner}
              </button>
            );
          })}
        </div>

        {/* ── TODAY'S TIMELINE ───────────────────── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground">Hoje</h2>
            {!isLoading && todayAppointments.length > 0 && (
              <span className="text-xs font-semibold text-muted-foreground">
                {completedToday.length} de {todayAppointments.length} concluídas
              </span>
            )}
          </div>

          {todayAppointments.length > 0 && (
            <div className="w-full h-1.5 bg-muted rounded-full mb-4 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : todayAppointments.length > 0 ? (
            <div className="relative pl-3">
              <div className="absolute top-4 bottom-8 left-[23.5px] w-0.5 bg-primary/20 rounded-full" />

              <div className="space-y-4">
                {todayAppointments.map((apt) => {
                  const status = getAptStatus(apt);
                  const isCompleted = status === "completed";
                  const isNext = status === "next";
                  const isPending = status === "pending";
                  const aptDate = new Date(apt.date);

                  return (
                    <div key={apt.id} className="relative flex gap-4 items-start group" data-testid={`card-appointment-${apt.id}`}>
                      <div className="relative z-10 flex flex-col items-center mt-1 shrink-0">
                        {isCompleted && (
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                            <Check className="w-3.5 h-3.5" strokeWidth={3} />
                          </div>
                        )}
                        {isNext && (
                          <div className="w-6 h-6 rounded-full bg-card border-[3px] border-primary flex items-center justify-center shadow-md ring-4 ring-primary/10">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          </div>
                        )}
                        {isPending && (
                          <div className="w-6 h-6 rounded-full bg-card border-2 border-border flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                          </div>
                        )}
                      </div>

                      <Link href={`/clients/${apt.clientId}`} className="flex-1 min-w-0">
                        <div className={cn(
                          "rounded-2xl p-4 transition-all",
                          isNext
                            ? "bg-card border-2 border-primary shadow-lg shadow-primary/5 scale-[1.02]"
                            : isCompleted
                              ? "bg-card/60 border border-border"
                              : "bg-card border border-border shadow-sm"
                        )}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-[15px] font-bold tabular-nums",
                                isCompleted ? "text-muted-foreground" : isNext ? "text-primary" : "text-foreground"
                              )}>
                                {format(aptDate, "HH:mm")}
                              </span>
                              {isNext && <CountdownBadge date={aptDate} />}
                            </div>
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider",
                              getServiceBadgeClass(apt.type)
                            )}>
                              {getServiceLabel(apt.type)}
                            </span>
                          </div>

                          <h3 className={cn(
                            "text-[17px] font-bold tracking-tight mb-1",
                            isCompleted ? "text-foreground/50 line-through decoration-muted-foreground/30" : "text-foreground"
                          )}>
                            {apt.client.name}
                          </h3>

                          {apt.client.address && (
                            <div className={cn(
                              "flex items-start gap-1.5 text-[13px] mt-2",
                              isCompleted ? "text-muted-foreground" : "text-foreground/60"
                            )}>
                              <MapPin className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2.5} />
                              <span className="leading-tight font-medium">{apt.client.address}</span>
                            </div>
                          )}

                          {isNext && apt.client.address && (
                            <div className="mt-4 pt-4 border-t border-border flex gap-2.5">
                              <button
                                className="flex-1 bg-primary text-primary-foreground text-[13px] font-bold py-2.5 rounded-xl transition-colors flex justify-center items-center gap-2"
                                onClick={e => {
                                  e.preventDefault();
                                  window.open(`https://maps.google.com/maps?q=${encodeURIComponent(apt.client.address!)}`, "_blank");
                                }}
                                data-testid="button-navigate-maps"
                              >
                                <Navigation className="w-4 h-4" />
                                Iniciar Rota
                              </button>
                              <Link
                                href={`/clients/${apt.clientId}`}
                                onClick={e => e.stopPropagation()}
                              >
                                <button
                                  className="px-4 bg-secondary text-secondary-foreground rounded-xl transition-colors font-bold flex justify-center items-center"
                                  data-testid="button-view-client"
                                  aria-label="Ver cliente"
                                >
                                  <CheckCircle2 className="w-5 h-5" />
                                </button>
                              </Link>
                            </div>
                          )}
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border p-8 flex flex-col items-center text-center shadow-sm" data-testid="card-no-appointments">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <CalendarClock className="w-7 h-7 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-foreground text-lg">Sem trabalhos para hoje</h3>
              <p className="text-muted-foreground text-sm mt-1">Aproveite o seu dia!</p>
              <Link href="/calendar">
                <button className="mt-4 text-sm font-bold text-primary bg-primary/10 border border-primary/20 px-4 py-2 rounded-full" data-testid="button-schedule-appointment">
                  Agendar trabalho
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* ── WEATHER ────────────────────────────── */}
        {weatherData && (
          <div
            className="bg-card rounded-2xl border border-border p-4 mb-6 shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
            onClick={() => navigate("/weather")}
            data-testid="weather-card"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <WeatherIconHero className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-foreground">{Math.round(weatherData.temperature)}°</span>
                  <span className="text-sm text-muted-foreground capitalize">{weatherInfo?.description}</span>
                </div>
                {weatherData.todayForecast && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {weatherData.todayForecast.temperatureMin}° / {weatherData.todayForecast.temperatureMax}° · vento {weatherData.todayForecast.windDirection} · IPMA
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {weatherData.windSpeed >= 10 && (
                  <div className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
                    <Wind className="w-4 h-4" />
                    <span>{Math.round(weatherData.windSpeed)} km/h</span>
                  </div>
                )}
                {weatherData.todayForecast && weatherData.todayForecast.precipitationProbability > 0 && (
                  <div className="flex items-center gap-1 text-primary text-xs font-medium">
                    <Droplets className="w-4 h-4" />
                    <span>{weatherData.todayForecast.precipitationProbability}%</span>
                  </div>
                )}
              </div>
            </div>
            {weatherData.alerts.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {weatherData.alerts.map((alert, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl",
                      alert.severity === "danger"
                        ? "bg-destructive/10 text-destructive border border-destructive/20"
                        : "bg-muted text-muted-foreground border border-border"
                    )}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{alert.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PENDING PAYMENTS ──────────────────── */}
        {unpaidCount > 0 && (
          <Link href="/billing" data-testid="link-unpaid-strip">
            <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
              <div className="bg-destructive/20 p-2 rounded-full mt-0.5 shrink-0">
                <AlertCircle className="w-5 h-5 text-destructive" strokeWidth={2.5} aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h4 className="text-[14px] font-bold text-destructive">Pagamentos Pendentes</h4>
                <p className="text-[13px] text-destructive/80 mt-0.5 font-medium" data-testid="text-unpaid-total">
                  Tem {unpaidTotal.toFixed(2)}€ ({unpaidCount} serviço{unpaidCount !== 1 ? "s" : ""}) por cobrar.
                </p>
                <span className="mt-3 inline-block text-[12px] font-bold text-destructive bg-destructive/20 px-3 py-1.5 rounded-lg">
                  Cobrar Agora
                </span>
              </div>
            </div>
          </Link>
        )}

        {/* ── SUBMENUS ──────────────────────────── */}
        <div className="mb-6 space-y-3">
          {[
            {
              id: "work",
              title: "Agenda & Tarefas",
              subtitle: "Gerir trabalhos e lembretes",
              items: [
                { Icon: CalendarClock, label: "Calendário", desc: "Ver agenda completa", href: "/calendar" },
                { Icon: Navigation2, label: "Mapa", desc: "Ver clientes no mapa", href: "/map" },
              ],
            },
            {
              id: "people",
              title: "Clientes & Equipa",
              subtitle: "Base de dados e colaboradores",
              items: [
                { Icon: UserPlus, label: "Novo Cliente", desc: "Adicionar cliente", href: "/clients/new" },
                { Icon: TrendingUp, label: "Relatórios", desc: "Ver relatórios", href: "/reports" },
              ],
            },
            {
              id: "finance",
              title: "Finanças",
              subtitle: "Faturação e pagamentos",
              items: [
                { Icon: CreditCard, label: "Faturação", desc: "Gerir faturas", href: "/billing" },
                { Icon: TrendingUp, label: "Finanças", desc: "Resumo financeiro", href: "/finances" },
              ],
            },
          ].map(group => (
            <div key={group.id} className="bg-card rounded-2xl border border-border overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left"
                onClick={() => setOpenSubmenu(openSubmenu === group.id ? null : group.id)}
                data-testid={`button-action-group-${group.id}`}
              >
                <div>
                  <h4 className="text-sm font-bold text-foreground">{group.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{group.subtitle}</p>
                </div>
                <span className={cn(
                  "text-muted-foreground transition-transform duration-200",
                  openSubmenu === group.id && "rotate-180"
                )}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </button>
              {openSubmenu === group.id && (
                <div className="px-4 pb-4 space-y-2">
                  {group.items.map(item => (
                    <Link key={item.href} href={item.href} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors" data-testid={`link-submenu-${item.href}`}>
                      <div className="w-9 h-9 rounded-xl bg-background flex items-center justify-center border border-border shrink-0">
                        <item.Icon className="w-4 h-4 text-foreground/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── GPS TRACKING ──────────────────────── */}
        <div className="bg-card rounded-2xl border border-border p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
              geo.ativo ? "bg-primary/10" : "bg-muted"
            )}>
              <Locate className={cn("w-5 h-5", geo.ativo ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Tracking GPS</p>
              <p className="text-xs text-muted-foreground">
                {geo.ativo
                  ? geo.posicaoAtual
                    ? `Activo · última actualização ${geo.ultimoUpdate ? format(geo.ultimoUpdate, "HH:mm") : "…"}`
                    : "Activo · à procura de sinal…"
                  : "Inactivo · registo de visitas por geofencing"}
              </p>
            </div>
          </div>
          <button
            onClick={geo.ativo ? geo.parar : geo.iniciar}
            className={cn(
              "w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
              geo.ativo
                ? "bg-destructive/10 text-destructive border border-destructive/20"
                : "bg-primary text-primary-foreground shadow-sm"
            )}
            data-testid="button-toggle-tracking"
          >
            {geo.ativo ? (
              <>
                <LocateOff className="w-4 h-4" />
                Pausar tracking
              </>
            ) : (
              <>
                <Locate className="w-4 h-4" />
                Iniciar tracking
              </>
            )}
          </button>
        </div>

      </main>

      <DocumentScanDialog open={scanOpen} onOpenChange={setScanOpen} categories={categories} stores={stores} />

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar Agendamento?</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="space-y-3 py-2 text-sm">
              <div className="flex gap-2 items-center">
                <span className="font-bold text-muted-foreground w-20 shrink-0">Cliente:</span>
                <input
                  className="flex-1 border border-input rounded-lg px-2 py-1 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={draft.cliente}
                  list="client-suggestions"
                  onChange={e => setDraft(prev => prev ? { ...prev, cliente: e.target.value } : prev)}
                />
                <datalist id="client-suggestions">
                  {(() => {
                    const normalise = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
                    const q = normalise(draft.cliente);
                    return allClients
                      .filter(c => normalise(c.name).includes(q) || (q.length >= 3 && normalise(c.address ?? "").includes(q)))
                      .map(c => <option key={c.id} value={c.name} />);
                  })()}
                </datalist>
              </div>
              {draft.local && (
                <div className="flex gap-2">
                  <span className="font-bold text-muted-foreground w-20 shrink-0">Local:</span>
                  <span className="text-foreground">{draft.local}</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="font-bold text-muted-foreground w-20 shrink-0">Data:</span>
                <span className="text-foreground">
                  {draft.data ? (() => {
                    try { return format(new Date(draft.data + "T00:00:00"), "d 'de' MMMM", { locale: pt }); }
                    catch { return draft.data; }
                  })() : "—"}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-muted-foreground w-20 shrink-0">Tarefas:</span>
                <ul className="list-disc list-inside space-y-0.5 text-foreground">
                  {draft.tarefas.map((t: string, i: number) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)} disabled={confirmLoading}>
              Corrigir
            </Button>
            <Button
              className="flex-1"
              disabled={confirmLoading}
              onClick={async () => {
                if (!draft) return;
                setConfirmLoading(true);
                try {
                  const res = await fetch("/api/ai/confirm-schedule", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(draft),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    queryClient.invalidateQueries({ queryKey: [api.appointments.list.path] });
                    setShowModal(false);
                    setShowVoiceReport(false);
                    setDraft(null);
                    setVoiceSummary(data.message ?? "Agendamento guardado.");
                  } else {
                    setShowModal(false);
                    setVoiceSummary(`Erro: ${data.message ?? "Não foi possível guardar."}`);
                  }
                } catch {
                  setShowModal(false);
                  setVoiceSummary("Erro de ligação ao servidor.");
                } finally {
                  setConfirmLoading(false);
                }
              }}
            >
              {confirmLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar e Gravar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showVoiceReport && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-end" onClick={() => setShowVoiceReport(false)}>
          <div className="w-full bg-background rounded-t-3xl p-5 pb-24 space-y-4 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-foreground">Relatório de Voz</h2>
              <button onClick={() => setShowVoiceReport(false)} className="p-1 text-muted-foreground hover:text-foreground" data-testid="button-close-voice-report">
                <X className="w-5 h-5" />
              </button>
            </div>
            <VoiceToText onFinalText={handleVoiceSubmit} />
            {voiceLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                A processar relato…
              </div>
            )}
            {voiceSummary && !voiceLoading && (
              <div className="bg-muted rounded-2xl p-4 space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Relatório organizado</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{voiceSummary}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
