import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { MapPin, LocateFixed, X, Layers, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (lat: number | null, lng: number | null) => void;
  onAddressChange?: (address: string) => void;
  triggerLabel?: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

function MapClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapRefSetter({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

function FlyToLocation({ location }: { location: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lng], 15, { duration: 1.5 });
    }
  }, [location, map]);
  return null;
}

export function MapPicker({ latitude, longitude, onChange, onAddressChange, triggerLabel }: MapPickerProps) {
  const [open, setOpen] = useState(false);
  const [tempLocation, setTempLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapType, setMapType] = useState<"street" | "satellite">("street");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hasLocation = latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined;
  
  const currentMarker = tempLocation ?? (hasLocation ? { lat: latitude!, lng: longitude! } : null);
  const displayCenter: [number, number] = currentMarker ? [currentMarker.lat, currentMarker.lng] : defaultCenter;

  const handleLocationChange = (lat: number, lng: number) => {
    setTempLocation({ lat, lng });
    setShowResults(false);
  };

  const handleConfirm = async () => {
    if (!currentMarker) return;
    onChange(currentMarker.lat, currentMarker.lng);
    if (onAddressChange) {
      setIsGeocoding(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentMarker.lat}&lon=${currentMarker.lng}`,
          { headers: { "Accept-Language": "pt" } }
        );
        const data = await res.json();
        const a = data.address ?? {};
        const road = a.road || a.pedestrian || a.footway || a.path || "";
        const num = a.house_number ? ` ${a.house_number}` : "";
        const postcode = a.postcode ? `${a.postcode} ` : "";
        const locality = a.city || a.town || a.village || a.municipality || a.county || "";
        const street = road + num;
        const formatted = [street, `${postcode}${locality}`.trim()].filter(Boolean).join(", ");
        onAddressChange(formatted || data.display_name?.split(",").slice(0, 3).join(",").trim() || "");
      } catch {
        // silently ignore geocoding failure
      } finally {
        setIsGeocoding(false);
      }
    }
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null, null);
    setTempLocation(null);
    setOpen(false);
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setTempLocation(null);
      setSearchQuery("");
      setSearchResults([]);
      setShowResults(false);
      setFlyToTarget(null);
    }
  };

  const handleLocate = () => {
    if (mapRef.current) {
      mapRef.current.locate({ setView: true, maxZoom: 16 });
      mapRef.current.once("locationfound", (e) => {
        handleLocationChange(e.latlng.lat, e.latlng.lng);
      });
    }
  };

  const searchLocation = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=pt&limit=5`,
        {
          headers: {
            "Accept-Language": "pt",
          },
        }
      );
      const data: NominatimResult[] = await response.json();
      setSearchResults(data);
      setShowResults(data.length > 0);
    } catch (error) {
      console.error("Erro ao pesquisar localização:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(value);
    }, 500);
  };

  const handleSelectResult = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setTempLocation({ lat, lng });
    setFlyToTarget({ lat, lng });
    setShowResults(false);
    setSearchQuery(result.display_name.split(",")[0]);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchLocation(searchQuery);
    }
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start text-left rounded-xl"
          data-testid="button-open-map-picker"
        >
          <MapPin className="w-4 h-4 mr-2 text-primary" />
          {triggerLabel ? (
            <span className="text-muted-foreground">{triggerLabel}</span>
          ) : hasLocation ? (
            <span className="truncate">
              {latitude!.toFixed(5)}, {longitude!.toFixed(5)}
            </span>
          ) : (
            <span className="text-muted-foreground">Selecionar localização no mapa</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-lg font-display text-primary">Selecionar Localização</DialogTitle>
        </DialogHeader>
        
        <div className="px-4 pb-2 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Pesquisar localidade..."
              value={searchQuery}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              className="pl-9 pr-9 rounded-xl"
              data-testid="input-search-location"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
            )}
          </div>
          
          {showResults && searchResults.length > 0 && (
            <div className="absolute left-4 right-4 top-full mt-1 bg-background border rounded-xl shadow-lg z-[1001] max-h-48 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.place_id}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 first:rounded-t-xl last:rounded-b-xl transition-colors"
                  onClick={() => handleSelectResult(result)}
                  data-testid={`search-result-${result.place_id}`}
                >
                  <span className="line-clamp-2">{result.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="h-[45vh] relative">
          <MapContainer
            center={displayCenter}
            zoom={hasLocation ? 14 : 10}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              key={mapType}
              attribution={tileLayers[mapType].attribution}
              url={tileLayers[mapType].url}
            />
            <MapClickHandler onLocationChange={handleLocationChange} />
            <MapRefSetter mapRef={mapRef} />
            <FlyToLocation location={flyToTarget} />
            {currentMarker && (
              <Marker position={[currentMarker.lat, currentMarker.lng]} icon={markerIcon} />
            )}
          </MapContainer>
          
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute top-3 right-3 z-[1000] shadow-md"
            onClick={handleLocate}
            data-testid="button-locate-me"
            aria-label="Localizar a minha posição"
          >
            <LocateFixed className="w-4 h-4" aria-hidden="true" />
          </Button>
          
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="absolute bottom-3 left-3 z-[1000] shadow-md gap-1"
            onClick={() => setMapType(mapType === "street" ? "satellite" : "street")}
            data-testid="button-toggle-map-type"
          >
            <Layers className="w-4 h-4" />
            {mapType === "street" ? "Satélite" : "Mapa"}
          </Button>
        </div>

        <div className="p-4 border-t bg-background flex gap-2">
          {hasLocation && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              className="flex-shrink-0"
              data-testid="button-clear-location"
            >
              <X className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          )}
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!currentMarker || isGeocoding}
            className="flex-1 btn-primary"
            data-testid="button-confirm-location"
          >
            {isGeocoding ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />A obter morada...</>
            ) : currentMarker ? (
              `Confirmar (${currentMarker.lat.toFixed(4)}, ${currentMarker.lng.toFixed(4)})`
            ) : (
              "Toque no mapa para selecionar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
