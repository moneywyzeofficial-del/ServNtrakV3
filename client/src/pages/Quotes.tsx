import { useState } from "react";
import { useQuotes, useDeleteQuote } from "@/hooks/use-quotes";
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
import { Loader2, Plus, FileText, Trash2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuoteWithDetails } from "@shared/schema";

type FilterValue = "all" | "draft" | "enviado" | "aceite" | "recusado";

const filterLabels: Record<FilterValue, string> = {
  all: "Todos",
  draft: "Rascunho",
  enviado: "Enviado",
  aceite: "Aceite",
  recusado: "Recusado",
};

const statusBadge: Record<string, { label: string; className: string }> = {
  draft:    { label: "Rascunho",  className: "bg-muted text-muted-foreground" },
  enviado:  { label: "Enviado",   className: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" },
  aceite:   { label: "Aceite",    className: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" },
  recusado: { label: "Recusado",  className: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400" },
};

export default function Quotes() {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const params = new URLSearchParams(window.location.search);
  const clientIdParam = params.get("clientId");
  const clientId = clientIdParam ? parseInt(clientIdParam) : undefined;

  const { data: quotes, isLoading } = useQuotes(clientId);
  const deleteQuote = useDeleteQuote();

  const filtered = (quotes ?? [])
    .filter((q) => filter === "all" || q.status === filter)
    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

  const newHref = clientId
    ? `/quotes/new?clientId=${clientId}`
    : "/quotes/new";

  const handleConfirmDelete = async () => {
    if (deleteId === null) return;
    await deleteQuote.mutateAsync(deleteId);
    setDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Orçamentos"
        subtitle="Propostas e estimativas"
        backHref="/more"
        actionHref={newHref}
        actionLabel="Novo"
      />

      {/* ── Filtros ───────────────────────────────────────────── */}
      <div className="px-6 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(["all", "draft", "enviado", "aceite", "recusado"] as FilterValue[]).map((f) => (
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
        ) : filtered.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center border border-border/50">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium">Sem orçamentos</p>
            <p className="text-sm text-muted-foreground mt-1">
              Cria o primeiro orçamento para este cliente
            </p>
            <Button size="sm" className="mt-4 gap-1" onClick={() => navigate(newHref)}>
              <Plus className="w-4 h-4" /> Novo Orçamento
            </Button>
          </div>
        ) : (
          filtered.map((q) => (
            <QuoteCard
              key={q.id}
              quote={q}
              onView={() => navigate(`/quotes/${q.id}`)}
              onDelete={() => setDeleteId(q.id)}
            />
          ))
        )}
      </div>

      {/* ── Dialog de confirmação ─────────────────────────────── */}
      <Dialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Apagar orçamento?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta acção é irreversível. O orçamento será permanentemente eliminado.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={deleteQuote.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteQuote.isPending}
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

// ── QuoteCard ─────────────────────────────────────────────────────────────────

function QuoteCard({
  quote,
  onView,
  onDelete,
}: {
  quote: QuoteWithDetails;
  onView: () => void;
  onDelete: () => void;
}) {
  const badge = statusBadge[quote.status] ?? statusBadge.draft;
  const total = quote.items.reduce((s, i) => s + i.total, 0);
  const dateLabel = format(new Date(quote.createdAt!), "d 'de' MMMM yyyy", { locale: pt });

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-muted text-muted-foreground">
          <FileText className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">{quote.quoteNumber}</h3>
              <p className="text-sm text-muted-foreground truncate">{quote.client.name}</p>
            </div>
            <Badge
              variant="secondary"
              className={cn("shrink-0 text-[10px]", badge.className)}
            >
              {badge.label}
            </Badge>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div>
              <p className="text-xs text-muted-foreground">{dateLabel}</p>
              <p className="text-sm font-bold text-primary mt-0.5">
                {quote.items.length > 0 ? `${total.toFixed(2)} €` : "—"}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1"
                onClick={onView}
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
