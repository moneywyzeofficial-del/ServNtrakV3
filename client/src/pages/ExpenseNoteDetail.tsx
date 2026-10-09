import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useExpenseNote,
  useUpdateExpenseNoteItems,
  useUpdateExpenseNote,
  useDeleteExpenseNote,
  useCreateExpenseNoteEdit,
} from "@/hooks/use-expense-notes";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Loader2,
  Edit2,
  Trash2,
  Send,
  FileText,
  AlertCircle,
  Download,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExpenseNoteWithDetails } from "@shared/schema";
import { generateExpenseNotePdf, shareExpenseNotePdf } from "@/lib/expenseNotesPdf";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type EditableItem = {
  id?: number;
  description: string;
  type: "service" | "material" | "labor";
  quantity: number;
  unitPrice: number;
  sourceType: string;
  editReason: string;
  // snapshot para detectar alterações em relação ao original
  _origDescription: string;
  _origQuantity: number;
  _origUnitPrice: number;
  _wasAuto: boolean;
};

// ── Constantes ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  service: "Serviço",
  labor: "Mão de obra",
  material: "Material",
};

const TYPE_BADGE: Record<string, string> = {
  service: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  material: "bg-muted text-muted-foreground",
  labor: "bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400",
};

// Detecta se o item foi alterado em relação ao registo "auto" original
function itemIsEdited(item: EditableItem): boolean {
  return (
    item._wasAuto &&
    (item.description !== item._origDescription ||
      item.quantity !== item._origQuantity ||
      item.unitPrice !== item._origUnitPrice)
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function ExpenseNoteDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const noteId = parseInt(id!);
  const { data: note, isLoading } = useExpenseNote(noteId);
  const updateNoteItems = useUpdateExpenseNoteItems();
  const updateNote = useUpdateExpenseNote();
  const deleteNote = useDeleteExpenseNote();
  const createEdit = useCreateExpenseNoteEdit();

  // ── Estado dos dialogs ────────────────────────────────────────────────────
  const [emitOpen, setEmitOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editItemsOpen, setEditItemsOpen] = useState(false);
  const [editingItems, setEditingItems] = useState<EditableItem[]>([]);
  const [deleteIssuedOpen, setDeleteIssuedOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // ── Abrir dialog de edição de items ───────────────────────────────────────
  const openEditItems = () => {
    if (!note) return;
    setEditingItems(
      note.items.map((item) => ({
        id: item.id,
        description: item.description,
        type: item.type as EditableItem["type"],
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        sourceType: item.sourceType,
        editReason: item.editReason ?? "",
        _origDescription: item.description,
        _origQuantity: item.quantity,
        _origUnitPrice: item.unitPrice,
        _wasAuto: item.sourceType === "auto",
      }))
    );
    setEditItemsOpen(true);
  };

  // ── Guardar items editados ────────────────────────────────────────────────
  const handleSaveItems = async () => {
    const invalid = editingItems.filter(
      (i) => itemIsEdited(i) && !i.editReason.trim()
    );
    if (invalid.length > 0) {
      toast({
        title: "Motivo obrigatório",
        description: `Preenche o motivo para: ${invalid.map((i) => i.description).join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    await updateNoteItems.mutateAsync({
      id: noteId,
      items: editingItems.map((i) => ({
        description: i.description,
        type: i.type,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: i.quantity * i.unitPrice,
        sourceType: itemIsEdited(i) ? "edited" : i.sourceType,
        editReason: itemIsEdited(i) ? i.editReason : i.editReason || null,
        expenseNoteId: noteId,
      })),
    } as any);
    const editedCount = editingItems.filter(i => itemIsEdited(i)).length;
    if (editedCount > 0) {
      await createEdit.mutateAsync({
        id: noteId,
        fieldChanged: "items",
        reason: editingItems
          .filter(i => itemIsEdited(i))
          .map(i => `${i.description}: ${i.editReason}`)
          .join(" | "),
      });
    }
    setEditItemsOpen(false);
  };

  // ── Emitir nota ───────────────────────────────────────────────────────────
  const handleEmit = async () => {
    await updateNote.mutateAsync({
      id: noteId,
      status: "emitida",
      issueDate: new Date() as any,
    });
    setEmitOpen(false);
  };

  // ── Apagar nota ───────────────────────────────────────────────────────────
  const handleDelete = async () => {
    await deleteNote.mutateAsync(noteId);
    navigate("/expense-notes");
  };

  // ── Loading / Not found ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-2">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Nota não encontrada</p>
        </div>
      </div>
    );
  }

  const isDraft = note.status === "draft";
  const total = note.items.reduce((s, i) => s + i.total, 0);
  const lang = (note.client as any).preferredLanguage;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title={note.noteNumber}
        subtitle="Detalhes da nota de despesa"
        backHref="/more"
        sticky={false}
        rightSlot={
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
              isDraft
                ? "bg-muted text-muted-foreground"
                : "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
            )}
          >
            {isDraft ? "Rascunho" : "Emitida"}
          </span>
        }
      />

      <div className="px-6 space-y-4">
        {/* ── Info do cliente ───────────────────────────────────── */}
        <div className="bg-card border rounded-xl p-4 shadow-sm space-y-2">
          <div>
            <p className="text-xs text-muted-foreground">Cliente</p>
            <p className="font-semibold text-foreground">{note.client.name}</p>
            {note.client.address && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {note.client.address}
              </p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {note.issueDate
              ? `Emitida em ${format(new Date(note.issueDate), "d 'de' MMMM yyyy", { locale: pt })}`
              : `Criada em ${format(new Date(note.createdAt!), "d 'de' MMMM yyyy", { locale: pt })}`}
          </p>
          {note.serviceLog && (
            <p className="text-xs text-muted-foreground italic">
              Referente a serviço de{" "}
              {(note.serviceLog as any).date
                ? format(new Date((note.serviceLog as any).date), "d 'de' MMMM yyyy", { locale: pt })
                : "—"}
            </p>
          )}
        </div>

        {/* ── Lista de items (read-only) ────────────────────────── */}
        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
          {note.items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Sem itens
            </p>
          ) : (
            note.items.map((item, idx) => (
              <div
                key={item.id}
                className={cn(
                  "p-4",
                  idx !== note.items.length - 1 && "border-b border-border/40"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
                          TYPE_BADGE[item.type] ?? "bg-muted text-muted-foreground"
                        )}
                      >
                        {TYPE_LABELS[item.type] ?? item.type}
                      </span>
                      {item.sourceType === "edited" && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-destructive/10 text-destructive">
                          <AlertCircle className="w-2.5 h-2.5" /> Editado
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {item.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} × {item.unitPrice.toFixed(2)} €{" "}
                      = {item.total.toFixed(2)} €
                    </p>
                    {item.sourceType === "edited" && item.editReason && (
                      <p className="text-xs text-destructive italic mt-0.5">
                        Motivo: {item.editReason}
                      </p>
                    )}
                  </div>
                  <span className="font-bold text-sm text-primary shrink-0">
                    {item.total.toFixed(2)} €
                  </span>
                </div>
              </div>
            ))
          )}
          {/* Total */}
          <div className="p-4 bg-muted/30 border-t border-border/40 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Total</span>
            <span className="text-lg font-bold text-primary">
              {total.toFixed(2)} €
            </span>
          </div>
        </div>

        {/* ── Notas ─────────────────────────────────────────────── */}
        {note.notes && (
          <div className="bg-card border rounded-xl p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Observações</p>
            <p className="text-sm text-foreground">{note.notes}</p>
          </div>
        )}

        {/* ── Histórico de edições ──────────────────────────────── */}
        {note.edits && note.edits.length > 0 && (
          <div className="bg-card border rounded-xl p-4 shadow-sm space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Histórico de alterações
            </p>
            {note.edits.map((edit) => (
              <div key={edit.id} className="border-l-2 border-destructive/30 pl-3 space-y-0.5">
                <p className="text-xs text-muted-foreground">
                  {format(new Date(edit.editedAt!), "d 'de' MMMM yyyy 'às' HH:mm", { locale: pt })}
                </p>
                <p className="text-xs text-foreground">{edit.reason}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Acções — Rascunho ─────────────────────────────────── */}
        {isDraft && (
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={openEditItems}
            >
              <Edit2 className="w-4 h-4" /> Editar Items
            </Button>
            <Button
              className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-600"
              onClick={() => setEmitOpen(true)}
            >
              <Send className="w-4 h-4" /> Emitir Nota
            </Button>
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="w-4 h-4" /> Apagar Nota
            </Button>
          </div>
        )}

        {/* ── Acções — Emitida ──────────────────────────────────── */}
        {!isDraft && (
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={openEditItems}
            >
              <Edit2 className="w-4 h-4" /> Editar Nota
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={async () => {
                try {
                  const doc = await generateExpenseNotePdf(note, lang);
                  doc.save(`Nota-${note.noteNumber}.pdf`);
                } catch {
                  toast({
                    title: "Em desenvolvimento",
                    description: "Funcionalidade disponível em breve",
                  });
                }
              }}
            >
              <Download className="w-4 h-4" /> Descarregar PDF
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={async () => {
                try {
                  await shareExpenseNotePdf(note, lang);
                } catch {
                  toast({
                    title: "Em desenvolvimento",
                    description: "Funcionalidade disponível em breve",
                  });
                }
              }}
            >
              <Share2 className="w-4 h-4" /> Partilhar PDF
            </Button>
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={() => {
                setDeleteConfirmText("");
                setDeleteIssuedOpen(true);
              }}
            >
              <Trash2 className="w-4 h-4" /> Apagar Nota
            </Button>
          </div>
        )}
      </div>

      {/* ── Dialog: Editar Items ─────────────────────────────────── */}
      <ItemsEditDialog
        open={editItemsOpen}
        onOpenChange={setEditItemsOpen}
        items={editingItems}
        onItemsChange={setEditingItems}
        onSave={handleSaveItems}
        isSaving={updateNoteItems.isPending}
      />

      {/* ── Dialog: Confirmar Emissão ─────────────────────────────── */}
      <Dialog open={emitOpen} onOpenChange={setEmitOpen}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Emitir nota de despesa?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Após emitida, a nota fica bloqueada para edição. Esta acção não
            pode ser revertida.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setEmitOpen(false)}
              disabled={updateNote.isPending}
            >
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleEmit}
              disabled={updateNote.isPending}
            >
              {updateNote.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Emitir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Confirmar Apagar Nota Emitida ───────────────── */}
      <Dialog open={deleteIssuedOpen} onOpenChange={setDeleteIssuedOpen}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Apagar nota emitida?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm font-medium text-destructive">
                Atenção — acção irreversível
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                A nota {note.noteNumber} e todo o seu histórico
                serão eliminados permanentemente.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Escreve <span className="font-mono font-bold">CONFIRMAR</span> para continuar
              </label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="CONFIRMAR"
                className="rounded-xl font-mono"
                autoCapitalize="characters"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteIssuedOpen(false)}
              disabled={deleteNote.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmText !== "CONFIRMAR" || deleteNote.isPending}
              onClick={async () => {
                await deleteNote.mutateAsync(noteId);
                navigate("/expense-notes");
              }}
            >
              {deleteNote.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Apagar definitivamente"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Confirmar Apagar ─────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Apagar nota de despesa?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta acção é irreversível. A nota e todos os seus itens serão
            eliminados.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteNote.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteNote.isPending}
            >
              {deleteNote.isPending ? (
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

// ── ItemsEditDialog ───────────────────────────────────────────────────────────
// Dialog que mostra todos os items em modo edição inline (sem diálogos aninhados).
// Items com sourceType "auto" que forem alterados ficam marcados como "editado"
// e exigem preenchimento do campo "Motivo da alteração".

function ItemsEditDialog({
  open,
  onOpenChange,
  items,
  onItemsChange,
  onSave,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: EditableItem[];
  onItemsChange: (items: EditableItem[]) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  const updateItem = (
    idx: number,
    field: keyof EditableItem,
    value: string | number
  ) => {
    onItemsChange(
      items.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const canSave =
    items.length > 0 &&
    !items.some((i) => itemIsEdited(i) && !i.editReason.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Items</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {items.map((item, idx) => {
            const edited = itemIsEdited(item);
            const subtotal = item.quantity * item.unitPrice;

            return (
              <div
                key={idx}
                className={cn(
                  "rounded-xl border p-4 space-y-3",
                  edited
                    ? "border-destructive/30 bg-destructive/5"
                    : "border-border bg-muted/20"
                )}
              >
                {/* Aviso de item editado */}
                {edited && (
                  <div className="flex items-center gap-1.5 text-destructive text-xs font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Alterado em relação ao registo original — preenche o motivo
                  </div>
                )}

                {/* Descrição */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Descrição
                  </label>
                  <Input
                    value={item.description}
                    onChange={(e) =>
                      updateItem(idx, "description", e.target.value)
                    }
                    className="rounded-xl text-sm"
                  />
                </div>

                {/* Tipo + Quantidade + Preço */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Tipo
                    </label>
                    <Select
                      value={item.type}
                      onValueChange={(v) => updateItem(idx, "type", v)}
                    >
                      <SelectTrigger className="rounded-xl text-xs h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="service">Serviço</SelectItem>
                        <SelectItem value="material">Material</SelectItem>
                        <SelectItem value="labor">Mão de obra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Qtd.
                    </label>
                    <Input
                      type="number"
                      min={0.01}
                      step={0.5}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          idx,
                          "quantity",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="rounded-xl text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      €/un
                    </label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(
                          idx,
                          "unitPrice",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Subtotal calculado */}
                <p className="text-xs text-right font-semibold text-primary">
                  Subtotal: {subtotal.toFixed(2)} €
                </p>

                {/* Motivo da alteração (obrigatório se editado) */}
                {edited && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Motivo da alteração{" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <Textarea
                      placeholder="Justifica a diferença em relação ao registo original..."
                      value={item.editReason}
                      onChange={(e) =>
                        updateItem(idx, "editReason", e.target.value)
                      }
                      rows={2}
                      className="resize-none text-xs rounded-xl"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={!canSave || isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
