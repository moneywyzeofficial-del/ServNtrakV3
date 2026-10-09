import { useMemo } from "react";
import { CheckCircle2, Calendar, Camera, Wrench, User, Leaf, Waves, ThermometerSun } from "lucide-react";
import type { ServiceLog, Appointment, QuickPhoto, Client, ClientEquipment } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { format, isToday, isYesterday } from "date-fns";
import { pt } from "date-fns/locale";

export interface TimelineEvent {
  id: string;
  timestamp: Date;
  type: "appointment" | "service" | "photo" | "equipment" | "client";
  title: string;
  description?: string;
  zone?: string;
  photos?: string[];
  isCompleted?: boolean;
  appointmentId?: number;
  serviceLogId?: number;
  photoId?: number;
  equipmentId?: number;
}

interface Props {
  logs: ServiceLog[];
  appointments: Appointment[];
  quickPhotos: QuickPhoto[];
  equipment: ClientEquipment[];
  client: Client;
  onPhotoClick?: (photo: { src: string; type: string; date?: string }) => void;
  onEventClick?: (event: TimelineEvent) => void;
}

const zoneIcon = (z: string | undefined) =>
  z === "Garden" ? Leaf : z === "Pool" ? Waves : z === "Jacuzzi" ? ThermometerSun : Calendar;

const zoneColor = (z: string | undefined) =>
  z === "Garden" ? "bg-green-100 text-green-700" :
  z === "Pool" ? "bg-blue-100 text-blue-700" :
  z === "Jacuzzi" ? "bg-muted text-muted-foreground" :
  "bg-muted text-muted-foreground";

function dayLabel(d: Date): string {
  if (isToday(d)) return "Hoje";
  if (isYesterday(d)) return "Ontem";
  return format(d, "d 'de' MMMM 'de' yyyy", { locale: pt });
}

