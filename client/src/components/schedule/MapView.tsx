import { useState, useEffect, useMemo, useCallback } from "react";
import { useAppointments } from "@/hooks/use-appointments";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { format, addDays, startOfDay, endOfDay } from "date-fns";
import { pt } from "date-fns/locale";
import { Phone, MapPin, Navigation, Loader2, Layers, Route, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { zoneColor, zoneLabel, getStatus, statusConfig } from "./utils";
import { haversineKm, googleMapsRouteUrl, defaultMapCenter } from "@/lib/geo";
import { createDropPin, createDropPinSmall, tileLayers, zonePin } from "@/lib/leaflet-utils";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ---------------------------------------------------------------------------
// types
// ---------------------------------------------------------------------------

type TimeRange = "hoje" | "amanha" | "semana";
type TypeFilter = "todos" | "piscina" | "jardim" | "orcamento" | "reparacao" | "manutencao";
type AptWithClient = NonNullable<ReturnType<typeof useAppointments>["data"]>[number];

const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "amanha", label: "Amanhã" },
  { key: "semana", label: "Semana" },
];

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "piscina", label: "Piscina" },
  { key: "jardim", label: "Jardim" },
  { key: "orcamento", label: "Orçamento" },
  { key: "reparacao", label: "Reparação" },
  { key: "manutencao", label: "Manutenção" },
];

// ---------------------------------------------------------------------------
// helper: fly to first selected marker when route mode activates
// ---------------------------------------------------------------------------

function FlyToFit({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.flyTo(positions[0], 15, { duration: 0.6 });
      return;
    }
    const bounds = L.latLngBounds(positions.map(([lat, lng]) => L.latLng(lat, lng)));
    map.flyToBounds(bounds, { padding: [50, 50], duration: 0.8 });
  }, [map, positions]);
  return null;
}

// ---------------------------------------------------------------------------
// component
// ---------------------------------------------------------------------------

