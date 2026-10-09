import type { Express } from "express";
import { z } from "zod";
import { requireAuth } from "./middleware";
import {
  saveSubscription,
  removeSubscription,
  sendPushToUser,
  getVapidPublicKey,
  getPushHealthStatus,
  isAllowedPushEndpoint,
  InvalidPushEndpointError,
} from "../pushService";

export function registerPushRoutes(app: Express): void {
  app.get("/api/push/vapid-public-key", (_req, res) => {
    res.json({ key: getVapidPublicKey() });
  });

  app.post("/api/push/subscribe", requireAuth, async (req, res) => {
    try {
      const { subscription, deviceInfo } = z.object({
        subscription: z.object({
          endpoint: z
            .string()
            .url()
            .max(2048)
            .refine(isAllowedPushEndpoint, {
              message:
                "Endpoint de push não pertence a um serviço suportado (FCM, Mozilla Autopush, APNs)",
            }),
          keys: z.object({
            p256dh: z.string().min(1).max(512),
            auth: z.string().min(1).max(512),
          }),
        }),
        deviceInfo: z.string().max(512).optional(),
      }).parse(req.body);

      await saveSubscription(req.user!.id, subscription, deviceInfo);
      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      if (err instanceof InvalidPushEndpointError) {
        return res.status(400).json({ message: err.message });
      }
      console.error("Push subscribe error:", err);
      res.status(500).json({ message: "Erro ao registar notificação" });
    }
  });

  app.post("/api/push/unsubscribe", requireAuth, async (req, res) => {
    try {
      const { endpoint } = z.object({
        endpoint: z.string().url(),
      }).parse(req.body);

      await removeSubscription(endpoint, req.user!.id);
      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Erro ao remover notificação" });
    }
  });

  app.get("/api/push/health", requireAuth, async (_req, res) => {
    try {
      const health = await getPushHealthStatus();
      res.json(health);
    } catch (err) {
      console.error("[routes] Falha ao obter estado de saúde push:", err);
      res.status(500).json({ message: "Erro ao obter estado de notificações push" });
    }
  });

  app.post("/api/push/test", requireAuth, async (req, res) => {
    try {
      const result = await sendPushToUser(req.user!.id, {
        title: "ServNtrak",
        body: "Notificações push ativas! 🌿",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        url: "/",
      });
      if (result.sent === 0) {
        return res.status(422).json({ ...result, message: "Nenhuma notificação enviada" });
      }
      res.json(result);
    } catch (err) {
      console.error("Push test error:", err);
      res.status(500).json({ message: "Erro ao enviar notificação de teste" });
    }
  });
}
