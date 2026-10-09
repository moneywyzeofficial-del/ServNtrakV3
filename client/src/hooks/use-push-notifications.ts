import { useState, useEffect, useCallback } from "react";

type PushState = "unsupported" | "default" | "granted" | "denied" | "loading";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushState>("loading");
  const [subscription, setSubscription] = useState<globalThis.PushSubscription | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }

    navigator.serviceWorker.ready.then(async (registration) => {
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        setSubscription(existing);
        setState("granted");
      } else {
        setState(Notification.permission === "denied" ? "denied" : "default");
      }
    });
  }, []);

  const subscribe = useCallback(async () => {
    if (state === "unsupported" || state === "denied") return false;

    try {
      setState("loading");

      const vapidRes = await fetch("/api/push/vapid-public-key");
      const { key } = await vapidRes.json();
      if (!key) {
        setState("default");
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });

      const deviceInfo = `${navigator.userAgent.substring(0, 100)}`;
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          subscription: sub.toJSON(),
          deviceInfo,
        }),
      });

      if (!res.ok) {
        await sub.unsubscribe();
        setState("default");
        return false;
      }

      setSubscription(sub);
      setState("granted");
      return true;
    } catch (err) {
      console.error("Push subscribe error:", err);
      setState(Notification.permission === "denied" ? "denied" : "default");
      return false;
    }
  }, [state]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return false;

    try {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      const res = await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ endpoint }),
      });

      if (!res.ok) {
        console.error("Failed to unsubscribe on server");
      }

      setSubscription(null);
      setState("default");
      return true;
    } catch (err) {
      console.error("Push unsubscribe error:", err);
      return false;
    }
  }, [subscription]);

  const sendTest = useCallback(async () => {
    try {
      const res = await fetch("/api/push/test", {
        method: "POST",
        credentials: "include",
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  return { state, subscription, subscribe, unsubscribe, sendTest };
}
