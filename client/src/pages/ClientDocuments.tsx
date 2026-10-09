import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { FileText, Plus, ExternalLink, Download, Trash2, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/PageHeader";
import { ClientDocumentsCard } from "@/components/client-detail/ClientDocumentsCard";
import type { ClientDocument } from "@shared/schema";

const DOC_TYPES: { k: string; l: string }[] = [
  { k: "all", l: "Todos" },
  { k: "proposal", l: "Proposta" },
  { k: "contract", l: "Contrato" },
  { k: "invoice", l: "Fatura" },
  { k: "report", l: "Relatório" },
  { k: "technical", l: "Ficha Técnica" },
  { k: "other", l: "Outro" },
];

const docTypeLabel = (t: string) => DOC_TYPES.find((d) => d.k === t)?.l || t;

export default function ClientDocuments() {
  const { id } = useParams();
  const clientId = parseInt(id || "0");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<ClientDocument | null>(null);

  const { data: documents, isLoading } = useQuery<ClientDocument[]>({
    queryKey: ["client-documents", clientId],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${clientId}/documents`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: clientId > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: async (docId: number) => {
      const res = await fetch(`/api/client-documents/${docId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Erro");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-documents", clientId] });
      setDeleteTarget(null);
      toast({ title: "Documento removido" });
    },
    onError: () => toast({ title: "Erro", description: "Não foi possível eliminar.", variant: "destructive" }),
  });

  const filtered = (documents || []).filter((d) => {
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "all" && d.documentType !== typeFilter) return false;
    return true;
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Documentos" backHref={`/clients/${clientId}`} />

      <div className="px-5 space-y-4 pb-24">
        {/* Search + Filters */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar documentos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl bg-muted/50 border-none"
            data-testid="input-search-documents"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto">
          {DOC_TYPES.map(({ k, l }) => (
            <button
              key={k}
              type="button"
              onClick={() => setTypeFilter(k)}
              className={`shrink-0 h-8 px-3 rounded-full text-xs font-semibold transition-colors ${
                typeFilter === k ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
              data-testid={`filter-doc-type-${k}`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Upload card */}
        <ClientDocumentsCard clientId={clientId} />

        {/* Document list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/25 mb-3" />
            <p className="text-sm text-muted-foreground">
              {search || typeFilter !== "all" ? "Nenhum documento encontrado." : "Sem documentos anexados."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((doc) => (
              <div key={doc.id} className="bg-card border border-border/40 rounded-xl p-3.5 flex items-center gap-3 shadow-sm group">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap mt-0.5">
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 font-normal">{docTypeLabel(doc.documentType)}</Badge>
                    <span>{doc.fileName}</span>
                    <span>{doc.fileSize ? `${(doc.fileSize / 1024).toFixed(0)} KB` : ""}</span>
                    <span>{doc.createdAt ? format(new Date(doc.createdAt), "d MMM yyyy", { locale: pt }) : ""}</span>
                  </p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <a href={doc.fileUrl} download={doc.fileName} className="h-7 w-7 p-0 inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors" aria-label="Descarregar">
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => window.open(doc.fileUrl, "_blank", "noopener,noreferrer")} aria-label="Abrir">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => setDeleteTarget(doc)} aria-label="Eliminar">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar documento?</AlertDialogTitle>
            <AlertDialogDescription>O documento "{deleteTarget?.title}" será removido.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
