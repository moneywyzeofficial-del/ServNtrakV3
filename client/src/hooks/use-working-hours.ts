import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import {
  DEFAULT_WORKING_HOURS,
  fromDTO,
  normalizeSettings,
  readCachedSettings,
  settingsEqual,
  toDTO,
  writeCachedSettings,
  type WorkingHoursDTO,
  type WorkingHoursSettings,
} from "@/lib/working-hours";

const ENDPOINT = "/api/user/preferences/working-hours";

export function useWorkingHours() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryKey = [ENDPOINT, userId] as const;
  const migratedRef = useRef<string | null>(null);

  const query = useQuery<WorkingHoursDTO>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(ENDPOINT, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return (await res.json()) as WorkingHoursDTO;
    },
    retry: false,
    staleTime: 60_000,
    enabled: !!userId,
  });

  const serverSettings = query.data ? fromDTO(query.data) : null;
  const serverHasPrefs = query.data?.hasPreferences === true;
  const cached = readCachedSettings(userId);
  const settings: WorkingHoursSettings = serverHasPrefs
    ? (serverSettings ?? DEFAULT_WORKING_HOURS)
    : (cached ?? serverSettings ?? DEFAULT_WORKING_HOURS);

  useEffect(() => {
    if (serverSettings && userId && query.data?.hasPreferences) {
      writeCachedSettings(userId, serverSettings);
    }
  }, [serverSettings, userId, query.data?.hasPreferences]);

  const mutation = useMutation({
    mutationFn: async (next: WorkingHoursSettings) => {
      const normalized = normalizeSettings(next);
      const res = await apiRequest("PUT", ENDPOINT, toDTO(normalized));
      return (await res.json()) as WorkingHoursDTO;
    },
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<WorkingHoursDTO>(queryKey);
      const normalized = normalizeSettings(next);
      queryClient.setQueryData<WorkingHoursDTO>(queryKey, {
        ...toDTO(normalized),
        hasPreferences: true,
      });
      writeCachedSettings(userId, normalized);
      return { previous };
    },
    onError: (_err, _next, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous);
        if (ctx.previous.hasPreferences) {
          writeCachedSettings(userId, fromDTO(ctx.previous));
        }
      }
      if (migratedRef.current === userId) {
        migratedRef.current = null;
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const setSettings = useCallback(
    (next: WorkingHoursSettings) => {
      mutation.mutate(next);
    },
    [mutation]
  );

  useEffect(() => {
    if (!userId) return;
    if (query.data?.hasPreferences !== false) return;
    if (mutation.isPending) return;
    if (migratedRef.current === userId) return;
    const localCache = readCachedSettings(userId);
    if (!localCache) return;
    if (settingsEqual(localCache, DEFAULT_WORKING_HOURS)) return;
    migratedRef.current = userId;
    mutation.mutate(localCache);
  }, [userId, query.data?.hasPreferences, mutation]);

  return [settings, setSettings] as const;
}
