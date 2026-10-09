import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useServiceVisits(clientId?: number) {
  return useQuery({
    queryKey: [api.serviceVisits.list.path, clientId],
    queryFn: async () => {
      const url = new URL(api.serviceVisits.list.path, window.location.origin);
      if (clientId) url.searchParams.set("clientId", String(clientId));
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch service visits");
      return res.json();
    },
  });
}

export function useClientServiceStats(clientId: number) {
  return useQuery({
    queryKey: [api.serviceVisits.stats.path, clientId],
    queryFn: async () => {
      const url = buildUrl(api.serviceVisits.stats.path, { id: clientId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch service stats");
      return res.json();
    },
    enabled: !!clientId,
  });
}

interface CreateServiceVisitData {
  visit: {
    clientId: number;
    visitDate: Date;
    actualDurationMinutes: number;
    workerCount: number;
    notes?: string;
  };
  services: {
    serviceType: string;
    wasPlanned?: boolean;
    notes?: string;
  }[];
}

export function useCreateServiceVisit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateServiceVisitData) => {
      const res = await fetch(api.serviceVisits.create.path, {
        method: api.serviceVisits.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message);
        }
        throw new Error("Failed to record visit");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.serviceVisits.list.path], exact: false });
      queryClient.invalidateQueries({ queryKey: [api.serviceVisits.stats.path], exact: false });
      queryClient.invalidateQueries({ queryKey: [api.appointments.list.path], exact: false });
      toast({ title: "Visita registada", description: "Os dados da visita foram guardados" });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });
}
