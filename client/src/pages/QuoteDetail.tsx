import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useQuote,
  useUpdateQuote,
  useUpdateQuoteItems,
  useDeleteQuote,
} from "@/hooks/use-quotes";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  FileDown,
  Send,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { QuoteItem } from "@shared/schema";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ── Tipos locais ───────────────────────────────────────────────────────────────

type ItemDraft = {
  description: string;
  type: "service" | "material" | "labor";
  quantity: number;
  unitPrice: number;
  total: number;
};

const typeLabels: Record<ItemDraft["type"], string> = {
  service: "Serviço",
  material: "Material",
  labor: "Mão de obra",
};

const typeBadgeClass: Record<ItemDraft["type"], string> = {
  service:  "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  material: "bg-muted text-muted-foreground",
  labor:    "bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400",
};

const statusConfig: Record<string, { label: string; badge: string }> = {
  draft:    { label: "Rascunho",  badge: "bg-muted text-muted-foreground" },
  enviado:  { label: "Enviado",   badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" },
  aceite:   { label: "Aceite",    badge: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" },
  recusado: { label: "Recusado",  badge: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400" },
};

// ── PDF ───────────────────────────────────────────────────────────────────────

function generateQuotePdf(quote: any) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const MARGIN = 20;
  const PAGE_W = 210;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(45, 106, 79); // primary green
  doc.text("ORÇAMENTO", PAGE_W / 2, 28, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(quote.quoteNumber, PAGE_W / 2, 35, { align: "center" });

  // Separator
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, 40, PAGE_W - MARGIN, 40);

  // Client info
  let y = 48;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text("Cliente:", MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.text(quote.client.name, MARGIN + 20, y);
  y += 6;

  if (quote.client.address) {
    doc.text(quote.client.address, MARGIN + 20, y);
    y += 6;
  }

  doc.setFont("helvetica", "bold");
  doc.text("Data:", MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.text(format(new Date(quote.createdAt), "d 'de' MMMM yyyy", { locale: pt }), MARGIN + 20, y);
  y += 6;

  if (quote.validUntil) {
    doc.setFont("helvetica", "bold");
    doc.text("Válido até:", MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.text(format(new Date(quote.validUntil), "d 'de' MMMM yyyy", { locale: pt }), MARGIN + 28, y);
    y += 6;
  }

  y += 4;

  // Items table
  const rows = quote.items.map((item: QuoteItem) => [
    item.description,
    typeLabels[item.type as keyof typeof typeLabels] ?? item.type,
    String(item.quantity),
    `${item.unitPrice.toFixed(2)} €`,
    `${item.total.toFixed(2)} €`,
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Descrição", "Tipo", "Qtd.", "Preço unit.", "Total"]],
    body: rows,
    margin: { left: MARGIN, right: MARGIN },
    headStyles: { fillColor: [217, 119, 6], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [254, 243, 199] },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 28 },
      2: { cellWidth: 16, halign: "right" },
      3: { cellWidth: 26, halign: "right" },
      4: { cellWidth: 26, halign: "right" },
    },
  });

  const afterTable = (doc as any).lastAutoTable.finalY + 6;

  // Total
  const grandTotal = quote.items.reduce((s: number, i: QuoteItem) => s + i.total, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(217, 119, 6);
  doc.text(
    `Total: ${grandTotal.toFixed(2)} €`,
    PAGE_W - MARGIN,
    afterTable,
    { align: "right" }
  );

  // Notes
  if (quote.notes) {
    let ny = afterTable + 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text("Observações:", MARGIN, ny);
    ny += 5;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(quote.notes, CONTENT_W);
    doc.text(lines, MARGIN, ny);
  }

  // Footer
  const footerY = 285;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text(
    "Este orçamento é válido conforme a data indicada. Sujeito a alterações sem aviso prévio.",
    PAGE_W / 2,
    footerY,
    { align: "center", maxWidth: CONTENT_W }
  );

  doc.save(`${quote.quoteNumber}.pdf`);
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const { data: quote, isLoading } = useQuote(Number(id));
  const updateQuote = useUpdateQuote();
  const updateItems = useUpdateQuoteItems();
  const deleteQuote = useDeleteQuote();

  // Edit items state
  const [editingItems, setEditingItems] = useState(false);
  const [draftItems, setDraftItems] = useState<ItemDraft[]>([]);

  // Item dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [itemDraft, setItemDraft] = useState<ItemDraft>({
    description: "",
    type: "service",
    quantity: 1,
    unitPrice: 0,
    total: 0,
  });

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-3">
        <p className="text-muted-foreground">Orçamento não encontrado.</p>
        <Button variant="outline" onClick={() => navigate("/quotes")}>
          Voltar
        </Button>
      </div>
    );
  }

  const total = quote.items.reduce((s, i) => s + i.total, 0);
  const sc = statusConfig[quote.status] ?? statusConfig.draft;

  // ── Status change ─────────────────────────────────────────────────────────
  const changeStatus = async (status: string) => {
    await updateQuote.mutateAsync({ id: quote.id, status });
  };

  // ── Edit items ────────────────────────────────────────────────────────────
  const startEditItems = () => {
    setDraftItems(quote.items.map((i) => ({
      description: i.description,
      type: i.type as ItemDraft["type"],
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total: i.total,
    })));
    setEditingItems(true);
  };

  const saveItems = async () => {
    await updateItems.mutateAsync({ id: quote.id, items: draftItems });
    setEditingItems(false);
  };

  const openAddItem = () => {
    setEditingIdx(null);
    setItemDraft({ description: "", type: "service", quantity: 1, unitPrice: 0, total: 0 });
    setDialogOpen(true);
  };

  const openEditItem = (idx: number) => {
    setEditingIdx(idx);
    setItemDraft({ ...draftItems[idx] });
    setDialogOpen(true);
  };

  const confirmItem = () => {
    const final: ItemDraft = { ...itemDraft, total: itemDraft.quantity * itemDraft.unitPrice };
    if (editingIdx === null) {
      setDraftItems((prev) => [...prev, final]);
    } else {
      setDraftItems((prev) => prev.map((it, i) => (i === editingIdx ? final : it)));
    }
    setDialogOpen(false);
  };

  const removeItem = (idx: number) => {
    setDraftItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDelete = async () => {
    if (deleteConfirm !== "CONFIRMAR") return;
    await deleteQuote.mutateAsync(quote.id);
    navigate("/quotes");
  };

  const displayItems = editingItems ? draftItems : quote.items.map((i) => ({
    description: i.description,
    type: i.type as ItemDraft["type"],
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    total: i.total,
  }));

  const displayTotal = displayItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title={quote.quoteNumber}
        subtitle="Detalhes do orçamento"
        backHref="/more"
        sticky={false}
        rightSlot={
          <Badge variant="secondary" className={cn("text-xs", sc.badge)}>
            {sc.label}
          </Badge>
        }
      />

      <div className="px-6 space-y-5">
        {/* ── Informação geral ──────────────────────────────────── */}
        <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Data</span>
            <span className="font-medium">
              {format(new Date(quote.createdAt!), "d MMM yyyy", { locale: pt })}
            </span>
          </div>
          {quote.validUntil && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Válido até</span>
              <span className="font-medium">
                {format(new Date(quote.validUntil), "d MMM yyyy", { locale: pt })}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="text-base font-bold text-primary">
              {total.toFixed(2)} €
            </span>
          </div>
          {quote.notes && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Notas</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}
        </div>

        {/* ── Acções de estado ──────────────────────────────────── */}
        <div className="bg-card rounded-2xl border border-border/50 p-4">
          <p className="text-sm font-semibold text-foreground mb-3">Acções</p>
          <div className="flex flex-wrap gap-2">
            {quote.status !== "enviado" && quote.status !== "aceite" && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50"
                onClick={() => changeStatus("enviado")}
                disabled={updateQuote.isPending}
              >
                <Send className="w-4 h-4" /> Marcar como Enviado
              </Button>
            )}
            {quote.status !== "aceite" && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-green-300 text-green-700 hover:bg-green-50"
                onClick={() => changeStatus("aceite")}
                disabled={updateQuote.isPending}
              >
                <CheckCircle2 className="w-4 h-4" /> Marcar como Aceite
              </Button>
            )}
            {quote.status !== "recusado" && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => changeStatus("recusado")}
                disabled={updateQuote.isPending}
              >
                <XCircle className="w-4 h-4" /> Marcar como Recusado
              </Button>
            )}
            {quote.status !== "draft" && (
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-muted-foreground"
                onClick={() => changeStatus("draft")}
                disabled={updateQuote.isPending}
              >
                <RotateCcw className="w-4 h-4" /> Voltar a Rascunho
              </Button>
            )}
          </div>
        </div>

        {/* ── Itens ─────────────────────────────────────────────── */}
        <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Itens</h2>
            {editingItems ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingItems(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={openAddItem}
                  className="text-xs text-primary font-medium flex items-center gap-1 hover:text-primary/80 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </div>
            ) : (
              <button
                onClick={startEditItems}
                className="text-xs text-primary font-medium flex items-center gap-1 hover:text-primary/80 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Editar
              </button>
            )}
          </div>

          <div className="space-y-3">
            {displayItems.map((item, idx) => (
              <div key={idx} className="flex items-start justify-between gap-3 bg-muted/40 rounded-xl p-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium text-foreground truncate">{item.description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
                      typeBadgeClass[item.type]
                    )}>
                      {typeLabels[item.type]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.quantity} × {item.unitPrice.toFixed(2)} €
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      = {(item.quantity * item.unitPrice).toFixed(2)} €
                    </span>
                  </div>
                </div>
                {editingItems && (
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    <button
                      onClick={() => openEditItem(idx)}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeItem(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-border/50 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Total</span>
            <span className="text-base font-bold text-primary">
              {displayTotal.toFixed(2)} €
            </span>
          </div>

          {editingItems && (
            <Button
              className="w-full"
              onClick={saveItems}
              disabled={updateItems.isPending}
            >
              {updateItems.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Guardar Itens
            </Button>
          )}
        </div>

        {/* ── Exportar PDF ──────────────────────────────────────── */}
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => generateQuotePdf(quote)}
        >
          <FileDown className="w-4 h-4" /> Exportar PDF
        </Button>

        {/* ── Apagar ────────────────────────────────────────────── */}
        <Button
          variant="ghost"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => { setDeleteConfirm(""); setDeleteOpen(true); }}
        >
          <Trash2 className="w-4 h-4 mr-2" /> Apagar Orçamento
        </Button>
      </div>

      {/* ── Dialog de item ────────────────────────────────────────── */}
      <ItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isEditing={editingIdx !== null}
        draft={itemDraft}
        onDraftChange={setItemDraft}
        onConfirm={confirmItem}
      />

      {/* ── Dialog de apagar ──────────────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={(o) => !o && setDeleteOpen(false)}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Apagar orçamento?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta acção é irreversível. Escreve <strong>CONFIRMAR</strong> para continuar.
          </p>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="CONFIRMAR"
            className="rounded-xl"
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteConfirm !== "CONFIRMAR" || deleteQuote.isPending}
            >
              {deleteQuote.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Apagar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Descrição</label>
            <Input
              placeholder="Ex: Poda de árvores"
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              className="rounded-xl"
              autoFocus
            />
          </div>

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
