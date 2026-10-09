import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { FileText, Plus, ExternalLink, Download, Pencil, Trash2, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { useState, useRef } from "react";
import type { ClientDocument } from "@shared/schema";

const DOC_TYPES: { k: string; l: string }[] = [
  { k: "proposal", l: "Proposta" },
  { k: "contract", l: "Contrato" },
  { k: "invoice", l: "Fatura" },
  { k: "report", l: "Relatório" },
  { k: "technical", l: "Ficha Técnica" },
  { k: "other", l: "Outro" },
];

const docTypeLabel = (t: string) => DOC_TYPES.find((d) => d.k === t)?.l || t;

const uploadSchema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  documentType: z.string().default("other"),
  notes: z.string().optional(),
});

interface Props {
  clientId: number;
}

export function ClientDocumentsCard({ clientId }: Props) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { uploadFile, isUploading: isFileUploading } = useUpload();
  const fileRef = useRef<HTMLInputElement>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof uploadSchema>) => {
      const res = await fetch(`/api/clients/${clientId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-documents", clientId] });
      setAddOpen(false);
      setSelectedFile(null);
      toast({ title: "Documento adicionado" });
    },
    onError: () => toast({ title: "Erro", description: "Não foi possível guardar o documento.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/client-documents/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Erro");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-documents", clientId] });
      setDeleteTarget(null);
      toast({ title: "Documento removido" });
    },
    onError: () => toast({ title: "Erro", description: "Não foi possível eliminar.", variant: "destructive" }),
  });

  const form = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { title: "", documentType: "other", notes: "" },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type === "application/pdf") {
      setSelectedFile(f);
      form.setValue("title", f.name.replace(/\.pdf$/i, ""));
    } else {
      toast({ title: "Apenas PDF", description: "Selecione um ficheiro PDF.", variant: "destructive" });
    }
    e.target.value = "";
  };

  const handleSubmit = async (data: z.infer<typeof uploadSchema>) => {
    if (!selectedFile) return;
    try {
      const sanitized = selectedFile.name
        .replace(/\.pdf$/i, "")
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80);
      const now = new Date();
      const datePrefix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
      const objectKey = `clients/${clientId}/documents/${datePrefix}-${sanitized}.pdf`;

      console.log("[pdf] requesting upload url", { name: selectedFile.name, size: selectedFile.size, type: selectedFile.type, objectKey });

      const result = await uploadFile(selectedFile, objectKey);
      if (!result) throw new Error("Upload falhou — objectPath nao devolvido");

      console.log("[pdf] file uploaded to storage", { objectPath: result.objectPath });

      console.log("[pdf] creating document record");
      await createMutation.mutateAsync({
        title: data.title,
        documentType: data.documentType,
        notes: data.notes || null,
        fileName: selectedFile.name,
        fileUrl: result.objectPath,
        fileKey: objectKey,
        fileSize: selectedFile.size,
        mimeType: "application/pdf",
      } as any);

      console.log("[pdf] document record created");
    } catch (err) {
      console.error("[pdf upload error]", err);
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    }
  };

  const recentDocs = documents?.slice(0, 5) || [];
  const hasMore = (documents?.length || 0) > 5;

  return (
    <div className="bg-card rounded-xl border border-border/40 shadow-sm shadow-black/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Documentos</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setAddOpen(true)} data-testid="button-add-document">
            <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
          </Button>
          {hasMore && (
            <Link href={`/clients/${clientId}/documents`}>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground" data-testid="button-view-all-documents">
                Ver todos
              </Button>
            </Link>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
      ) : recentDocs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-3">Sem documentos anexados.</p>
      ) : (
        <div className="space-y-2">
          {recentDocs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{doc.title}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 font-normal">{docTypeLabel(doc.documentType)}</Badge>
                  {doc.createdAt ? format(new Date(doc.createdAt), "dd/MM/yy") : ""}
                  {doc.fileSize && <span>{(doc.fileSize / 1024).toFixed(0)} KB</span>}
                </p>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <a href={doc.fileUrl} download={doc.fileName} className="h-6 w-6 p-0 inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors" aria-label="Descarregar documento">
                  <Download className="w-3 h-3" />
                </a>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => window.open(doc.fileUrl, "_blank", "noopener,noreferrer")} aria-label="Abrir documento">
                  <ExternalLink className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => setDeleteTarget(doc)} aria-label="Eliminar documento">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add document dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) { setSelectedFile(null); form.reset(); } }}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader><DialogTitle>Adicionar Documento</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div
                className="border-2 border-dashed border-border/60 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileSelect} />
                {selectedFile ? (
                  <div className="space-y-1">
                    <FileText className="w-8 h-8 text-red-500 mx-auto" />
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                    <p className="text-sm text-muted-foreground">Clique para selecionar um PDF</p>
                    <p className="text-[10px] text-muted-foreground/60">Máx 10 MB</p>
                  </div>
                )}
              </div>

              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Título *</FormLabel><FormControl><Input placeholder="Nome do documento" className="rounded-xl" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="documentType" render={({ field }) => (
                <FormItem><FormLabel>Tipo</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{DOC_TYPES.map((d) => <SelectItem key={d.k} value={d.k}>{d.l}</SelectItem>)}</SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notas</FormLabel><FormControl><Textarea placeholder="Detalhes..." className="rounded-xl min-h-[60px]" {...field} value={field.value || ""} /></FormControl></FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={!selectedFile || isFileUploading || createMutation.isPending} data-testid="button-submit-document">
                {(isFileUploading || createMutation.isPending) ? "A enviar..." : "Adicionar Documento"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
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
