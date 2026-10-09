import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Image, Calendar, User, X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import type { ServiceLog, Client } from "@shared/schema";

interface PhotoItem {
  url: string;
  type: "before" | "after";
  serviceLog: ServiceLog;
  client: Client;
}

export default function Gallery() {
  const [, setLocation] = useLocation();
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoItem | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: serviceLogs = [] } = useQuery<ServiceLog[]>({
    queryKey: ["/api/service-logs"],
  });

  const allPhotos = useMemo(() => {
    const photos: PhotoItem[] = [];
    
    serviceLogs.forEach((log) => {
      const client = clients.find((c) => c.id === log.clientId);
      if (!client) return;

      if (log.photosBefore && log.photosBefore.length > 0) {
        log.photosBefore.forEach((url) => {
          photos.push({
            url,
            type: "before",
            serviceLog: log,
            client,
          });
        });
      }

      if (log.photosAfter && log.photosAfter.length > 0) {
        log.photosAfter.forEach((url) => {
          photos.push({
            url,
            type: "after",
            serviceLog: log,
            client,
          });
        });
      }
    });

    return photos.sort((a, b) => {
      const dateA = new Date(a.serviceLog.date);
      const dateB = new Date(b.serviceLog.date);
      return dateB.getTime() - dateA.getTime();
    });
  }, [serviceLogs, clients]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    allPhotos.forEach((photo) => {
      const date = new Date(photo.serviceLog.date);
      const monthKey = format(date, "yyyy-MM");
      months.add(monthKey);
    });
    return Array.from(months).sort().reverse();
  }, [allPhotos]);

  const filteredPhotos = useMemo(() => {
    return allPhotos.filter((photo) => {
      if (selectedClient !== "all" && photo.client.id.toString() !== selectedClient) {
        return false;
      }
      if (selectedMonth !== "all") {
        const photoMonth = format(new Date(photo.serviceLog.date), "yyyy-MM");
        if (photoMonth !== selectedMonth) {
          return false;
        }
      }
      return true;
    });
  }, [allPhotos, selectedClient, selectedMonth]);

  const photosByClient = useMemo(() => {
    const grouped: Record<number, PhotoItem[]> = {};
    filteredPhotos.forEach((photo) => {
      if (!grouped[photo.client.id]) {
        grouped[photo.client.id] = [];
      }
      grouped[photo.client.id].push(photo);
    });
    return grouped;
  }, [filteredPhotos]);

  const openLightbox = (photo: PhotoItem) => {
    const index = filteredPhotos.findIndex((p) => p.url === photo.url);
    setLightboxIndex(index);
    setLightboxPhoto(photo);
  };

  const navigateLightbox = (direction: "prev" | "next") => {
    if (filteredPhotos.length === 0) return;
    const newIndex = direction === "prev" 
      ? (lightboxIndex - 1 + filteredPhotos.length) % filteredPhotos.length
      : (lightboxIndex + 1) % filteredPhotos.length;
    setLightboxIndex(newIndex);
    setLightboxPhoto(filteredPhotos[newIndex]);
  };

  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, "MMMM yyyy", { locale: pt });
  };

  const serviceTypeColors: Record<string, string> = {
    Garden: "bg-green-500/10 text-green-700 border-green-500/20",
    Pool: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    Jacuzzi: "bg-purple-500/10 text-purple-700 border-purple-500/20",
    General: "bg-gray-500/10 text-gray-700 border-gray-500/20",
  };

  const serviceTypeLabels: Record<string, string> = {
    Garden: "Jardim",
    Pool: "Piscina",
    Jacuzzi: "Jacuzzi",
    General: "Geral",
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Galeria de Fotos"
        subtitle={`${filteredPhotos.length} ${filteredPhotos.length === 1 ? "foto" : "fotos"}`}
        backHref="/more"
        rightSlot={
          <Badge variant="outline" className="gap-1">
            <Image className="w-3 h-3" />
            {allPhotos.length}
          </Badge>
        }
      />
      <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto border-b">
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-[160px]" data-testid="select-client-filter">
              <User className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Todos os clientes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os clientes</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id.toString()}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[160px]" data-testid="select-month-filter">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Todos os meses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os meses</SelectItem>
              {availableMonths.map((month) => (
                <SelectItem key={month} value={month}>
                  {formatMonthLabel(month)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(selectedClient !== "all" || selectedMonth !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedClient("all");
                setSelectedMonth("all");
              }}
              data-testid="button-clear-filters"
            >
              <X className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>

      <main className="p-4 pb-24">
        {filteredPhotos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Image className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-center">
                {allPhotos.length === 0 
                  ? "Ainda não existem fotos de serviços"
                  : "Nenhuma foto encontrada com os filtros selecionados"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(photosByClient).map(([clientId, photos]) => {
              const client = clients.find((c) => c.id === parseInt(clientId));
              if (!client) return null;

              return (
                <Card key={clientId}>
                  <CardHeader className="pb-2">
                    <Link href={`/clients/${clientId}`}>
                      <CardTitle className="text-base flex items-center gap-2 hover:text-primary transition-colors cursor-pointer" data-testid={`link-client-${clientId}`}>
                        <User className="w-4 h-4" />
                        {client.name}
                        <Badge variant="secondary" className="ml-auto">
                          {photos.length} {photos.length === 1 ? "foto" : "fotos"}
                        </Badge>
                      </CardTitle>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                      {photos.map((photo, idx) => (
                        <div
                          key={`${photo.url}-${idx}`}
                          className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer hover-elevate"
                          onClick={() => openLightbox(photo)}
                          data-testid={`photo-${clientId}-${idx}`}
                        >
                          <img
                            src={photo.url}
                            alt={`${photo.type === "before" ? "Antes" : "Depois"} - ${client.name}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <Badge
                            className={`absolute bottom-1 left-1 text-[10px] px-1 py-0 ${
                              photo.type === "before"
                                ? "bg-muted text-muted-foreground"
                                : "bg-green-500/90 text-white"
                            }`}
                          >
                            {photo.type === "before" ? "Antes" : "Depois"}
                          </Badge>
                          <Badge
                            className={`absolute top-1 right-1 text-[10px] px-1 py-0 ${serviceTypeColors[photo.serviceLog.type]}`}
                          >
                            {serviceTypeLabels[photo.serviceLog.type]}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={!!lightboxPhoto} onOpenChange={() => setLightboxPhoto(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-0">
          {lightboxPhoto && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
                onClick={() => setLightboxPhoto(null)}
                data-testid="button-close-lightbox"
              >
                <X className="w-5 h-5" />
              </Button>

              <div className="absolute top-2 left-2 z-10 flex gap-2">
                <Badge
                  className={`${
                    lightboxPhoto.type === "before"
                      ? "bg-muted text-muted-foreground"
                      : "bg-green-500 text-white"
                  }`}
                >
                  {lightboxPhoto.type === "before" ? "Antes" : "Depois"}
                </Badge>
                <Badge className={serviceTypeColors[lightboxPhoto.serviceLog.type]}>
                  {serviceTypeLabels[lightboxPhoto.serviceLog.type]}
                </Badge>
              </div>

              <div className="flex items-center justify-center min-h-[60vh]">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={() => navigateLightbox("prev")}
                  data-testid="button-lightbox-prev"
                  aria-label="Fotografia anterior"
                >
                  <ChevronLeft className="w-8 h-8" aria-hidden="true" />
                </Button>

                <img
                  src={lightboxPhoto.url}
                  alt={`${lightboxPhoto.type === "before" ? "Antes" : "Depois"} - ${lightboxPhoto.client.name}`}
                  className="max-h-[80vh] max-w-full object-contain"
                />

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={() => navigateLightbox("next")}
                  data-testid="button-lightbox-next"
                  aria-label="Próxima fotografia"
                >
                  <ChevronRight className="w-8 h-8" aria-hidden="true" />
                </Button>
              </div>

              <div className="p-4 bg-gradient-to-t from-black/80 to-transparent">
                <Link href={`/clients/${lightboxPhoto.client.id}`}>
                  <p className="text-white font-medium hover:underline cursor-pointer">
                    {lightboxPhoto.client.name}
                  </p>
                </Link>
                <p className="text-white/70 text-sm">
                  {format(new Date(lightboxPhoto.serviceLog.date), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                </p>
                {lightboxPhoto.serviceLog.description && (
                  <p className="text-white/60 text-sm mt-1">
                    {lightboxPhoto.serviceLog.description}
                  </p>
                )}
                <p className="text-white/50 text-xs mt-2">
                  {lightboxIndex + 1} de {filteredPhotos.length}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
