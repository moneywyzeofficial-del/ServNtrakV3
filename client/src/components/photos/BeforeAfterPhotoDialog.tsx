import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, Check, Trash2, ArrowRightLeft, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeforeAfterPhotoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName?: string;
  onSave?: (beforePhoto: string | null, afterPhoto: string | null) => void;
}

export function BeforeAfterPhotoDialog({
  open,
  onOpenChange,
  clientName,
  onSave,
}: BeforeAfterPhotoDialogProps) {
  const { toast } = useToast();
  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"before" | "after" | "compare">("before");

  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "before" | "after"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (type === "before") {
        setBeforePhoto(dataUrl);
        if (!afterPhoto) setActiveTab("after");
      } else {
        setAfterPhoto(dataUrl);
        if (beforePhoto) setActiveTab("compare");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(beforePhoto, afterPhoto);
    }
    toast({
      title: "Fotos de serviço guardadas!",
      description: "Registo Antes/Depois associado à visita.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-5">
        <DialogHeader className="text-left pb-2 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-foreground">
                Registo Visual Antes & Depois
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {clientName ? `Trabalho em: ${clientName}` : "Comprovação visual de serviço"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Abas de Navegação */}
        <div className="flex rounded-2xl bg-muted p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("before")}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-bold transition-all touch-manipulation",
              activeTab === "before" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            )}
          >
            1. Foto Antes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("after")}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-bold transition-all touch-manipulation",
              activeTab === "after" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            )}
          >
            2. Foto Depois
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("compare")}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-bold transition-all touch-manipulation flex items-center justify-center gap-1",
              activeTab === "compare" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            )}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" /> Lado a Lado
          </button>
        </div>

        {/* Conteúdo por Aba */}
        <div className="py-2">
          {activeTab === "before" && (
            <div className="space-y-3">
              <div className="relative aspect-video rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center overflow-hidden">
                {beforePhoto ? (
                  <>
                    <img
                      src={beforePhoto}
                      alt="Antes do trabalho"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setBeforePhoto(null)}
                      className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      ANTES
                    </span>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">Fotografia antes de iniciar</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Estado inicial do jardim ou piscina
                    </p>
                  </div>
                )}
              </div>

              <input
                ref={beforeInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFileChange(e, "before")}
              />

              <Button
                type="button"
                onClick={() => beforeInputRef.current?.click()}
                className="w-full min-h-[48px] rounded-xl font-bold bg-primary hover:bg-primary/90 text-white"
              >
                <Camera className="w-4 h-4 mr-2" />
                {beforePhoto ? "Tirar Nova Foto (Antes)" : "Tirar Foto Antes"}
              </Button>
            </div>
          )}

          {activeTab === "after" && (
            <div className="space-y-3">
              <div className="relative aspect-video rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center overflow-hidden">
                {afterPhoto ? (
                  <>
                    <img
                      src={afterPhoto}
                      alt="Depois do trabalho"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setAfterPhoto(null)}
                      className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className="absolute bottom-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      DEPOIS
                    </span>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">Fotografia do resultado final</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Trabalho concluído e limpo
                    </p>
                  </div>
                )}
              </div>

              <input
                ref={afterInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFileChange(e, "after")}
              />

              <Button
                type="button"
                onClick={() => afterInputRef.current?.click()}
                className="w-full min-h-[48px] rounded-xl font-bold bg-primary hover:bg-primary/90 text-white"
              >
                <Camera className="w-4 h-4 mr-2" />
                {afterPhoto ? "Tirar Nova Foto (Depois)" : "Tirar Foto Depois"}
              </Button>
            </div>
          )}

          {activeTab === "compare" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="relative aspect-[3/4] rounded-2xl bg-slate-100 overflow-hidden border border-border">
                  {beforePhoto ? (
                    <img src={beforePhoto} alt="Antes" className="w-full h-full object-cover" />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-2 text-center text-slate-400">
                      <ImageIcon className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-bold">Sem foto antes</span>
                    </div>
                  )}
                  <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    ANTES
                  </span>
                </div>

                <div className="relative aspect-[3/4] rounded-2xl bg-slate-100 overflow-hidden border border-border">
                  {afterPhoto ? (
                    <img src={afterPhoto} alt="Depois" className="w-full h-full object-cover" />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-2 text-center text-slate-400">
                      <ImageIcon className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-bold">Sem foto depois</span>
                    </div>
                  )}
                  <span className="absolute bottom-1.5 left-1.5 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    DEPOIS
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-xl min-h-[48px] font-bold text-slate-600"
          >
            Fechar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!beforePhoto && !afterPhoto}
            className="flex-1 rounded-xl min-h-[48px] font-bold bg-primary hover:bg-primary/90 text-white shadow-md"
          >
            <Check className="w-4 h-4 mr-2" />
            Guardar Fotos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
