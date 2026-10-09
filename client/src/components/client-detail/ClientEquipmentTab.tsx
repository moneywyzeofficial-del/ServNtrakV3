import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Wrench, Waves, Sprout, Droplets, MoreHorizontal, Plus, Pencil, Trash2, Loader2, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import type { ClientEquipment, InsertClientEquipment } from "@shared/schema";

const CATEGORIES = [
  { key: "pool", label: "Piscina", Icon: Waves },
  { key: "garden", label: "Jardim", Icon: Sprout },
  { key: "irrigation", label: "Rega", Icon: Droplets },
  { key: "other", label: "Outro", Icon: MoreHorizontal },
] as const;

const categoryLabel = (cat: string) => CATEGORIES.find((c) => c.key === cat)?.label || cat;
const categoryIcon = (cat: string) => CATEGORIES.find((c) => c.key === cat)?.Icon || Wrench;
const categoryColor = (cat: string) =>
  cat === "pool" ? "bg-blue-100 text-blue-700" :
  cat === "garden" ? "bg-green-100 text-green-700" :
  cat === "irrigation" ? "bg-cyan-100 text-cyan-700" :
  "bg-muted text-muted-foreground";

const equipmentFormSchema = z.object({
  category: z.string(),
  type: z.string().min(1, "Obrigatório"),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  installDate: z.string().optional(),
  lastMaintenanceDate: z.string().optional(),
  notes: z.string().optional(),
});

interface Props {
  clientId: number;
}

export function ClientEquipmentTab({ clientId }: Props) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ClientEquipment | null>(null);
  const [deleteItem, setDeleteItem] = useState<ClientEquipment | null>(null);

  const { data: equipment, isLoading } = useQuery<ClientEquipment[]>({
    queryKey: ["client-equipment", clientId],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${clientId}/equipment`, { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao carregar equipamentos");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof equipmentFormSchema>) => {
      const res = await fetch(`/api/clients/${clientId}/equipment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao criar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-equipment", clientId] });
      setDialogOpen(false);
      toast({ title: "Equipamento adicionado" });
    },
    onError: () => toast({ title: "Erro", description: "Não foi possível criar o equipamento.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & z.infer<typeof equipmentFormSchema>) => {
      const res = await fetch(`/api/client-equipment/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao atualizar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-equipment", clientId] });
      setDialogOpen(false);
      setEditItem(null);
      toast({ title: "Equipamento atualizado" });
    },
    onError: () => toast({ title: "Erro", description: "Não foi possível atualizar.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/client-equipment/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Erro ao eliminar");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-equipment", clientId] });
      setDeleteItem(null);
      toast({ title: "Equipamento removido" });
    },
    onError: () => toast({ title: "Erro", description: "Não foi possível eliminar.", variant: "destructive" }),
  });

  const form = useForm<z.infer<typeof equipmentFormSchema>>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: { category: "pool", type: "", brand: "", model: "", serialNumber: "", installDate: "", lastMaintenanceDate: "", notes: "" },
  });

  const openCreate = () => {
    form.reset({ category: "pool", type: "", brand: "", model: "", serialNumber: "", installDate: "", lastMaintenanceDate: "", notes: "" });
    setEditItem(null);
    setDialogOpen(true);
  };

  const openEdit = (item: ClientEquipment) => {
    form.reset({
      category: item.category,
      type: item.type,
      brand: item.brand || "",
      model: item.model || "",
      serialNumber: item.serialNumber || "",
      installDate: item.installDate ? format(new Date(item.installDate), "yyyy-MM-dd") : "",
      lastMaintenanceDate: item.lastMaintenanceDate ? format(new Date(item.lastMaintenanceDate), "yyyy-MM-dd") : "",
      notes: item.notes || "",
    });
    setEditItem(item);
    setDialogOpen(true);
  };

  const onSubmit = (data: z.infer<typeof equipmentFormSchema>) => {
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!equipment || equipment.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Wrench className="w-12 h-12 text-muted-foreground/25 mb-3" />
        <p className="text-sm text-muted-foreground mb-3">Ainda não existem equipamentos registados</p>
        <Button size="sm" className="h-8 px-4 text-xs rounded-xl gap-1.5" onClick={openCreate} data-testid="button-add-first-equipment">
          <Plus className="w-3.5 h-3.5" /> Adicionar equipamento
        </Button>
      </div>
    );
  }

  const grouped = equipment.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ClientEquipment[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Equipamentos</h3>
        <Button size="sm" className="h-8 px-3 text-xs rounded-xl gap-1.5" onClick={openCreate} data-testid="button-add-equipment">
          <Plus className="w-3.5 h-3.5" /> Adicionar
        </Button>
      </div>

      {Object.entries(grouped).map(([cat, items]) => {
        const Icon = categoryIcon(cat);
        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{categoryLabel(cat)}</span>
              <span className="text-[10px] text-muted-foreground">({items.length})</span>
            </div>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-bold text-foreground">{item.type}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0 font-normal", categoryColor(item.category))}>
                          {categoryLabel(item.category)}
                        </Badge>
                        {item.brand && (
                          <span className="text-[11px] text-muted-foreground">{item.brand}{item.model ? ` — ${item.model}` : ""}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(item)} data-testid={`button-edit-equipment-${item.id}`}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteItem(item)} data-testid={`button-delete-equipment-${item.id}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {item.lastMaintenanceDate && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                      <CalendarDays className="w-3 h-3" /> Última manutenção: {format(new Date(item.lastMaintenanceDate), "d 'de' MMM yyyy", { locale: pt })}
                    </p>
                  )}
                  {item.serialNumber && (
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">N/S: {item.serialNumber}</p>
                  )}
                  {item.notes && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{item.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditItem(null); }}>
        <DialogContent className="rounded-2xl sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? "Editar Equipamento" : "Novo Equipamento"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Bomba, Filtro, Clorador..." className="rounded-xl" {...field} data-testid="input-equipment-type" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca</FormLabel>
                      <FormControl>
                        <Input placeholder="Marca" className="rounded-xl" {...field} value={field.value || ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo</FormLabel>
                      <FormControl>
                        <Input placeholder="Modelo" className="rounded-xl" {...field} value={field.value || ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Série</FormLabel>
                    <FormControl>
                      <Input placeholder="N/S" className="rounded-xl" {...field} value={field.value || ""} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="installDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instalação</FormLabel>
                      <FormControl>
                        <Input type="date" className="rounded-xl" {...field} value={field.value || ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastMaintenanceDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Última Manutenção</FormLabel>
                      <FormControl>
                        <Input type="date" className="rounded-xl" {...field} value={field.value || ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Detalhes relevantes..." className="rounded-xl min-h-[60px]" {...field} value={field.value || ""} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-1">
                <Button type="submit" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-equipment">
                  {createMutation.isPending || updateMutation.isPending ? "A guardar..." : editItem ? "Guardar" : "Adicionar"}
                </Button>
                <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => { if (!open) setDeleteItem(null); }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar equipamento?</AlertDialogTitle>
            <AlertDialogDescription>
              O equipamento "{deleteItem?.type}" será removido. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteItem && deleteMutation.mutate(deleteItem.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "A eliminar..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
