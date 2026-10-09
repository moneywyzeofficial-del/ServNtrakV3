import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const QK = "/api/shopping-list";

export function useShoppingList() {
  return useQuery({
    queryKey: [QK],
    queryFn: async () => {
      const res = await fetch(QK, { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao carregar lista de compras");
      return res.json();
    },
  });
}

export function useCreateShoppingListItem() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(QK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Erro ao criar item");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      toast({ title: "Item adicionado com sucesso" });
    },
    onError: (e: Error) => toast({ title: "Erro ao adicionar item", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateShoppingListItem() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Record<string, unknown>) => {
      const res = await fetch(`${QK}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Erro ao actualizar item");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      toast({ title: "Item actualizado com sucesso" });
    },
    onError: (e: Error) => toast({ title: "Erro ao actualizar item", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteShoppingListItem() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${QK}/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Erro ao eliminar item");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      toast({ title: "Item eliminado" });
    },
    onError: (e: Error) => toast({ title: "Erro ao eliminar item", description: e.message, variant: "destructive" }),
  });
}

export function useToggleShoppingListItemStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${QK}/${id}/status`, { method: "PATCH", credentials: "include" });
      if (!res.ok) throw new Error("Erro ao alterar estado");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}
