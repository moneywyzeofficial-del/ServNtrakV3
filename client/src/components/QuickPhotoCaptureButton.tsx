import { useState, useRef } from "react";
import { Camera, X, Check, RotateCcw, Search, Loader2, Flower2, Waves, Sparkles, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useClients } from "@/hooks/use-clients";
import { useUpload } from "@/hooks/use-upload";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Client } from "@shared/schema";

const SERVICE_TYPES = [
  { value: "Jardim", label: "Jardim", icon: Flower2 },
  { value: "Piscina", label: "Piscina", icon: Waves },
  { value: "Jacuzzi", label: "Jacuzzi", icon: Sparkles },
  { value: "Outros", label: "Outros", icon: FolderPlus },
];

export function QuickPhotoCaptureButton() {
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showClientSelect, setShowClientSelect] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceType, setServiceType] = useState("Jardim");
  const [customCategory, setCustomCategory] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { uploadFile, isUploading } = useUpload();
  const { toast } = useToast();

  const createQuickPhoto = useMutation({
    mutationFn: async (data: { clientId: number; photoUrl: string; serviceType: string; customCategory?: string }) => {
      return await apiRequest("POST", "/api/quick-photos", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quick-photos"], refetchType: "all" });
      toast({
        title: "Foto guardada",
        description: "A foto foi associada ao cliente com sucesso.",
      });
      resetState();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível guardar a foto.",
        variant: "destructive",
      });
    },
  });

  const handleCapture = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoData(event.target?.result as string);
        setShowPreview(true);
      };
      reader.readAsDataURL(file);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRetake = () => {
    setPhotoData(null);
    setPhotoFile(null);
    setShowPreview(false);
    setTimeout(() => handleCapture(), 100);
  };

  const handleConfirmPhoto = () => {
    setShowPreview(false);
    setShowClientSelect(true);
  };

  const handleSelectClient = async (client: Client) => {
    if (!photoFile) return;

    try {
      const uploadResult = await uploadFile(photoFile);
      if (uploadResult) {
        await createQuickPhoto.mutateAsync({
          clientId: client.id,
          photoUrl: uploadResult.objectPath,
          serviceType,
          customCategory: serviceType === "Outros" ? customCategory : undefined,
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível fazer upload da foto.",
        variant: "destructive",
      });
    }
  };

  const resetState = () => {
    setPhotoData(null);
    setPhotoFile(null);
    setShowPreview(false);
    setShowClientSelect(false);
    setSearchQuery("");
    setServiceType("Jardim");
    setCustomCategory("");
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isSaving = isUploading || createQuickPhoto.isPending;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        data-testid="input-quick-photo"
      />

      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        onClick={handleCapture}
        data-testid="button-quick-photo"
        aria-label="Capturar fotografia"
      >
        <Camera className="h-6 w-6" aria-hidden="true" />
      </Button>

      <Drawer open={showPreview} onOpenChange={(open) => !open && resetState()}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Pré-visualização</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            {photoData && (
              <div className="relative">
                <img
                  src={photoData}
                  alt="Pré-visualização"
                  className="w-full rounded-lg max-h-[50vh] object-contain"
                />
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleRetake}
                data-testid="button-retake-photo"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Repetir
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirmPhoto}
                data-testid="button-confirm-photo"
              >
                <Check className="h-4 w-4 mr-2" />
                Confirmar
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={showClientSelect} onOpenChange={(open) => !open && resetState()}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Categorizar e Escolher Cliente</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <div className="mb-4">
              <Label className="text-sm font-medium mb-2 block">Categoria</Label>
              <RadioGroup
                value={serviceType}
                onValueChange={setServiceType}
                className="grid grid-cols-2 gap-2"
                data-testid="radio-service-type"
              >
                {SERVICE_TYPES.map(({ value, label, icon: Icon }) => (
                  <div key={value} className="flex items-center">
                    <RadioGroupItem value={value} id={`type-${value}`} className="peer sr-only" />
                    <Label
                      htmlFor={`type-${value}`}
                      className="flex items-center gap-2 w-full p-3 rounded-lg border border-border cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 hover:bg-muted/50 transition-colors"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              
              {serviceType === "Outros" && (
                <div className="mt-3">
                  <Input
                    placeholder="Nome da pasta..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full"
                    data-testid="input-custom-category"
                  />
                </div>
              )}
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-client"
              />
            </div>

            {isSaving && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2">A guardar...</span>
              </div>
            )}

            {!isSaving && (
              <ScrollArea className="h-[40vh]">
                {clientsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum cliente encontrado
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredClients.map((client) => (
                      <button
                        key={client.id}
                        onClick={() => handleSelectClient(client)}
                        className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        data-testid={`button-select-client-${client.id}`}
                      >
                        <div className="font-medium">{client.name}</div>
                        {client.address && (
                          <div className="text-sm text-muted-foreground truncate">
                            {client.address}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