export function MapView() {
  const { data: appointments, isLoading } = useAppointments();
  const [timeRange, setTimeRange] = useState<TimeRange>("hoje");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("todos");
  const [mapType, setMapType] = useState<"street" | "satellite">("street");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [detailApt, setDetailApt] = useState<AptWithClient | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // ---- route planning ----
  const [routeMode, setRouteMode] = useState(false);
  const [routeSelection, setRouteSelection] = useState<number[]>([]);

  // geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // ---- filters ----

  const dateRange = useMemo(() => {
    const now = new Date();
    if (timeRange === "hoje") return { from: startOfDay(now), to: endOfDay(now) };
    if (timeRange === "amanha") {
      const tomorrow = addDays(now, 1);
      return { from: startOfDay(tomorrow), to: endOfDay(tomorrow) };
    }
    return { from: startOfDay(now), to: addDays(now, 7) };
  }, [timeRange]);

  const filtered = useMemo(() => {
    if (!appointments) return [];
    return appointments.filter((apt) => {
      const d = new Date(apt.date);
      if (d < dateRange.from || d > dateRange.to) return false;
      if (typeFilter !== "todos") {
        const haystack = `${apt.type} ${apt.serviceType ?? ""}`.toLowerCase();
        const kw =
          typeFilter === "piscina" ? "piscina|pool" :
          typeFilter === "jardim" ? "jardim|garden" :
          typeFilter === "orcamento" ? "orçamento|orcamento" :
          typeFilter === "reparacao" ? "reparação|reparacao" :
          "manutenção|manutencao";
        if (!new RegExp(kw, "i").test(haystack)) return false;
      }
      return true;
    });
  }, [appointments, dateRange, typeFilter]);

  const withCoords = useMemo(
    () => filtered.filter((apt) => apt.client.latitude != null && apt.client.longitude != null),
    [filtered],
  );

  const mapCenter: [number, number] =
    withCoords.length > 0
      ? [withCoords[0].client.latitude!, withCoords[0].client.longitude!]
      : defaultMapCenter;

  // ---- route helpers ----

  const toggleRouteSelection = useCallback((aptId: number) => {
    setRouteSelection((prev) => {
      const idx = prev.indexOf(aptId);
      if (idx >= 0) return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
      return [...prev, aptId];
    });
  }, []);

  const buildRoute = useCallback(() => {
    const ordered = routeSelection
      .map((id) => withCoords.find((apt) => apt.id === id))
      .filter(Boolean) as AptWithClient[];
    if (ordered.length === 0) return;
    const waypoints = ordered.map((apt) => ({
      lat: apt.client.latitude!,
      lng: apt.client.longitude!,
    }));
    window.open(googleMapsRouteUrl(waypoints), "_blank", "noopener,noreferrer");
    setRouteMode(false);
    setRouteSelection([]);
  }, [routeSelection, withCoords]);

  const routePositions: [number, number][] = useMemo(() => {
    if (!routeMode || routeSelection.length === 0) return [];
    return routeSelection
      .map((id) => withCoords.find((apt) => apt.id === id))
      .filter(Boolean)
      .map((apt) => [apt!.client.latitude!, apt!.client.longitude!] as [number, number]);
  }, [routeMode, routeSelection, withCoords]);

  // ---- render ----

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="-mx-5">
      {/* ---- filter bar ---- */}
      <div className="px-5 space-y-2.5 pt-1 pb-3">
        {/* time range */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex gap-1" role="radiogroup" data-testid="map-time-range">
            {TIME_RANGES.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={timeRange === key}
                onClick={() => setTimeRange(key)}
                className={cn(
                  "shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap",
                  timeRange === key
                    ? "bg-card text-foreground shadow-sm border border-border/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                )}
                data-testid={`map-time-${key}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* route mode toggle */}
          <button
            type="button"
            onClick={() => {
              setRouteMode((prev) => !prev);
              setRouteSelection([]);
            }}
            className={cn(
              "shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ml-auto",
              routeMode
                ? "bg-amber-100 text-amber-800 border border-amber-300 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
            )}
            data-testid="map-route-mode"
          >
            <Route className="w-3.5 h-3.5" />
            Rota
          </button>
        </div>

        {/* type filter */}
        <div className="flex gap-1 overflow-x-auto" role="radiogroup" data-testid="map-type-filter">
          {TYPE_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={typeFilter === key}
              onClick={() => setTypeFilter(key)}
              className={cn(
                "shrink-0 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-all whitespace-nowrap",
                typeFilter === key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
              )}
              data-testid={`map-type-${key}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ---- map ---- */}
      <div className="h-[calc(100vh-380px)] relative">
        {withCoords.length > 0 ? (
          <>
            <MapContainer
              center={mapCenter}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom
            >
              <TileLayer key={mapType} attribution={tileLayers[mapType].attribution} url={tileLayers[mapType].url} />

              {routeMode && routePositions.length > 0 && <FlyToFit positions={routePositions} />}

              {withCoords.map((apt) => {
                const aptDate = new Date(apt.date);
                const status = getStatus(apt);
                const stCfg = statusConfig[status];
                const StatusIcon = stCfg.Icon;
                const selected = routeSelection.includes(apt.id);
                const orderIdx = routeSelection.indexOf(apt.id) + 1;
                const dist =
                  userCoords && apt.client.latitude && apt.client.longitude
                    ? haversineKm(userCoords.lat, userCoords.lng, apt.client.latitude, apt.client.longitude)
                    : null;

                let icon: L.DivIcon;
                if (routeMode && selected) {
                  icon = createDropPin("hsl(42,85%,48%)", String(orderIdx));
                } else if (routeMode) {
                  icon = createDropPinSmall("hsl(220,8%,70%)");
                } else {
                  icon = zonePin(apt.type, format(aptDate, "HH"));
                }

                return (
                  <Marker
                    key={apt.id}
                    position={[apt.client.latitude!, apt.client.longitude!]}
                    icon={icon}
                    eventHandlers={
                      routeMode
                        ? {
                            click: () => toggleRouteSelection(apt.id),
                          }
                        : undefined
                    }
                  >
                    {!routeMode && (
                      <Popup>
                        <div className="min-w-[210px] p-1">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-bold text-foreground truncate mr-2">{apt.client.name}</p>
                            <span className="text-xs font-mono font-bold text-muted-foreground shrink-0">
                              {format(aptDate, "HH:mm")}
                            </span>
                          </div>

                          {apt.client.address && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">{apt.client.address}</span>
                            </p>
                          )}

                          <div className="flex flex-wrap gap-1.5 mb-2">
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 font-normal border", zoneColor(apt.type))}>
                              {zoneLabel(apt.type)}
                            </Badge>
                            {apt.serviceType && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                                {apt.serviceType}
                              </Badge>
                            )}
                            <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shadow-sm", stCfg.bg, stCfg.text)}>
                              <StatusIcon className="w-3 h-3" />
                              {stCfg.label}
                            </span>
                          </div>

                          {dist !== null && (
                            <p className="text-[11px] text-foreground/60 flex items-center gap-1 mb-2">
                              <Navigation className="w-3 h-3 shrink-0" />
                              <span className="font-medium">
                                {dist < 1 ? `${(dist * 1000).toFixed(0)} m` : `${dist.toFixed(1)} km`}
                              </span>
                            </p>
                          )}

                          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/30">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 text-[11px] gap-1 rounded-lg"
                              onClick={() => { setDetailApt(apt); setDetailOpen(true); }}
                            >
                              Detalhes
                            </Button>
                            {apt.client.phone && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2.5 text-[11px] gap-1 rounded-lg"
                                onClick={() => window.open(`tel:${apt.client.phone}`, "_self")}
                              >
                                <Phone className="w-3 h-3" /> Ligar
                              </Button>
                            )}
                            <Button
                              size="sm"
                              className="h-7 px-2.5 text-[11px] gap-1 rounded-lg"
                              onClick={() => window.open(googleMapsRouteUrl([{ lat: apt.client.latitude!, lng: apt.client.longitude! }]), "_blank", "noopener,noreferrer")}
                            >
                              <Navigation className="w-3 h-3" /> Navegar
                            </Button>
                          </div>
                        </div>
                      </Popup>
                    )}
                  </Marker>
                );
              })}
            </MapContainer>

            {/* satellite / street toggle */}
            <div className="absolute bottom-4 left-4 z-[1000]">
              <Button
                variant="secondary"
                size="sm"
                className="h-8 px-3 text-xs gap-1.5 rounded-xl shadow-lg"
                onClick={() => setMapType((prev) => (prev === "street" ? "satellite" : "street"))}
                data-testid="map-layer-toggle"
              >
                <Layers className="w-3.5 h-3.5" />
                {mapType === "street" ? "Satélite" : "Mapa"}
              </Button>
            </div>
          </>
        ) : (
          /* ---- empty state ---- */
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <MapPin className="w-14 h-14 text-muted-foreground/25 mb-4" />
            <h3 className="font-semibold text-foreground mb-1">Sem locais no mapa</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {filtered.length > 0
                ? "Os agendamentos filtrados não têm coordenadas de GPS."
                : "Nenhum agendamento encontrado para este período."}
            </p>
          </div>
        )}
      </div>

      {/* ---- route planning bottom bar ---- */}
      {routeMode && (
        <div className="fixed bottom-[80px] left-0 right-0 z-[1001] flex justify-center pointer-events-none">
          <div className="pointer-events-auto bg-card border border-border/60 rounded-2xl shadow-lg px-4 py-3 mx-4 flex items-center gap-3 max-w-md w-full">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">
                {routePositions.length === 0
                  ? "Toca nos pins para selecionar"
                  : `${routePositions.length} agendamento${routePositions.length !== 1 ? "s" : ""} selecionado${routePositions.length !== 1 ? "s" : ""}`}
              </p>
              <p className="text-[11px] text-muted-foreground">A ordem de seleção define a rota</p>
            </div>
            <Button
              size="sm"
              className="h-8 px-3 text-xs gap-1.5 rounded-xl shrink-0"
              disabled={routePositions.length === 0}
              onClick={buildRoute}
              data-testid="map-button-build-route"
            >
              <Route className="w-3.5 h-3.5" />
              Criar Rota
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
              onClick={() => { setRouteMode(false); setRouteSelection([]); }}
              data-testid="map-button-cancel-route"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ---- detail dialog ---- */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agendamento</DialogTitle>
          </DialogHeader>
          {detailApt && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 font-bold text-white bg-primary">
                  <span className="text-base leading-none">{format(new Date(detailApt.date), "HH")}</span>
                  <span className="text-[10px] leading-none mt-0.5 opacity-80">{format(new Date(detailApt.date), "mm")}</span>
                </div>
                <div>
                  <p className="font-bold text-foreground">{detailApt.client.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(detailApt.date), "d 'de' MMMM yyyy, HH:mm", { locale: pt })}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={cn("text-xs font-normal", zoneColor(detailApt.type))}>
                  {zoneLabel(detailApt.type)}
                </Badge>
                {detailApt.serviceType && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    {detailApt.serviceType}
                  </Badge>
                )}
                <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full", statusConfig[getStatus(detailApt)].bg, statusConfig[getStatus(detailApt)].text)}>
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
                {detailApt.client.phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(`tel:${detailApt.client.phone}`, "_self")}
                  >
                    <Phone className="w-4 h-4 mr-2" /> Ligar
                  </Button>
                )}
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    if (detailApt.client.latitude && detailApt.client.longitude) {
                      window.open(
                        googleMapsRouteUrl([{ lat: detailApt.client.latitude, lng: detailApt.client.longitude }]),
                        "_blank",
                        "noopener,noreferrer",
                      );
                    }
                  }}
                  disabled={!detailApt.client.latitude || !detailApt.client.longitude}
                >
                  <Navigation className="w-4 h-4 mr-2" /> Navegar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
