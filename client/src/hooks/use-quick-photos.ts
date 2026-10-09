import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { QuickPhoto, Client } from "@shared/schema";

type QuickPhotoWithClient = QuickPhoto & { client: Client };

export function useQuickPhotos(clientId?: string | number) {
  return useQuery<QuickPhotoWithClient[]>({
    queryKey: clientId ? ["/api/quick-photos", clientId] : ["/api/quick-photos"],
    queryFn: async () => {
      const url = clientId ? `/api/quick-photos?clientId=${clientId}` : "/api/quick-photos";
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch quick photos");
      return response.json();
    },
  });
}

export function useDeleteQuickPhoto() {
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/quick-photos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quick-photos"], refetchType: "all" });
    },
  });
}
