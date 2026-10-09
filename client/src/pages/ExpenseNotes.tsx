import { useState } from "react";
import { useExpenseNotes, useDeleteExpenseNote } from "@/hooks/use-expense-notes";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Loader2, Plus, FileText, Trash2, Eye, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExpenseNoteWithDetails } from "@shared/schema";

type FilterValue = "all" | "draft" | "issued";

const filterLabels: Record<FilterValue, string> = {
  all: "Todas",
  draft: "Rascunho",
  issued: "Emitida",
};

export default function ExpenseNotes() {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Preserve clientId from URL query params (e.g. /expense-notes?clientId=5)
  const params = new URLSearchParams(window.location.search);
  const clientIdParam = params.get("clientId");
  const clientId = clientIdParam ? parseInt(clientIdParam) : undefined;

  const { data: notes, isLoading } = useExpenseNotes(clientId);
  const deleteExpenseNote = useDeleteExpenseNote();

  const filteredNotes = (notes ?? [])
    .filter((note) => {
      if (filter === "draft") return note.status === "draft";
      if (filter === "issued") return note.status === "emitida";
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );

  const newHref = clientId
    ? `/expense-notes/new?clientId=${clientId}`
    : "/expense-notes/new";

  const handleConfirmDelete = async () => {
    if (deleteId === null) return;
    await deleteExpenseNote.mutateAsync(deleteId);
    setDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Notas de Despesa"
        subtitle="Documentos emitidos"
        backHref="/more"
        actionHref={newHref}
        actionLabel="Nova"
      />

      {/* ── Filtros ───────────────────────────────────────────── */}
      <div className="px-6 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(["all", "draft", "issued"] as FilterValue[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Conteúdo ──────────────────────────────────────────── */}
      <div className="px-6 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center border border-border/50">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium">Sem notas de despesa</p>
            <p className="text-sm text-muted-foreground mt-1">
              Cria a primeira nota para este cliente
            </p>
            <Button
              size="sm"
              className="mt-4 gap-1"
              onClick={() => navigate(newHref)}
            >
              <Plus className="w-4 h-4" /> Nova Nota
            </Button>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onView={() => navigate(`/expense-notes/${note.id}`)}
              onDelete={() => setDeleteId(note.id)}
            />
          ))
        )}
      </div>

      {/* ── Dialog de confirmação de apagar ───────────────────── */}
      <Dialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Apagar nota de despesa?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta acção é irreversível. A nota será permanentemente eliminada.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={deleteExpenseNote.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteExpenseNote.isPending}
            >
              {deleteExpenseNote.isPending ? (
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

// ── NoteCard ─────────────────────────────────────────────────────────────────

function NoteCard({
  note,
  onView,
  onDelete,
}: {
  note: ExpenseNoteWithDetails;
  onView: () => void;
  onDelete: () => void;
}) {
  const isIssued = note.status === "emitida";
  const total = note.items.reduce((s, i) => s + i.total, 0);
  const dateLabel = note.issueDate
    ? format(new Date(note.issueDate), "d 'de' MMMM yyyy", { locale: pt })
    : format(new Date(note.createdAt!), "d 'de' MMMM yyyy", { locale: pt });

  return (
    <div
      className={cn(
        "bg-card border rounded-xl p-4 shadow-sm",
        isIssued
          ? "border-green-200 dark:border-green-900/30"
          : "border-border"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Ícone */}
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            isIssued
              ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : "bg-muted text-muted-foreground"
          )}
        >
          <FileText className="w-5 h-5" />
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {note.noteNumber}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {note.client.name}
              </p>
            </div>
            <Badge
              variant={isIssued ? "default" : "secondary"}
              className={cn(
                "shrink-0 text-[10px]",
                isIssued && "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
              )}
            >
              {isIssued ? "Emitida" : "Rascunho"}
            </Badge>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div>
              <p className="text-xs text-muted-foreground">{dateLabel}</p>
              <p className="text-sm font-bold text-primary mt-0.5">
                {note.items.length > 0 ? `${total.toFixed(2)} €` : "—"}
              </p>
            </div>

            <div className="flex gap-2">
              {!isIssued && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={onDelete}
                  data-testid={`delete-note-${note.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1"
                onClick={onView}
                data-testid={`view-note-${note.id}`}
              >
                <Eye className="w-3 h-3" /> Ver
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
