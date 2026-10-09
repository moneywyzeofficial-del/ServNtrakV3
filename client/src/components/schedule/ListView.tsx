import { useState, useEffect } from "react";
import { useAppointments, useUpdateAppointment } from "@/hooks/use-appointments";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { MapPin, CheckCircle2, CalendarDays, Eye, ExternalLink, Loader2, Phone, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { zoneColor, zoneLabel, zoneGradient, getStatus, statusConfig, dayLabel } from "./utils";
import { haversineKm } from "@/lib/geo";

type AptWithClient = NonNullable<ReturnType<typeof useAppointments>["data"]>[number];

export function ListView() {
  const { data: appointments, isLoading } = useAppointments();
  const updateApt = useUpdateAppointment();
  const { toast } = useToast();
  const [detailApt, setDetailApt] = useState<AptWithClient | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const handleComplete = (apt: AptWithClient) => {
    updateApt.mutate(
      { id: apt.id, isCompleted: true },
      {
        onSuccess: () =>
          toast({
            title: "Agendamento concluído",
            description: `Visita a ${apt.client.name} marcada como concluída.`,
          }),
        onError: () =>
          toast({
            title: "Erro",
            description: "Não foi possível concluir o agendamento.",
            variant: "destructive",
          }),
      },
    );
  };

  const handleOpenMaps = (apt: AptWithClient) => {
    const url =
      apt.client.latitude && apt.client.longitude
        ? `https://www.google.com/maps?q=${apt.client.latitude},${apt.client.longitude}`
        : `https://www.google.com/maps/search/${encodeURIComponent(apt.client.address || apt.client.name)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const grouped = (() => {
    if (!appointments) return [];
    const map = new Map<string, AptWithClient[]>();
    const sorted = [...appointments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    for (const apt of sorted) {
      const key = format(new Date(apt.date), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(apt);
    }
    return [...map.entries()];
  })();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (grouped.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mb-4">
          <CalendarDays className="w-8 h-8 text-primary/60" />
        </div>
        <h3 className="font-semibold text-foreground">Sem agendamentos</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Nenhuma visita agendada de momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {grouped.map(([dayKey, dayApts]) => {
        const date = parseISO(dayKey);
        return (
          <section key={dayKey}>
            <div className="flex items-center gap-3 mb-2.5">
              <div className="h-px flex-1 bg-border/60" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                {dayLabel(date)}
              </h3>
              <span className="text-[10px] text-muted-foreground/70 font-mono">
                {format(date, "dd/MM")}
              </span>
              <div className="h-px flex-1 bg-border/60" />
            </div>

            <div className="space-y-2.5">
              {dayApts.map((apt) => {
                const aptDate = new Date(apt.date);
                const status = getStatus(apt);
                const stCfg = statusConfig[status];
                const StatusIcon = stCfg.Icon;
                const dist =
                  userCoords && apt.client.latitude && apt.client.longitude
                    ? haversineKm(
                        userCoords.lat,
                        userCoords.lng,
                        apt.client.latitude,
                        apt.client.longitude,
                      )
                    : null;

                return (
                  <div
                    key={apt.id}
                    className={cn(
                      "relative flex gap-3 rounded-2xl border py-3 px-3.5 transition-all",
                      status === "concluido"
                        ? "bg-green-50/70 border-green-300/60"
                        : status === "atrasado"
                          ? "bg-red-50/70 border-red-300/60"
                          : "bg-card border-border/60 shadow-sm",
                    )}
                  >
                    {/* Time column — compact */}
                    <div className="flex flex-col items-center w-12 shrink-0">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-lg flex flex-col items-center justify-center font-bold text-white bg-gradient-to-br",
                          zoneGradient(apt.type),
                        )}
                      >
                        <span className="text-[11px] leading-none">
                          {format(aptDate, "HH")}
                        </span>
                        <span className="text-[8px] leading-none mt-0.5 opacity-80">
                          {format(aptDate, "mm")}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "w-0.5 h-full mt-1.5 rounded-full",
                          stCfg.dot,
                        )}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-0.5">
                      {/* Row 1: type badges + status pill */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex flex-wrap gap-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0 font-normal border",
                              zoneColor(apt.type),
                            )}
                          >
                            {zoneLabel(apt.type)}
                          </Badge>
                          {apt.serviceType && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 font-normal"
                            >
                              {apt.serviceType}
                            </Badge>
                          )}
                        </div>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[11px] font-bold shrink-0 px-2 py-0.5 rounded-full shadow-sm",
                            stCfg.bg,
                            stCfg.text,
                          )}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {stCfg.label}
                        </span>
                      </div>

                      {/* Row 2: client name — prominent */}
                      <h4 className="text-[15px] font-extrabold text-foreground tracking-tight truncate">
                        {apt.client.name}
                      </h4>

                      {/* Row 3: address */}
                      {apt.client.address && (
                        <p className="text-[11px] text-foreground/70 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{apt.client.address}</span>
                        </p>
                      )}

                      {/* Row 4: distance (when geolocation + client coords available) */}
                      {dist !== null && (
                        <p className="text-[11px] text-foreground/60 flex items-center gap-1 mt-0.5">
                          <Navigation className="w-3 h-3 shrink-0" />
                          <span className="font-medium">
                            {dist < 1
                              ? `${(dist * 1000).toFixed(0)} m`
                              : `${dist.toFixed(1)} km`}
                          </span>
                        </p>
                      )}

                      {/* Row 5: notes */}
                      {apt.notes && (
                        <p className="text-[11px] text-muted-foreground/70 mt-1 line-clamp-2 leading-relaxed">
                          {apt.notes}
                        </p>
                      )}

                      {/* Row 6: quick actions — compact */}
                      <div className="flex items-center gap-0.5 mt-2.5 pt-1.5 border-t border-border/20">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setDetailApt(apt);
                            setDetailOpen(true);
                          }}
                        >
                          <Eye className="w-3 h-3" /> Detalhes
                        </Button>
                        {!apt.isCompleted && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-[11px] gap-1 text-green-700 hover:text-green-800 hover:bg-green-50"
                            onClick={() => handleComplete(apt)}
                            disabled={updateApt.isPending}
                          >
                            <CheckCircle2 className="w-3 h-3" /> Concluir
                          </Button>
                        )}
                        {apt.client.phone && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              window.open(`tel:${apt.client.phone}`, "_self")
                            }
                          >
                            <Phone className="w-3 h-3" /> Ligar
                          </Button>
                        )}
                        {(apt.client.address || apt.client.latitude) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                            onClick={() => handleOpenMaps(apt)}
                          >
                            <ExternalLink className="w-3 h-3" /> Navegar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agendamento</DialogTitle>
          </DialogHeader>
          {detailApt && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 font-bold text-white bg-gradient-to-br",
                    zoneGradient(detailApt.type),
                  )}
                >
                  <span className="text-base leading-none">
                    {format(new Date(detailApt.date), "HH")}
                  </span>
                  <span className="text-[10px] leading-none mt-0.5 opacity-80">
                    {format(new Date(detailApt.date), "mm")}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-foreground">
                    {detailApt.client.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(detailApt.date), "d 'de' MMMM yyyy, HH:mm", {
                      locale: pt,
                    })}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className={cn("text-xs font-normal", zoneColor(detailApt.type))}
                >
                  {zoneLabel(detailApt.type)}
                </Badge>
                {detailApt.serviceType && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    {detailApt.serviceType}
                  </Badge>
                )}
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                    statusConfig[getStatus(detailApt)].bg,
                    statusConfig[getStatus(detailApt)].text,
                  )}
                >
                  {statusConfig[getStatus(detailApt)].label}
                </span>
              </div>

              {detailApt.client.address && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 shrink-0" />
                  {detailApt.client.address}
                </p>
              )}

              {detailApt.notes && (
                <div className="rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
                  {detailApt.notes}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {!detailApt.isCompleted && (
                  <Button
                    className="flex-1"
                    size="sm"
                    onClick={() => {
                      handleComplete(detailApt);
                      setDetailOpen(false);
                    }}
                    disabled={updateApt.isPending}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Marcar Concluído
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOpenMaps(detailApt)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" /> Navegar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