export function ClientTimeline({ logs, appointments, quickPhotos, equipment, client, onPhotoClick, onEventClick }: Props) {
  const events = useMemo(() => {
    const all: TimelineEvent[] = [];

    // Service logs
    logs.forEach((log) => {
      all.push({
        id: `log-${log.id}`,
        timestamp: new Date(log.date),
        type: "service",
        title: log.type === "Garden" ? "Manutenção Jardim" :
               log.type === "Pool" ? "Manutenção Piscina" :
               log.type === "Jacuzzi" ? "Manutenção Jacuzzi" : "Serviço",
        description: log.description || undefined,
        zone: log.type,
        photos: [...(log.photosBefore || []), ...(log.photosAfter || [])],
        isCompleted: true,
        serviceLogId: log.id,
      });
    });

    // Appointments
    appointments.forEach((apt) => {
      all.push({
        id: `apt-${apt.id}`,
        timestamp: new Date(apt.date),
        type: "appointment",
        title: apt.isCompleted ? "Visita concluída" : "Visita agendada",
        description: apt.notes || undefined,
        zone: apt.type,
        isCompleted: apt.isCompleted ?? false,
        appointmentId: apt.id,
      });
    });

    // Quick photos
    quickPhotos.forEach((photo) => {
      all.push({
        id: `photo-${photo.id}`,
        timestamp: new Date(photo.createdAt!),
        type: "photo",
        title: photo.serviceType && photo.serviceType !== "Geral"
          ? `Foto — ${photo.serviceType}`
          : "Foto adicionada",
        description: photo.notes || undefined,
        photos: [photo.photoUrl],
        photoId: photo.id,
      });
    });

    // Equipment — created
    equipment.forEach((eq) => {
      if (eq.createdAt) {
        all.push({
          id: `equip-created-${eq.id}`,
          timestamp: new Date(eq.createdAt),
          type: "equipment",
          title: "Equipamento adicionado",
          description: [eq.type, eq.brand, eq.model].filter(Boolean).join(" "),
          zone: eq.category,
          equipmentId: eq.id,
        });
      }
      if (eq.updatedAt && eq.createdAt && new Date(eq.updatedAt).getTime() - new Date(eq.createdAt).getTime() > 60000) {
        all.push({
          id: `equip-updated-${eq.id}`,
          timestamp: new Date(eq.updatedAt),
          type: "equipment",
          title: "Equipamento atualizado",
          description: [eq.type, eq.brand, eq.model].filter(Boolean).join(" "),
          zone: eq.category,
          equipmentId: eq.id,
        });
      }
    });

    // Client created
    if (client.createdAt) {
      all.push({
        id: "client-created",
        timestamp: new Date(client.createdAt),
        type: "client",
        title: "Cliente criado",
        description: client.name,
      });
    }

    return all.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [logs, appointments, quickPhotos, equipment, client]);

  const groupedByDay = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    events.forEach((e) => {
      const key = format(e.timestamp, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return [...map.entries()];
  }, [events]);

  const getIcon = (e: TimelineEvent) => {
    switch (e.type) {
      case "service": return <CheckCircle2 className="w-3.5 h-3.5" />;
      case "appointment": return <Calendar className="w-3.5 h-3.5" />;
      case "photo": return <Camera className="w-3.5 h-3.5" />;
      case "equipment": return <Wrench className="w-3.5 h-3.5" />;
      case "client": return <User className="w-3.5 h-3.5" />;
    }
  };

  const handleEventClick = (e: TimelineEvent) => {
    if (onEventClick) {
      onEventClick(e);
    } else if (e.type === "photo" && e.photos?.[0] && onPhotoClick) {
      onPhotoClick({ src: e.photos[0], type: e.title, date: e.timestamp.toISOString() });
    }
  };

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="w-12 h-12 text-muted-foreground/25 mb-3" />
        <p className="text-sm text-muted-foreground">Ainda não existe histórico para este cliente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groupedByDay.map(([dayKey, dayEvents]) => {
        const d = new Date(dayKey + "T00:00:00");
        return (
          <section key={dayKey}>
            <div className="flex items-center gap-3 mb-2.5">
              <div className="h-px flex-1 bg-border/50" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                {dayLabel(d)}
              </h3>
              <span className="text-[10px] text-muted-foreground/60 font-mono">{format(d, "dd/MM")}</span>
              <div className="h-px flex-1 bg-border/50" />
            </div>

            <div className="relative ml-2 border-l-2 border-border/30 pl-5 space-y-3 pb-2">
              {dayEvents.map((e) => {
                const isClickable = e.type === "photo" || e.type === "equipment" || e.type === "service" || e.type === "appointment";
                const Component = isClickable ? "button" : "div";
                return (
                  <Component
                    key={e.id}
                    type={isClickable ? "button" : undefined}
                    className={`relative block w-full text-left ${isClickable ? "cursor-pointer" : ""}`}
                    onClick={isClickable ? () => handleEventClick(e) : undefined}
                    data-testid={`timeline-event-${e.id}`}
                  >
                    {/* Dot on timeline line */}
                    <div className={`absolute -left-[25px] w-2.5 h-2.5 rounded-full border-2 border-background ${
                      e.type === "service" ? "bg-green-500" :
                      e.type === "appointment" ? (e.isCompleted ? "bg-green-500" : "bg-blue-500") :
                      e.type === "photo" ? "bg-pink-500" :
                      e.type === "equipment" ? "bg-amber-500" :
                      "bg-muted-foreground"
                    }`} />

                    <div className="bg-card border border-border/40 rounded-xl p-3 shadow-sm hover:border-border/60 transition-colors">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${zoneColor(e.zone)}`}>
                            {getIcon(e)}
                          </div>
                          <span className="font-medium text-sm truncate">{e.title}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                          {e.type === "appointment" && !e.isCompleted
                            ? format(e.timestamp, "HH:mm")
                            : format(e.timestamp, "HH:mm")}
                        </span>
                      </div>

                      {e.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.description}</p>
                      )}

                      {e.photos && e.photos.length > 0 && (
                        <div className="flex gap-1.5 mt-2 overflow-x-auto">
                          {e.photos.slice(0, 4).map((src, i) => (
                            <img key={i} src={src} alt="" className="w-14 h-14 object-cover rounded-lg shrink-0 border border-border/30" />
                          ))}
                          {e.photos.length > 4 && (
                            <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center shrink-0 text-[10px] text-muted-foreground">
                              +{e.photos.length - 4}
                            </div>
                          )}
                        </div>
                      )}

                      {e.type === "appointment" && !e.isCompleted && (
                        <Badge variant="outline" className="mt-2 text-[10px] bg-blue-50 text-blue-700 border-blue-200">Agendado</Badge>
                      )}
                    </div>
                  </Component>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
