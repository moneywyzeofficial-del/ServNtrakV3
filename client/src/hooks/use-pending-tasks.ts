import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function usePendingTasks(filters?: { clientId?: string; includeCompleted?: string }) {
  return useQuery({
    queryKey: [api.pendingTasks.list.path, filters],
    queryFn: async () => {
      const url = new URL(api.pendingTasks.list.path, window.location.origin);
      if (filters?.clientId) url.searchParams.set("clientId", filters.clientId);
      if (filters?.includeCompleted) url.searchParams.set("includeCompleted", filters.includeCompleted);
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao carregar tarefas pendentes");
      return api.pendingTasks.list.responses[200].parse(await res.json());
    },
  });
}

export function usePendingTasksCount() {
  return useQuery({
    queryKey: [api.pendingTasks.count.path],
    queryFn: async () => {
      const res = await fetch(api.pendingTasks.count.path, { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao carregar contagem");
      return api.pendingTasks.count.responses[200].parse(await res.json());
    },
  });
}

export function useCompletePendingTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (taskId: number) => {
      const url = buildUrl(api.pendingTasks.complete.path, { id: taskId });
      const res = await fetch(url, {
        method: api.pendingTasks.complete.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao concluir tarefa");
      return api.pendingTasks.complete.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.pendingTasks.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.pendingTasks.count.path] });
      toast({ title: "Concluída", description: "Tarefa marcada como concluída" });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeletePendingTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (taskId: number) => {
      const url = buildUrl(api.pendingTasks.delete.path, { id: taskId });
      const res = await fetch(url, {
        method: api.pendingTasks.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao eliminar tarefa");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.pendingTasks.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.pendingTasks.count.path] });
      toast({ title: "Eliminada", description: "Tarefa removida" });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });
}
