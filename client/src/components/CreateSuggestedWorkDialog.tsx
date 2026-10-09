import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Lightbulb, Leaf, Waves, ThermometerSun, Wrench, X, Loader2, ImagePlus, Euro, Clock } from "lucide-react";
import { useUpload } from "@/hooks/use-upload";
import { DurationInput } from "@/components/DurationInput";

interface CreateSuggestedWorkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: number;
  clientName: string;
}

export function CreateSuggestedWorkDialog({ open, onOpenChange, clientId, clientName }: CreateSuggestedWorkDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useUpload();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("Geral");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState(60);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const createWork = useMutation({
    mutationFn: async (data: {
      clientId: number;
      title: string;
      description: string;
      notes: string | null;
      category: string;
      estimatedCost: number | null;
      estimatedDurationMinutes: number | null;
      photos: string[];
    }) => {
      const response = await fetch("/api/suggested-works", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to create suggested work");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suggested-works"] });
      toast({
        title: "Sugestão registada",
        description: "O trabalho sugerido foi criado com sucesso.",
      });
      resetForm();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o trabalho sugerido.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setNotes("");
    setCategory("Geral");
    setEstimatedCost("");
    setEstimatedDurationMinutes(60);
    setPhotos([]);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const response = await uploadFile(file);
        if (response) {
          return `/api/uploads/${response.objectPath}`;
        }
        return null;
      });

      const uploadedUrls = (await Promise.all(uploadPromises)).filter((url): url is string => url !== null);
      setPhotos((prev) => [...prev, ...uploadedUrls]);
    } catch (error) {
      toast({
        title: "Erro ao carregar fotos",
        description: "Não foi possível carregar as fotos.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, adicione um título para a sugestão.",
        variant: "destructive",
      });
      return;
    }

    createWork.mutate({
      clientId,
      title: title.trim(),
      description: description.trim(),
      notes: notes.trim() || null,
      category,
      estimatedCost: estimatedCost ? Math.round(parseFloat(estimatedCost) * 100) : null,
      estimatedDurationMinutes: estimatedDurationMinutes > 0 ? estimatedDurationMinutes : null,
      photos,
    });
  };

  const categoryOptions = [
    { value: "Limpeza", label: "Limpeza", icon: Wrench, color: "text-gray-600" },
    { value: "Plantação", label: "Plantação", icon: Leaf, color: "text-green-600" },
    { value: "Poda", label: "Poda", icon: Leaf, color: "text-lime-600" },
    { value: "Construção", label: "Construção", icon: Wrench, color: "text-muted-foreground" },
    { value: "Reparação", label: "Reparação", icon: Wrench, color: "text-muted-foreground" },
    { value: "Piscina", label: "Piscina", icon: Waves, color: "text-blue-600" },
    { value: "Jacuzzi", label: "Jacuzzi", icon: ThermometerSun, color: "text-cyan-600" },
    { value: "Geral", label: "Geral", icon: Wrench, color: "text-gray-500" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Sugerir Trabalho Extra
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Cliente: {clientName}</p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Título da Sugestão *</Label>
            <Input
              placeholder="Ex: Limpeza do passeio, Plantação de sebes..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-suggested-work-title"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger data-testid="select-suggested-work-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className={`w-4 h-4 ${option.color}`} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Custo Estimado</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  className="pl-9"
                  data-testid="input-suggested-work-cost"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Duração Estimada
            </Label>
            <DurationInput
              value={estimatedDurationMinutes}
              onChange={setEstimatedDurationMinutes}
              data-testid="input-suggested-work-duration"
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição do Trabalho</Label>
            <Textarea
              placeholder="Descreva o trabalho sugerido..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
              data-testid="textarea-suggested-work-description"
            />
          </div>

          <div className="space-y-2">
            <Label>Notas Técnicas</Label>
            <Textarea
              placeholder="Medidas, quantidades, materiais necessários..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="resize-none"
              data-testid="textarea-suggested-work-notes"
            />
          </div>

          <div className="space-y-2">
            <Label>Fotos</Label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="flex flex-wrap gap-2">
              {photos.map((photo, index) => (
                <div key={index} className="relative w-20 h-20">
                  <img
                    src={photo}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                    data-testid={`button-remove-suggested-photo-${index}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-20 h-20 border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                data-testid="button-add-suggested-photo"
              >
                {isUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="w-6 h-6" />
                    <span className="text-xs mt-1">Adicionar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel-suggested-work"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createWork.isPending || !title.trim()}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
              data-testid="button-save-suggested-work"
            >
              {createWork.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Guardar Sugestão
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
