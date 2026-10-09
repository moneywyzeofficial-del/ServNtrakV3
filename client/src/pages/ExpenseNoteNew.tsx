import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useClients } from "@/hooks/use-clients";
import { useCreateExpenseNote } from "@/hooks/use-expense-notes";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Tipos locais ───────────────────────────────────────────────────────────────

type ItemDraft = {
  description: string;
  type: "service" | "material" | "labor";
  quantity: number;
  unitPrice: number;
  total: number;
  sourceType: "manual";
};

const typeLabels: Record<ItemDraft["type"], string> = {
  service: "Serviço",
  material: "Material",
  labor: "Mão de obra",
};

const typeBadgeClass: Record<ItemDraft["type"], string> = {
  service: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  material: "bg-muted text-muted-foreground",
  labor: "bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400",
};

// ── Componente principal ───────────────────────────────────────────────────────

export default function ExpenseNoteNew() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const params = new URLSearchParams(window.location.search);
  const clientIdParam = params.get("clientId");
  const serviceLogIdParam = params.get("serviceLogId");

  const { data: clients } = useClients();
  const createExpenseNote = useCreateExpenseNote();

  const [selectedClientId, setSelectedClientId] = useState<number | null>(
    clientIdParam ? parseInt(clientIdParam) : null
  );
  const [items, setItems] = useState<ItemDraft[]>([]);
  const [notes, setNotes] = useState("");

  // ── Estado do dialog de item ──────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<ItemDraft>({
    description: "",
    type: "service",
    quantity: 1,
    unitPrice: 0,
    total: 0,
    sourceType: "manual",
  });

  // ── Auto-criação a partir de service log ──────────────────────────────────
  const fromServiceLog = useMutation({
    mutationFn: async (logId: string) => {
      const res = await fetch(`/api/expense-notes/from-service-log/${logId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao criar nota a partir do registo");
      return res.json();
    },
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ["expense-notes"] });
      navigate(`/expense-notes/${note.id}`);
    },
  });

  useEffect(() => {
    if (serviceLogIdParam) {
      fromServiceLog.mutate(serviceLogIdParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceLogIdParam]);

  // ── Gestão de itens ───────────────────────────────────────────────────────
  const openAddDialog = () => {
    setEditingIdx(null);
    setDraft({ description: "", type: "service", quantity: 1, unitPrice: 0, total: 0, sourceType: "manual" });
    setDialogOpen(true);
  };

  const openEditDialog = (idx: number) => {
    setEditingIdx(idx);
    setDraft({ ...items[idx] });
    setDialogOpen(true);
  };

  const handleDialogConfirm = () => {
    const finalItem: ItemDraft = { ...draft, total: draft.quantity * draft.unitPrice };
    if (editingIdx === null) {
      setItems((prev) => [...prev, finalItem]);
    } else {
      setItems((prev) => prev.map((item, i) => (i === editingIdx ? finalItem : item)));
    }
    setDialogOpen(false);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Submissão ─────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedClientId || items.length === 0) return;
    const note = await createExpenseNote.mutateAsync({
      clientId: selectedClientId,
      status: "draft",
      notes: notes.trim() || null,
      items: items.map((i) => ({
        ...i,
        total: i.quantity * i.unitPrice,
        expenseNoteId: 0, // será substituído pelo servidor
      })),
    } as any);
    navigate(`/expense-notes/${note.id}`);
  };

  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const canSubmit = !!selectedClientId && items.length > 0;

  // ── Loading enquanto cria a partir de service log ─────────────────────────
  if (serviceLogIdParam) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">
            A criar nota a partir do registo...
          </p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Nova Nota de Despesa"
        subtitle="Registar serviço prestado"
        backHref="/more"
        sticky={false}
      />

      <div className="px-6 space-y-5">
        {/* ── Secção: Cliente ───────────────────────────────────── */}
        <div className="bg-card rounded-2xl border border-border/50 p-4">
          <label className="text-sm font-semibold text-foreground block mb-3">
            Cliente
          </label>
          {clientIdParam ? (
            <p className="text-sm text-foreground font-medium">
              {clients?.find((c) => c.id === selectedClientId)?.name ??
                "A carregar..."}
            </p>
          ) : (
            <Select
              value={selectedClientId ? String(selectedClientId) : ""}
              onValueChange={(v) => setSelectedClientId(parseInt(v))}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Seleciona o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* ── Secção: Itens ─────────────────────────────────────── */}
        <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Itens</h2>
            <button
              onClick={openAddDialog}
              className="text-xs text-primary font-medium flex items-center gap-1 hover:text-primary/80 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Item
            </button>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Adiciona pelo menos um item
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => (
                <ItemCard
                  key={idx}
                  item={item}
                  onEdit={() => openEditDialog(idx)}
                  onDelete={() => removeItem(idx)}
                />
              ))}
            </div>
          )}

          {/* Linha de total */}
          {items.length > 0 && (
            <div className="pt-3 border-t border-border/50 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className="text-base font-bold text-primary">
                {total.toFixed(2)} €
              </span>
            </div>
          )}
        </div>

        {/* ── Secção: Notas ─────────────────────────────────────── */}
        <div className="bg-card rounded-2xl border border-border/50 p-4">
          <label className="text-sm font-semibold text-foreground block mb-3">
            Notas{" "}
            <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <Textarea
            placeholder="Observações adicionais (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="resize-none text-sm rounded-xl"
          />
        </div>

        {/* ── Botão de submissão ────────────────────────────────── */}
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={!canSubmit || createExpenseNote.isPending}
        >
          {createExpenseNote.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              A criar...
            </>
          ) : (
            "Criar Nota de Despesa"
          )}
        </Button>
      </div>

      {/* ── Dialog de item ───────────────────────────────────── */}
      <ItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isEditing={editingIdx !== null}
        draft={draft}
        onDraftChange={setDraft}
        onConfirm={handleDialogConfirm}
      />

      <BottomNav />
    </div>
  );
}

// ── ItemDialog ────────────────────────────────────────────────────────────────

function ItemDialog({
  open,
  onOpenChange,
  isEditing,
  draft,
  onDraftChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  draft: ItemDraft;
  onDraftChange: (draft: ItemDraft) => void;
  onConfirm: () => void;
}) {
  const computed = draft.quantity * draft.unitPrice;
  const canConfirm = draft.description.trim().length > 0 && draft.unitPrice >= 0;

  const set = (field: keyof ItemDraft, value: string | number) =>
    onDraftChange({ ...draft, [field]: value });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Item" : "Novo Item"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Descrição</label>
            <Input
              placeholder="Ex: Limpeza de filtros"
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              className="rounded-xl"
              autoFocus
            />
          </div>

          {/* Tipo */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Tipo</label>
            <Select
              value={draft.type}
              onValueChange={(v) => set("type", v as ItemDraft["type"])}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="service">Serviço</SelectItem>
                <SelectItem value="material">Material</SelectItem>
                <SelectItem value="labor">Mão de obra</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantidade + Preço unitário lado a lado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Quantidade</label>
              <Input
                type="number"
                min={0.1}
                step={0.5}
                value={draft.quantity === 0 ? "" : draft.quantity}
                onChange={(e) => set("quantity", parseFloat(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Preço unit.</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                  €
                </span>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={draft.unitPrice === 0 ? "" : draft.unitPrice}
                  onChange={(e) => set("unitPrice", parseFloat(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                  className="rounded-xl pl-7"
                />
              </div>
            </div>
          </div>

          {/* Total calculado (read-only) */}
          <div className="bg-muted/50 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-base font-bold text-primary">
              {computed.toFixed(2)} €
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={!canConfirm}>
            {isEditing ? "Guardar" : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── ItemCard ──────────────────────────────────────────────────────────────────

function ItemCard({
  item,
  onEdit,
  onDelete,
}: {
  item: ItemDraft;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const subtotal = item.quantity * item.unitPrice;

  return (
    <div className="flex items-start justify-between gap-3 bg-muted/40 rounded-xl p-3">
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium text-foreground truncate">
          {item.description}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
              typeBadgeClass[item.type]
            )}
          >
            {typeLabels[item.type]}
          </span>
          <span className="text-xs text-muted-foreground">
            {item.quantity} × {item.unitPrice.toFixed(2)} €
          </span>
          <span className="text-xs font-semibold text-foreground">
            = {subtotal.toFixed(2)} €
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 mt-0.5">
        <button
          onClick={onEdit}
          className="text-muted-foreground hover:text-primary transition-colors"
          data-testid={`edit-item-${item.description}`}
          aria-label="Editar artigo"
        >
          <Pencil className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive transition-colors"
          data-testid={`remove-item-${item.description}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
