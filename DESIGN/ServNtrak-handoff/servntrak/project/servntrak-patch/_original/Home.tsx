import { useAuth } from "@/hooks/use-auth";
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
  FileText, BarChart2, Loader2, CalendarClock, ShoppingBag, Users, ClipboardList, Tag,
  Locate, LocateOff, Clock, X, Check, Pencil,
  Plus, Navigation, AlertCircle, Map, UserPlus, CreditCard, TrendingUp, Download, Bell, Mic,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { DocumentScanDialog } from "@/components/DocumentScanDialog";
import VoiceToText from "@/components/VoiceToText";
import { PushHealthBanner } from "@/components/PushHealthBanner";
import { cn } from "@/lib/utils";
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
  Jacuzzi: "bg-secondary/50 text-secondary-foreground border-border",
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

function WeatherStrip() {
  const { data: weather, isLoading } = useDetailedWeather();

  if (isLoading || !weather) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <Sun className="w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
        <span>--°C</span>
      </div>
    );
  }

  const info = getWeatherInfo(weather.weatherCode);
  const WeatherIcon = weather.isDay
    ? (DAY_ICONS[info.icon] ?? Sun)
    : (NIGHT_ICONS[info.icon] ?? Moon);

  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
      <WeatherIcon className="w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
      <span>{Math.round(weather.temperature)}°C</span>
    </div>
  );
}


