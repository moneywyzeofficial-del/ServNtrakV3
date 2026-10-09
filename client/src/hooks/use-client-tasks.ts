import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useClientPendingTasks(clientId: number) {
  return useQuery({
    queryKey: [api.pendingTasks.list.path, { clientId: clientId.toString() }],
    queryFn: async () => {
      const url = new URL(api.pendingTasks.list.path, window.location.origin);
      url.searchParams.set("clientId", clientId.toString());
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao carregar tarefas pendentes");
      return api.pendingTasks.list.responses[200].parse(await res.json());
    },
  });
}

export function useClientSuggestedWorks(clientId: number) {
  return useQuery({
    queryKey: [api.suggestedWorks.list.path, { clientId: clientId.toString() }],
    queryFn: async () => {
      const url = new URL(api.suggestedWorks.list.path, window.location.origin);
      url.searchParams.set("clientId", clientId.toString());
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao carregar trabalhos sugeridos");
      return api.suggestedWorks.list.responses[200].parse(await res.json());
    },
  });
}

export function useCompleteClientPendingTask() {
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

export function useDeleteClientPendingTask() {
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

export function useUpdateSuggestedWork() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ workId, isAccepted, isRejected, isCompleted }: { workId: number; isAccepted?: boolean; isRejected?: boolean; isCompleted?: boolean }) => {
      const body: Record<string, unknown> = {};
      if (isAccepted !== undefined) {
        body.isAccepted = isAccepted;
        body.acceptedAt = isAccepted ? new Date().toISOString() : null;
      }
      if (isRejected !== undefined) {
        body.isRejected = isRejected;
        body.rejectedAt = isRejected ? new Date().toISOString() : null;
      }
      if (isCompleted !== undefined) {
        body.isCompleted = isCompleted;
        body.completedAt = isCompleted ? new Date().toISOString() : null;
      }
      const url = buildUrl(api.suggestedWorks.update.path, { id: workId });
      const res = await fetch(url, {
        method: api.suggestedWorks.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao atualizar trabalho sugerido");
      return api.suggestedWorks.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.suggestedWorks.list.path] });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteSuggestedWork() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (workId: number) => {
      const url = buildUrl(api.suggestedWorks.delete.path, { id: workId });
      const res = await fetch(url, {
        method: api.suggestedWorks.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao eliminar sugestão");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.suggestedWorks.list.path] });
      toast({ title: "Eliminada", description: "Sugestão removida" });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });
}
