import { useState } from "react";
import { useClients } from "@/hooks/use-clients";
import { BottomNav } from "@/components/BottomNav";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Loader2, Leaf, Waves, ThermometerSun, Phone, MapPin, Navigation, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Client } from "@shared/schema";
import { PageHeader } from "@/components/PageHeader";

const defaultCenter: [number, number] = [39.2417, -9.3128];

const tileLayers = {
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/" target="_blank" rel="noopener noreferrer">Esri</a>',
  },
};

const createMarkerIcon = (color: string) => new L.DivIcon({
  className: "custom-marker",
  html: `<div style="
    background-color: ${color};
    width: 32px;
    height: 32px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  "><div style="
    transform: rotate(45deg);
    color: white;
    font-size: 14px;
    font-weight: bold;
  "></div></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const gardenIcon = createMarkerIcon("hsl(145, 63%, 32%)");
const poolIcon = createMarkerIcon("hsl(195, 70%, 45%)");
const jacuzziIcon = createMarkerIcon("hsl(25, 80%, 50%)");
const generalIcon = createMarkerIcon("hsl(220, 15%, 40%)");

function getClientIcon(client: Client) {
  if (client.hasPool) return poolIcon;
  if (client.hasJacuzzi) return jacuzziIcon;
  if (client.hasGarden) return gardenIcon;
  return generalIcon;
}

export default function ClientsMap() {
  const { data: clients, isLoading } = useClients();
  const [mapType, setMapType] = useState<"street" | "satellite">("street");

  const clientsWithLocation = clients?.filter(
    (c) => c.latitude !== null && c.longitude !== null
  ) || [];

  const mapCenter: [number, number] = clientsWithLocation.length > 0
    ? [clientsWithLocation[0].latitude!, clientsWithLocation[0].longitude!]
    : defaultCenter;

  const openInMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Mapa de Clientes"
        subtitle="Localizações e rotas"
        backHref="/more"
        rightSlot={
          <Link href="/clients">
            <Button variant="outline" size="sm" className="rounded-xl" data-testid="button-back-to-clients">
              Ver Lista
            </Button>
          </Link>
        }
      />

      <div className="h-[calc(100vh-180px)] relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : clientsWithLocation.length > 0 ? (
          <>
            <MapContainer
              center={mapCenter}
              zoom={10}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                key={mapType}
                attribution={tileLayers[mapType].attribution}
                url={tileLayers[mapType].url}
              />
              {clientsWithLocation.map((client) => (
                <Marker
                  key={client.id}
                  position={[client.latitude!, client.longitude!]}
                  icon={getClientIcon(client)}
                >
                  <Popup>
                    <div className="min-w-[200px] p-1">
                      <h3 className="font-bold text-base mb-2">{client.name}</h3>
                      
                      {client.address && (
                        <p className="text-sm text-gray-600 flex items-start gap-1 mb-2">
                          <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          {client.address}
                        </p>
                      )}
                      
                      <div className="flex gap-1 mb-3 flex-wrap">
                        {client.hasGarden && (
                          <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                            <Leaf className="w-3 h-3" /> Jardim
                          </span>
                        )}
                        {client.hasPool && (
                          <span className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                            <Waves className="w-3 h-3" /> Piscina
                          </span>
                        )}
                        {client.hasJacuzzi && (
                          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            <ThermometerSun className="w-3 h-3" /> Jacuzzi
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {client.phone && (
                          <a
                            href={`tel:${client.phone}`}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-secondary text-secondary-foreground rounded-md text-xs font-medium"
                            data-testid={`button-call-${client.id}`}
                          >
                            <Phone className="w-3 h-3" />
                            Ligar
                          </a>
                        )}
                        <button
                          onClick={() => openInMaps(client.latitude!, client.longitude!)}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium"
                          data-testid={`button-navigate-${client.id}`}
                        >
                          <Navigation className="w-3 h-3" />
                          Navegar
                        </button>
                      </div>

                      <Link href={`/clients/${client.id}`}>
                        <button 
                          className="w-full mt-2 text-xs text-primary hover:underline"
                          data-testid={`link-client-detail-${client.id}`}
                        >
                          Ver detalhes do cliente
                        </button>
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="absolute bottom-6 left-4 z-[1000] shadow-md gap-1"
              onClick={() => setMapType(mapType === "street" ? "satellite" : "street")}
              data-testid="button-toggle-map-type"
            >
              <Layers className="w-4 h-4" />
              {mapType === "street" ? "Satélite" : "Mapa"}
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <MapPin className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma localização registada</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Adicione localizações aos seus clientes para os ver no mapa.
            </p>
            <Link href="/clients">
              <Button className="mt-4 btn-primary" data-testid="button-add-locations">
                Ir para Clientes
              </Button>
            </Link>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