function WeatherCard() {
  const { data: weather, isLoading } = useDetailedWeather();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm animate-pulse mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="w-20 h-6 bg-slate-100 rounded" />
            <div className="w-32 h-4 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="flex gap-3">
          {[1,2,3,4].map(i => <div key={i} className="flex-1 h-16 bg-slate-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const info = getWeatherInfo(weather.weatherCode);
  const WeatherIcon = weather.isDay
    ? (DAY_ICONS[info.icon] ?? Sun)
    : (NIGHT_ICONS[info.icon] ?? Moon);

  const isRainy = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 21].includes(weather.weatherCode);
  const isClear = weather.weatherCode === 1;
  const isStormy = [19, 20, 23].includes(weather.weatherCode);

  const iconBg = weather.isDay
    ? isClear ? "bg-muted" : isRainy ? "bg-blue-50" : isStormy ? "bg-purple-50" : "bg-slate-100"
    : "bg-indigo-50";
  const iconColor = weather.isDay
    ? isClear ? "text-muted-foreground" : isRainy ? "text-blue-500" : isStormy ? "text-purple-500" : "text-slate-500"
    : "text-indigo-400";

  const upcomingHours = weather.hourly.slice(0, 8);

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
      onClick={() => navigate("/weather")}
      data-testid="weather-card"
    >
      {/* Current conditions */}
      <div className="p-4">
        <div className="flex items-center gap-4">
          <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
            <WeatherIcon className={cn("w-8 h-8", iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-slate-900">{Math.round(weather.temperature)}°</span>
              <span className="text-sm text-slate-400 font-medium">C</span>
              {weather.todayForecast && (
                <span className="text-xs text-slate-400 font-medium ml-1">
                  {weather.todayForecast.temperatureMin}° / {weather.todayForecast.temperatureMax}°
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5 capitalize">{info.description}</p>
          </div>
          <div className="flex flex-col gap-1.5 items-end shrink-0">
            {weather.windSpeed >= 10 && (
              <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                <Wind className="w-3.5 h-3.5" />
                <span>{Math.round(weather.windSpeed)} km/h</span>
              </div>
            )}
            {weather.todayForecast && weather.todayForecast.precipitationProbability > 0 && (
              <div className="flex items-center gap-1 text-blue-400 text-xs font-medium">
                <Droplets className="w-3.5 h-3.5" />
                <span>{weather.todayForecast.precipitationProbability}%</span>
              </div>
            )}
            <span className="text-[10px] text-slate-300 font-medium">IPMA</span>
          </div>
        </div>

        {weather.alerts.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {weather.alerts.map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl",
                  alert.severity === "danger"
                    ? "bg-red-50 text-red-700 border border-red-200"
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

      {/* Hourly forecast strip */}
      {upcomingHours.length > 0 && (
        <div className="border-t border-slate-100 px-2 py-2">
          <div className="flex gap-1 overflow-x-auto hide-scrollbar">
            {upcomingHours.map((h, i) => {
              const hInfo = getWeatherInfo(h.weatherCode);
              const HIcon = DAY_ICONS[hInfo.icon] ?? Cloud;
              const isFirst = i === 0;
              return (
                <div
                  key={h.datetime}
                  className={cn(
                    "shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[56px]",
                    isFirst ? "bg-primary/10 border border-primary/20" : ""
                  )}
                >
                  <span className={cn(
                    "text-[10px] font-bold",
                    isFirst ? "text-primary" : "text-slate-400"
                  )}>
                    {h.hour}
                  </span>
                  <HIcon className={cn("w-5 h-5", isFirst ? "text-primary" : "text-slate-400")} strokeWidth={1.5} />
                  {h.precipitationProbability > 20 && (
                    <div className="flex items-center gap-0.5 text-blue-400">
                      <Droplets className="w-2.5 h-2.5" />
                      <span className="text-[9px] font-semibold">{h.precipitationProbability}%</span>
                    </div>
                  )}
                  <span className={cn(
                    "text-[11px] font-bold",
                    isFirst ? "text-slate-700" : "text-slate-600"
                  )}>
                    {h.temperature}°
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CountdownBadge({ date }: { date: Date }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);
  const minutes = differenceInMinutes(date, new Date());
  if (minutes <= 0) return <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">A decorrer</span>;
  if (minutes < 60) return <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full animate-pulse">em {minutes} min</span>;
  return <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">em {Math.floor(minutes / 60)}h</span>;
}

function VisitaDuracaoAtiva({ inicio }: { inicio: Date }) {
  const [minutos, setMinutos] = useState(0);
  useEffect(() => {
    const calc = () => setMinutos(Math.max(0, Math.round((Date.now() - inicio.getTime()) / 60_000)));
    calc();
    const t = setInterval(calc, 30_000);
    return () => clearInterval(t);
  }, [inicio]);
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return <span className="tabular-nums font-bold">{h > 0 ? `${h}h ${m}min` : `${m} min`}</span>;
}

export default function Home() {
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

  return (
    <div className="min-h-screen bg-background pb-24 page-transition">

      {/* ── HERO HEADER ─────────────────────────────── */}
      <header
        className="relative overflow-hidden px-5 pt-12 pb-5"
        style={{ background: "linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 70%, #000) 100%)" }}
      >
        {/* gradient mesh overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(at 40% 20%, rgba(255,255,255,0.18) 0px, transparent 50%),
                       radial-gradient(at 80% 0%, rgba(0,0,0,0.18) 0px, transparent 50%),
                       radial-gradient(at 0% 100%, rgba(0,0,0,0.12) 0px, transparent 50%)`
        }} />
        <div className="relative flex justify-between items-center mb-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-white/30">
            <img src="/logo.png" alt="ServNtrak" className="h-5" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span className="text-white font-bold text-sm hidden">ServNtrak</span>
          </div>
          <div className="flex items-center gap-2">
            {weatherData && (
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1 border border-white/20">
                <Sun className="w-3.5 h-3.5 text-white" />
                <span className="text-xs font-bold text-white">{Math.round(weatherData.temperature)}°C</span>
              </div>
            )}
            <div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white text-sm font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
        <div className="relative">
          <p className="text-white/70 text-xs font-semibold tracking-wide uppercase mb-1">
            {format(new Date(), "EEEE, d MMM", { locale: pt })}
          </p>
          <h1 className="text-white text-2xl font-extrabold tracking-tight leading-tight" data-testid="text-greeting">
            {greeting}, {userName}
          </h1>
          <p className="text-white/80 text-sm mt-1.5 font-medium">
            {isLoading ? "A carregar…" : (
              <>
                <span className="font-bold text-white">{todayAppointments.length}</span> paragem{todayAppointments.length !== 1 ? "s" : ""} hoje
                {nextAppointment && (
                  <> · próxima às <span className="font-bold text-white">{format(new Date(nextAppointment.date), "HH:mm")}</span></>
                )}
              </>
            )}
          </p>
        </div>
      </header>

      <main className="flex-1 px-4 py-5">

        {/* ── PUSH HEALTH BANNER ─────────────────── */}
        <div className="mb-4">
          <PushHealthBanner variant="prominent" />
        </div>

        {/* ── GPS ERROR ──────────────────────────── */}
        {geo.erro && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-start gap-3 mb-4" data-testid="alert-gps-error">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">Problema com GPS</p>
              <p className="text-xs text-destructive/80 mt-0.5">{geo.erro}</p>
            </div>
            <button onClick={geo.parar} className="text-destructive hover:text-destructive/80 p-1" data-testid="button-dismiss-gps-error">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── VISIT CONFIRMATION CARDS ────────────── */}
        {geo.visitasPendentesConfirmacao.map(visita => (
          <div
            key={`${visita.clienteId}-${visita.inicio.getTime()}`}
            className="bg-white rounded-2xl shadow-md border border-primary/20 p-5 space-y-4 mb-4"
            data-testid={`card-confirm-visit-${visita.clienteId}`}
          >
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2.5 rounded-full">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Visita concluída</p>
                <h4 className="font-bold text-slate-900 text-lg truncate">{visita.clienteNome}</h4>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Clock className="w-4 h-4 text-slate-400" />
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
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Duração real (min)"
                  value={ajustarMinutos}
                  onChange={e => setAjustarMinutos(e.target.value)}
                  autoFocus
                  data-testid="input-adjust-duration"
                />
                <button
                  className="bg-primary text-white p-2.5 rounded-xl active:scale-95 transition-transform"
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
                  className="bg-slate-100 text-slate-500 p-2.5 rounded-xl active:scale-95 transition-transform"
                  onClick={() => { setAjustarVisita(null); setAjustarMinutos(""); }}
                  data-testid="button-cancel-adjust"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md"
                  onClick={() => finalizarVisita(visita)}
                  data-testid="button-confirm-visit"
                >
                  <Check className="w-4 h-4" /> Confirmar
                </button>
                <button
                  className="bg-slate-100 text-slate-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 border border-slate-200 active:scale-[0.98] transition-transform"
                  onClick={() => { setAjustarVisita(visita); setAjustarMinutos(String(visita.duracaoMinutos)); }}
                  data-testid="button-adjust-visit"
                >
                  <Pencil className="w-3.5 h-3.5" /> Ajustar
                </button>
                <button
                  className="bg-slate-50 text-slate-500 font-bold py-3 px-4 rounded-xl border border-slate-200 active:scale-[0.98] transition-transform"
                  onClick={() => ignorarVisita(visita)}
                  data-testid="button-ignore-visit"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}

        {/* ── ACTIVE VISIT CARD ──────────────────── */}
        {geo.visitaAtiva && (
          <div
            className="bg-primary rounded-2xl p-5 shadow-lg text-white relative overflow-hidden mb-4"
            data-testid="card-active-visit"
          >
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/80">Em visita</span>
              </div>
              <h3 className="text-2xl font-bold mb-2 tracking-tight">{geo.visitaAtiva.clienteNome}</h3>
              <div className="flex items-center gap-4 text-white/90 text-sm">
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

        {/* ── WEATHER CARD ──────────────────────── */}
        <WeatherCard />

        {/* ── TIMELINE ──────────────────────────── */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
          </div>
        ) : todayAppointments.length > 0 ? (
          <div className="relative pl-3 mb-6">
            {/* Connector line */}
            <div className="absolute top-4 bottom-8 left-[23.5px] w-0.5 bg-primary/20 rounded-full" />

            <div className="space-y-5">
              {todayAppointments.map((apt) => {
                const status = getAptStatus(apt);
                const isCompleted = status === "completed";
                const isNext = status === "next";
                const isPending = status === "pending";
                const aptDate = new Date(apt.date);

                return (
                  <div key={apt.id} className="relative flex gap-4 items-start group" data-testid={`card-appointment-${apt.id}`}>
                    {/* Timeline Node */}
                    <div className="relative z-10 flex flex-col items-center mt-1 shrink-0">
                      {isCompleted && (
                        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-sm">
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        </div>
                      )}
                      {isNext && (
                        <div className="w-6 h-6 rounded-full bg-white border-[3px] border-primary flex items-center justify-center shadow-md ring-4 ring-primary/10">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        </div>
                      )}
                      {isPending && (
                        <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        </div>
                      )}
                    </div>

                    {/* Appointment Card */}
                    <Link href={`/clients/${apt.clientId}`} className="flex-1 min-w-0">
                      <div className={cn(
                        "rounded-2xl p-4 transition-all",
                        isNext
                          ? "bg-white border-2 border-primary shadow-lg shadow-primary/5 scale-[1.02]"
                          : isCompleted
                            ? "bg-white/60 border border-slate-200"
                            : "bg-white border border-slate-200 shadow-sm"
                      )}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[15px] font-bold",
                              isCompleted ? "text-slate-400" : isNext ? "text-primary" : "text-slate-700"
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
                          isCompleted ? "text-slate-500 line-through decoration-slate-300" : "text-slate-900"
                        )}>
                          {apt.client.name}
                        </h3>

                        {apt.client.address && (
                          <div className={cn(
                            "flex items-start gap-1.5 text-[13px] mt-2",
                            isCompleted ? "text-slate-400" : "text-slate-500"
                          )}>
                            <MapPin className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2.5} />
                            <span className="leading-tight font-medium">{apt.client.address}</span>
                          </div>
                        )}

                        {isNext && apt.client.address && (
                          <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2.5">
                            <button
                              className="flex-1 bg-primary hover:bg-primary/90 text-white text-[13px] font-bold py-2.5 rounded-xl transition-colors flex justify-center items-center gap-2"
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
                                className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-bold flex justify-center items-center"
                                data-testid="button-view-client"
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
          <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center text-center mb-6 shadow-sm" data-testid="card-no-appointments">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CalendarClock className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Sem trabalhos para hoje</h3>
            <p className="text-slate-500 text-sm mt-1">Aproveite o seu dia!</p>
            <Link href="/calendar">
              <button className="mt-4 text-sm font-bold text-primary bg-primary/10 border border-primary/20 px-4 py-2 rounded-full" data-testid="button-schedule-appointment">
                Agendar trabalho
              </button>
            </Link>
          </div>
        )}

        {/* ── PENDING PAYMENTS ──────────────────── */}
        {unpaidCount > 0 && (
          <Link href="/billing" data-testid="link-unpaid-strip">
            <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
              <div className="bg-destructive/20 p-2 rounded-full mt-0.5 shrink-0">
                <AlertCircle className="w-5 h-5 text-destructive" strokeWidth={2.5} />
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

        {/* ── QUICK ACTIONS ─────────────────────── */}
        <div className="mb-6">
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">Ações Rápidas</h3>
          <div className="grid grid-cols-4 gap-3">
            {[
              { href: "/calendar",  Icon: Plus,     label: "Novo Serviço", color: "bg-primary",    shadow: "shadow-primary/30" },
              { href: "/clients",   Icon: UserPlus, label: "Novo Cliente", color: "bg-blue-500",   shadow: "shadow-blue-500/30" },
              { href: "/gallery",   Icon: Camera,   label: "Foto Rápida",  color: "bg-orange-500", shadow: "shadow-orange-500/30" },
              { href: "/map",       Icon: Map,      label: "Mapa",         color: "bg-teal-600",   shadow: "shadow-teal-600/30" },
            ].map((action, i) => (
              <Link key={i} href={action.href} className="block" data-testid={`link-quick-${action.label.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/s+/g, "-")}`}>
                <div className="flex flex-col items-center gap-2 group">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-active:scale-95 shadow-md", action.color, action.shadow)}>
                    <action.Icon className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground text-center leading-tight">{action.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

                {/* ── MORE ACTIONS ─────────────────────── */}
        <div className="space-y-3 mb-4">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Mais</h3>
          {([
            { onClick: () => setScanOpen(true), Icon: Camera,      label: "Digitalizar Fatura",  desc: "Tirar foto e registar compra automaticamente", iconBg: "bg-rose-100/70 text-rose-700" },
            { onClick: () => { setShowVoiceReport(v => !v); setVoiceSummary(null); }, Icon: Mic, label: "Relatório de Voz", desc: "Ditar relatório de serviço por voz", iconBg: "bg-green-100/70 text-green-700" },
            { href: "/pending-tasks", Icon: ClipboardList, label: "Tarefas Pendentes",   desc: "Ver todas as tarefas por fazer",               iconBg: "bg-primary/10 text-primary" },
            { href: "/employees",     Icon: Users,         label: "Funcionários",         desc: "Gerir equipa e salários",                      iconBg: "bg-muted text-muted-foreground" },
            { href: "/purchases",     Icon: ShoppingBag,   label: "Compras e Despesas",   desc: "Gerir materiais e gastos",                     iconBg: "bg-green-100/70 text-green-700" },
            { href: "/expense-notes", Icon: FileText,      label: "Notas de Despesa",     desc: "Documentos de serviços prestados",             iconBg: "bg-teal-100/70 text-teal-700" },
            { href: "/quotes",        Icon: ClipboardList, label: "Orçamentos",           desc: "Criar e enviar propostas aos clientes",        iconBg: "bg-indigo-100/70 text-indigo-700" },
            { href: "/payments",      Icon: CreditCard,    label: "Mensalidades",         desc: "Gerir pagamentos mensais dos clientes",        iconBg: "bg-purple-100/70 text-purple-700" },
            { href: "/finances",      Icon: TrendingUp,    label: "Financeiro",           desc: "Distribuição de rendimento mensal",            iconBg: "bg-emerald-100/70 text-emerald-700" },
            { href: "/exports",       Icon: Download,      label: "Exportações",          desc: "Exportar dados em PDF e CSV",                  iconBg: "bg-slate-100/70 text-slate-600" },
            { href: "/reminders",     Icon: Bell,          label: "Lembretes",            desc: "Manutenções e alertas periódicos",             iconBg: "bg-yellow-100/70 text-yellow-700" },
            { href: "/product-prices", Icon: Tag,          label: "Preços de Produtos",   desc: "Consultar histórico de preços",                iconBg: "bg-cyan-100/70 text-cyan-700" },
          ] as Array<{ href?: string; onClick?: () => void; Icon: React.ElementType; label: string; desc: string; iconBg: string }>).map((action) => {
            const inner = (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 hover:bg-slate-50 active:scale-[0.99] transition-all">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", action.iconBg)}>
                  <action.Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900">{action.label}</h3>
                  <p className="text-sm text-slate-500">{action.desc}</p>
                </div>
              </div>
            );
            if (action.href) {
              return (
                <Link key={action.href} href={action.href} className="block" data-testid={`link-more-${action.href.slice(1)}`}>
                  {inner}
                </Link>
              );
            }
            return (
              <div key={action.label} className="block cursor-pointer" onClick={action.onClick} data-testid={`link-more-${action.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-")}`}>
                {inner}
              </div>
            );
          })}
        </div>

        {/* ── GPS TRACKING ─────────────────────── */}
        <button
          onClick={geo.ativo ? geo.parar : geo.iniciar}
          className={cn(
            "w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] border",
            geo.ativo
              ? "bg-primary border-primary text-white shadow-md"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
          data-testid="button-toggle-tracking"
        >
          {geo.ativo ? (
            <>
              <LocateOff className="w-4 h-4" />
              Pausar tracking
              {geo.posicaoAtual && (
                <span className="ml-1 text-xs opacity-80">
                  ({geo.ultimoUpdate ? format(geo.ultimoUpdate, "HH:mm") : "…"})
                </span>
              )}
            </>
          ) : (
            <>
              <Locate className="w-4 h-4" />
              Iniciar tracking
            </>
          )}
        </button>

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
                  className="flex-1 border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                  <span className="text-slate-900">{draft.local}</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="font-bold text-muted-foreground w-20 shrink-0">Data:</span>
                <span className="text-slate-900">
                  {draft.data ? (() => {
                    try { return format(new Date(draft.data + "T00:00:00"), "d 'de' MMMM", { locale: pt }); }
                    catch { return draft.data; }
                  })() : "—"}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-muted-foreground w-20 shrink-0">Tarefas:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-900">
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
              <h2 className="text-base font-bold text-slate-900">Relatório de Voz</h2>
              <button onClick={() => setShowVoiceReport(false)} className="p-1 text-slate-400 hover:text-slate-600" data-testid="button-close-voice-report">
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
                <p className="text-sm text-slate-800 whitespace-pre-wrap">{voiceSummary}</p>
              </div>
            )}
          </div>
        </div>
      )}
      <BottomNav />

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
