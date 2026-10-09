import { isPast, isToday, isTomorrow, format } from "date-fns";
import { pt } from "date-fns/locale";
import { CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const zoneColor = (type: string) =>
  type === "Garden" ? "bg-green-100 text-green-700 border-green-200" :
  type === "Pool" ? "bg-blue-100 text-blue-700 border-blue-200" :
  type === "Jacuzzi" ? "bg-cyan-100 text-cyan-700 border-cyan-200" :
  "bg-muted text-muted-foreground border-border/40";

export const zoneLabel = (type: string) =>
  type === "Garden" ? "Jardim" : type === "Pool" ? "Piscina" : type === "Jacuzzi" ? "Jacuzzi" : type === "General" ? "Geral" : type;

export const zoneGradient = (type: string) =>
  type === "Garden" ? "from-green-400 to-green-500" :
  type === "Pool" ? "from-blue-400 to-blue-500" :
  type === "Jacuzzi" ? "from-cyan-400 to-cyan-500" :
  "from-muted-foreground/50 to-muted-foreground/30";

// ---- Shared appointment status logic ----

export type AppointmentStatus = "concluido" | "atrasado" | "agendado";

export function getStatus(apt: { isCompleted: boolean | null; date: string | Date }): AppointmentStatus {
  if (apt.isCompleted) return "concluido";
  if (isPast(new Date(apt.date)) && !isToday(new Date(apt.date))) return "atrasado";
  return "agendado";
}

export const statusConfig: Record<AppointmentStatus, { label: string; bg: string; text: string; dot: string; Icon: LucideIcon }> = {
  concluido: { label: "Concluído", bg: "bg-green-100", text: "text-green-800", dot: "bg-green-600", Icon: CheckCircle2 },
  atrasado: { label: "Atrasado", bg: "bg-red-100", text: "text-red-800", dot: "bg-red-600", Icon: AlertTriangle },
  agendado: { label: "Agendado", bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-600", Icon: Clock },
};

export function dayLabel(date: Date): string {
  if (isToday(date)) return "Hoje";
  if (isTomorrow(date)) return "Amanhã";
  return format(date, "EEEE, d 'de' MMMM", { locale: pt });
}
