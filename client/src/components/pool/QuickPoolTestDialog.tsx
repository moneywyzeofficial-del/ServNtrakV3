import { useState } from "react";
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
import { Droplets, Plus, Minus, Check, Copy, Sparkles, Filter, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickPoolTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName?: string;
  onSaveNotes?: (summary: string) => void;
}

export function QuickPoolTestDialog({
  open,
  onOpenChange,
  clientName,
  onSaveNotes,
}: QuickPoolTestDialogProps) {
  const { toast } = useToast();
  const [ph, setPh] = useState(7.4);
  const [chlorine, setChlorine] = useState(2.0);
  const [chlorineTabs, setChlorineTabs] = useState(0);
  const [saltBags, setSaltBags] = useState(0);
  const [filterWashed, setFilterWashed] = useState(true);
  const [skimmersCleaned, setSkimmersCleaned] = useState(true);
  const [vacuumed, setVacuumed] = useState(false);
  const [algaecide, setAlgaecide] = useState(false);

  // Status diagnosis
  const isPhIdeal = ph >= 7.2 && ph <= 7.6;
  const isPhLow = ph < 7.2;
  const isPhHigh = ph > 7.6;

  const isChlorineIdeal = chlorine >= 1.0 && chlorine <= 3.0;
  const isChlorineLow = chlorine < 1.0;
  const isChlorineHigh = chlorine > 3.0;

  const generateSummary = () => {
    const today = new Date().toLocaleDateString("pt-PT", {
      day: "numeric",
      month: "long",
    });

    const phStatus = isPhIdeal ? "Ideal" : isPhLow ? "Baixo (ácido)" : "Alto (alcalino)";
    const clStatus = isChlorineIdeal ? "Ideal" : isChlorineLow ? "Baixo" : "Alto";

    const actions: string[] = [];
    if (filterWashed) actions.push("Lavagem e enxaguamento de filtro");
    if (skimmersCleaned) actions.push("Limpeza de cestos e skimmers");
    if (vacuumed) actions.push("Aspiração do fundo");
    if (chlorineTabs > 0) actions.push(`${chlorineTabs}x pastilha(s) de cloro`);
    if (saltBags > 0) actions.push(`${saltBags}x saco(s) de sal 25kg`);
    if (algaecide) actions.push("Tratamento anti-algas");

    let text = `*Peralta Gardens · Manutenção de Piscina*\n`;
    if (clientName) text += `👤 Cliente: ${clientName}\n`;
    text += `📅 Data: ${today}\n`;
    text += `💧 Parâmetros: pH ${ph.toFixed(1)} (${phStatus}) | Cloro ${chlorine.toFixed(1)} ppm (${clStatus})\n`;
    if (actions.length > 0) {
      text += `🛠 Ações efetuadas:\n- ${actions.join("\n- ")}\n`;
    }
    text += `Água tratada e pronta a usar.`;
    return text;
  };

  const handleCopy = () => {
    const text = generateSummary();
    navigator.clipboard.writeText(text);
    toast({
      title: "Resumo copiado!",
      description: "Pronto para colar no WhatsApp do cliente ou nas notas.",
    });
  };

  const handleSave = () => {
    const text = generateSummary();
    if (onSaveNotes) {
      onSaveNotes(text);
    }
    handleCopy();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-5">
        <DialogHeader className="text-left pb-2 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-foreground">
                Registo de Água & Piscina
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {clientName ? `Cliente: ${clientName}` : "Parâmetros e químicos aplicados"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* pH Selector */}
          <div className="bg-muted/50 rounded-2xl p-4 border border-border">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Nível de pH (Ideal: 7.2 - 7.6)
              </label>
              <span
                className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-full border",
                  isPhIdeal
                    ? "bg-primary/10 text-primary border-primary/20"
                    : isPhLow
                    ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                    : "bg-rose-500/10 text-rose-700 border-rose-500/20"
                )}
              >
                {isPhIdeal ? "pH Ideal" : isPhLow ? "Ácido (pH+)" : "Alcalino (pH-)"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setPh(p => Math.max(6.6, Number((p - 0.1).toFixed(1))))}
                className="w-12 h-12 rounded-2xl bg-white border border-border shadow-sm flex items-center justify-center font-bold text-slate-800 touch-target active:scale-95 transition-transform"
                aria-label="Diminuir pH"
              >
                <Minus className="w-5 h-5" />
              </button>
              <div className="flex-1 text-center">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {ph.toFixed(1)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPh(p => Math.min(8.4, Number((p + 0.1).toFixed(1))))}
                className="w-12 h-12 rounded-2xl bg-white border border-border shadow-sm flex items-center justify-center font-bold text-slate-800 touch-target active:scale-95 transition-transform"
                aria-label="Aumentar pH"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chlorine Selector */}
          <div className="bg-muted/50 rounded-2xl p-4 border border-border">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Cloro Livre (Ideal: 1.0 - 3.0 ppm)
              </label>
              <span
                className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-full border",
                  isChlorineIdeal
                    ? "bg-primary/10 text-primary border-primary/20"
                    : isChlorineLow
                    ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                    : "bg-rose-500/10 text-rose-700 border-rose-500/20"
                )}
              >
                {isChlorineIdeal ? "Cloro Ideal" : isChlorineLow ? "Cloro Baixo" : "Cloro Alto"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setChlorine(c => Math.max(0.0, Number((c - 0.5).toFixed(1))))}
                className="w-12 h-12 rounded-2xl bg-white border border-border shadow-sm flex items-center justify-center font-bold text-slate-800 touch-target active:scale-95 transition-transform"
                aria-label="Diminuir cloro"
              >
                <Minus className="w-5 h-5" />
              </button>
              <div className="flex-1 text-center">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {chlorine.toFixed(1)}{" "}
                  <span className="text-sm font-semibold text-slate-500">ppm</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setChlorine(c => Math.min(6.0, Number((c + 0.5).toFixed(1))))}
                className="w-12 h-12 rounded-2xl bg-white border border-border shadow-sm flex items-center justify-center font-bold text-slate-800 touch-target active:scale-95 transition-transform"
                aria-label="Aumentar cloro"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Consumíveis Rápidos */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Químicos & Materiais Adicionados
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-2xl p-3 border border-border flex items-center justify-between shadow-sm">
                <span className="text-xs font-semibold text-slate-800">Pastilhas Cloro</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setChlorineTabs(n => Math.max(0, n - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 active:scale-90"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-bold text-sm">{chlorineTabs}</span>
                  <button
                    type="button"
                    onClick={() => setChlorineTabs(n => n + 1)}
                    className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center active:scale-90 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-3 border border-border flex items-center justify-between shadow-sm">
                <span className="text-xs font-semibold text-slate-800">Sacos Sal 25kg</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSaltBags(n => Math.max(0, n - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 active:scale-90"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-bold text-sm">{saltBags}</span>
                  <button
                    type="button"
                    onClick={() => setSaltBags(n => n + 1)}
                    className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center active:scale-90 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tarefas de Manutenção (Chips Clicáveis) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Operações de Manutenção
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFilterWashed(v => !v)}
                className={cn(
                  "p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all touch-manipulation min-h-[48px]",
                  filterWashed
                    ? "bg-primary/10 border-primary text-primary font-bold"
                    : "bg-white border-border text-slate-600"
                )}
              >
                <Filter className="w-4 h-4 shrink-0" />
                <span className="text-xs leading-tight">Lavar Filtro</span>
              </button>

              <button
                type="button"
                onClick={() => setSkimmersCleaned(v => !v)}
                className={cn(
                  "p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all touch-manipulation min-h-[48px]",
                  skimmersCleaned
                    ? "bg-primary/10 border-primary text-primary font-bold"
                    : "bg-white border-border text-slate-600"
                )}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="text-xs leading-tight">Limpar Skimmers</span>
              </button>

              <button
                type="button"
                onClick={() => setVacuumed(v => !v)}
                className={cn(
                  "p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all touch-manipulation min-h-[48px]",
                  vacuumed
                    ? "bg-primary/10 border-primary text-primary font-bold"
                    : "bg-white border-border text-slate-600"
                )}
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="text-xs leading-tight">Aspirar Fundo</span>
              </button>

              <button
                type="button"
                onClick={() => setAlgaecide(v => !v)}
                className={cn(
                  "p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all touch-manipulation min-h-[48px]",
                  algaecide
                    ? "bg-primary/10 border-primary text-primary font-bold"
                    : "bg-white border-border text-slate-600"
                )}
              >
                <Droplets className="w-4 h-4 shrink-0" />
                <span className="text-xs leading-tight">Anti-algas</span>
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            className="flex-1 rounded-xl min-h-[48px] font-bold text-slate-700"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copiar Resumo
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-xl min-h-[48px] font-bold bg-primary hover:bg-primary/90 text-white shadow-md"
          >
            <Check className="w-4 h-4 mr-2" />
            Concluir e Registar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
