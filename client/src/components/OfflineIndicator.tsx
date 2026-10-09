import { useState, useEffect } from "react";
import { WifiOff, Upload, Loader2 } from "lucide-react";
import { subscribeOfflineQueue, triggerSync } from "@/lib/offline-queue";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function OfflineIndicator() {
  const [offline, setOffline] = useState(false);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setOffline(!navigator.onLine);
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const unsub = subscribeOfflineQueue((count) => {
      setPending(count);
      if (count === 0) setSyncing(false);
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsub();
    };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    const result = await triggerSync();
    if (result.synced > 0 || result.failed > 0) {
      toast({
        title: result.failed > 0 ? "Sincronização parcial" : "Sincronizado",
        description:
          `${result.synced} atualizações enviadas` +
          (result.failed > 0 ? `, ${result.failed} falharam` : ""),
        variant: result.failed > 0 ? "destructive" : "default",
      });
    }
  };

  const showPending = pending > 0;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
      {offline && (
        <div className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-full shadow-lg text-sm font-medium">
          <WifiOff className="w-4 h-4" aria-hidden="true" />
          Offline
          {showPending && (
            <span className="ml-1 opacity-80">· {pending} pendente{pending !== 1 ? "s" : ""}</span>
          )}
        </div>
      )}
      {!offline && showPending && (
        <Button
          type="button"
          size="sm"
          className="rounded-full shadow-lg gap-1.5"
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          {syncing ? "A sincronizar..." : `Sincronizar (${pending})`}
        </Button>
      )}
    </div>
  );
}
