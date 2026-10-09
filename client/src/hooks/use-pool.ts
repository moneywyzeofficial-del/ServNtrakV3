import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PoolEquipment, PoolPhoto, InsertPoolEquipment, InsertPoolPhoto } from "@shared/schema";

export function usePoolEquipment(clientId: number | undefined) {
  return useQuery<PoolEquipment[]>({
    queryKey: ["/api/pool/equipment", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const res = await fetch(`/api/pool/equipment?clientId=${clientId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao carregar equipamentos");
      return res.json();
    },
  });
}

export function useCreatePoolEquipment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { clientId: number } & InsertPoolEquipment) => {
      const res = await apiRequest("POST", "/api/pool/equipment", data);
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/pool/equipment", vars.clientId] });
      toast({ title: "Equipamento adicionado" });
    },
    onError: () => {
      toast({ title: "Erro ao adicionar equipamento", variant: "destructive" });
    },
  });
}

export function useUpdatePoolEquipment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data, clientId }: { id: number; data: Partial<InsertPoolEquipment>; clientId: number }) => {
      const res = await apiRequest("PUT", `/api/pool/equipment/${id}`, data);
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/pool/equipment", vars.clientId] });
      toast({ title: "Equipamento atualizado" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar equipamento", variant: "destructive" });
    },
  });
}

export function useDeletePoolEquipment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, clientId }: { id: number; clientId: number }) => {
      await apiRequest("DELETE", `/api/pool/equipment/${id}`);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/pool/equipment", vars.clientId] });
      toast({ title: "Equipamento eliminado" });
    },
    onError: () => {
      toast({ title: "Erro ao eliminar equipamento", variant: "destructive" });
    },
  });
}

export function usePoolPhotos(clientId: number | undefined, equipmentId?: number) {
  const searchParams = new URLSearchParams();
  if (clientId) searchParams.set("clientId", String(clientId));
  if (equipmentId !== undefined) searchParams.set("equipmentId", String(equipmentId));

  return useQuery<PoolPhoto[]>({
    queryKey: ["/api/pool/photos", clientId, equipmentId],
    enabled: !!clientId,
    queryFn: async () => {
      const res = await fetch(`/api/pool/photos?${searchParams.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao carregar fotos");
      return res.json();
    },
  });
}

export function useCreatePoolPhoto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { clientId: number } & InsertPoolPhoto) => {
      const res = await apiRequest("POST", "/api/pool/photos", data);
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/pool/photos", vars.clientId] });
      toast({ title: "Foto adicionada" });
    },
    onError: () => {
      toast({ title: "Erro ao adicionar foto", variant: "destructive" });
    },
  });
}

export function useDeletePoolPhoto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, clientId }: { id: number; clientId: number }) => {
      await apiRequest("DELETE", `/api/pool/photos/${id}`);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/pool/photos", vars.clientId] });
      toast({ title: "Foto eliminada" });
    },
    onError: () => {
      toast({ title: "Erro ao eliminar foto", variant: "destructive" });
    },
  });
}
