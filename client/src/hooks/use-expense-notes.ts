import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type {
  ExpenseNote,
  ExpenseNoteItem,
  ExpenseNoteWithDetails,
  InsertExpenseNote,
  InsertExpenseNoteItem,
} from "@shared/schema";

const BASE_PATH = "/api/expense-notes";

// ── Queries ────────────────────────────────────────────────────────────────────

export function useExpenseNotes(clientId?: number) {
  return useQuery({
    queryKey: clientId ? ["expense-notes", clientId] : ["expense-notes"],
    queryFn: async () => {
      const url = new URL(BASE_PATH, window.location.origin);
      if (clientId) url.searchParams.set("clientId", String(clientId));

      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch expense notes");
      return res.json() as Promise<ExpenseNoteWithDetails[]>;
    },
  });
}

export function useExpenseNote(id: number) {
  return useQuery({
    queryKey: ["expense-notes", id],
    queryFn: async () => {
      const res = await fetch(`${BASE_PATH}/${id}`, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch expense note");
      return res.json() as Promise<ExpenseNoteWithDetails>;
    },
    enabled: !!id,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export function useCreateExpenseNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertExpenseNote & { items?: InsertExpenseNoteItem[] }) => {
      const res = await fetch(BASE_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create expense note");
      }
      return res.json() as Promise<ExpenseNote>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-notes"] });
      toast({ title: "Nota de despesa criada" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateExpenseNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertExpenseNote>) => {
      const res = await fetch(`${BASE_PATH}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update expense note");
      }
      return res.json() as Promise<ExpenseNote>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-notes"] });
      toast({ title: "Nota de despesa actualizada" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateExpenseNoteItems() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, items }: { id: number; items: InsertExpenseNoteItem[] }) => {
      const res = await fetch(`${BASE_PATH}/${id}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update expense note items");
      }
      return res.json() as Promise<ExpenseNoteItem[]>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-notes"] });
      toast({ title: "Itens actualizados" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteExpenseNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${BASE_PATH}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to delete expense note");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-notes"] });
      toast({ title: "Nota de despesa eliminada" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}

export function useCreateExpenseNoteEdit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      fieldChanged,
      reason,
    }: {
      id: number;
      fieldChanged: string;
      reason: string;
    }) => {
      const res = await fetch(`/api/expense-notes/${id}/edits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldChanged, reason }),
      });
      if (!res.ok) throw new Error("Erro ao guardar histórico");
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["expense-notes", id] });
    },
  });
}
