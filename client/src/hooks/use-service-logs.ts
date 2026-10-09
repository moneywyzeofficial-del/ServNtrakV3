import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, createServiceLogWithEntriesInput } from "@shared/routes";
import { type InsertServiceLog, type ServiceLog } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export type CreateServiceLogWithEntriesInput = z.infer<typeof createServiceLogWithEntriesInput>;

export function useServiceLogs(clientId?: string) {
  return useQuery({
    queryKey: [api.serviceLogs.list.path, clientId],
    queryFn: async () => {
      const url = new URL(api.serviceLogs.list.path, window.location.origin);
      if (clientId) url.searchParams.set("clientId", clientId);
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch logs");
      return api.serviceLogs.list.responses[200].parse(await res.json());
    },
    enabled: !!clientId,
  });
}

export function useUnpaidExtraServices() {
  return useQuery({
    queryKey: [api.serviceLogs.unpaid.path],
    queryFn: async () => {
      const res = await fetch(api.serviceLogs.unpaid.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch unpaid services");
      return api.serviceLogs.unpaid.responses[200].parse(await res.json());
    },
  });
}

export function useCreateServiceLog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateServiceLogWithEntriesInput) => {
      const res = await fetch(api.serviceLogs.create.path, {
        method: api.serviceLogs.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.serviceLogs.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to log service");
      }
      return api.serviceLogs.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.serviceLogs.list.path, String(variables.clientId)], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: [api.serviceLogs.unpaid.path], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: [api.appointments.list.path] });
      toast({ title: "Guardado", description: "Registo de serviço guardado" });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });
}

export function useMarkServiceAsPaid() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(api.serviceLogs.markPaid.path.replace(':id', String(id)), {
        method: api.serviceLogs.markPaid.method,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to mark as paid");
      return api.serviceLogs.markPaid.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.serviceLogs.list.path], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: [api.serviceLogs.unpaid.path], refetchType: "all" });
      toast({ title: "Atualizado", description: "Serviço marcado como pago" });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });
}
