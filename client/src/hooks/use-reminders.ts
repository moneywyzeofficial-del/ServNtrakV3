import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { InsertReminder, Reminder, Client } from "@shared/schema";

type ReminderWithClient = Reminder & { client: Client };

export function useReminders(clientId?: string) {
  return useQuery({
    queryKey: [api.reminders.list.path, clientId],
    queryFn: async () => {
      const url = new URL(api.reminders.list.path, window.location.origin);
      if (clientId) url.searchParams.set("clientId", clientId);
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reminders");
      return res.json() as Promise<ReminderWithClient[]>;
    },
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertReminder) => {
      const res = await fetch(api.reminders.create.path, {
        method: api.reminders.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create reminder");
      }
      return res.json() as Promise<Reminder>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reminders.list.path] });
      toast({ title: "Lembrete criado com sucesso" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertReminder> }) => {
      const res = await fetch(api.reminders.update.path.replace(":id", String(id)), {
        method: api.reminders.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update reminder");
      }
      return res.json() as Promise<Reminder>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reminders.list.path] });
      toast({ title: "Lembrete atualizado" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(api.reminders.delete.path.replace(":id", String(id)), {
        method: api.reminders.delete.method,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to delete reminder");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reminders.list.path] });
      toast({ title: "Lembrete eliminado" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}
