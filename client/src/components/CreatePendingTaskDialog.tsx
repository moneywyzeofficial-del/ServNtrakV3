import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Leaf, Waves, ThermometerSun, Wrench, X, AlertTriangle, ChevronUp, Loader2, Plus, ImagePlus } from "lucide-react";
import { useUpload } from "@/hooks/use-upload";

interface CreatePendingTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: number;
  clientName: string;
}

export function CreatePendingTaskDialog({ open, onOpenChange, clientId, clientName }: CreatePendingTaskDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useUpload();
  
  const [description, setDescription] = useState("");
  const [serviceType, setServiceType] = useState("Geral");
  const [priority, setPriority] = useState("normal");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const createTask = useMutation({
    mutationFn: async (data: {
      clientId: number;
      description: string;
      serviceType: string;
      priority: string;
      photos: string[];
    }) => {
      const response = await fetch("/api/pending-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to create task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pending-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pending-tasks/count"] });
      toast({
        title: "Tarefa registada",
        description: "A tarefa pendente foi criada com sucesso.",
      });
      resetForm();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a tarefa.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setDescription("");
    setServiceType("Geral");
    setPriority("normal");
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
    if (!description.trim()) {
      toast({
        title: "Descrição obrigatória",
        description: "Por favor, adicione uma descrição da tarefa.",
        variant: "destructive",
      });
      return;
    }

    createTask.mutate({
      clientId,
      description: description.trim(),
      serviceType,
      priority,
      photos,
    });
  };

  const serviceTypeOptions = [
    { value: "Jardim", label: "Jardim", icon: Leaf, color: "text-green-600" },
    { value: "Piscina", label: "Piscina", icon: Waves, color: "text-blue-600" },
    { value: "Jacuzzi", label: "Jacuzzi", icon: ThermometerSun, color: "text-muted-foreground" },
    { value: "Geral", label: "Geral", icon: Wrench, color: "text-gray-600" },
  ];

  const priorityOptions = [
    { value: "low", label: "Baixa", color: "text-gray-500" },
    { value: "normal", label: "Normal", color: "text-blue-600" },
    { value: "high", label: "Alta", color: "text-destructive" },
    { value: "urgent", label: "Urgente", color: "text-red-600" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Nova Tarefa Pendente
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Cliente: {clientName}</p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo de Serviço</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger data-testid="select-task-service-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypeOptions.map((option) => (
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
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger data-testid="select-task-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {option.value === "urgent" && <AlertTriangle className="w-4 h-4 text-red-600" />}
                        {option.value === "high" && <ChevronUp className="w-4 h-4 text-destructive" />}
                        <span className={option.color}>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição do Trabalho</Label>
            <Textarea
              placeholder="Descreva o trabalho a fazer..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none"
              data-testid="textarea-task-description"
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
                    data-testid={`button-remove-photo-${index}`}
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
                data-testid="button-add-task-photo"
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
              data-testid="button-cancel-task"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createTask.isPending || !description.trim()}
              className="flex-1 btn-primary"
              data-testid="button-save-task"
            >
              {createTask.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Guardar Tarefa
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
