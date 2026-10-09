import type { Express } from "express";
import { z } from "zod";
import { requireAuth } from "./middleware";
import { storage } from "../storage";
import { api } from "@shared/routes";

export function registerQuickPhotosRoutes(app: Express): void {
  app.get(api.quickPhotos.list.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
    const photos = await storage.getQuickPhotos(userId, clientId);

    const enrichedPhotos = await Promise.all(photos.map(async (photo) => {
      const client = await storage.getClientForUser(photo.clientId, userId);
      return { ...photo, client: client! };
    }));

    res.json(enrichedPhotos);
  });

  app.post(api.quickPhotos.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.quickPhotos.create.input.parse(req.body);
      const userId = req.user!.id;

      const client = await storage.getClient(input.clientId);
      if (!client || client.userId !== userId) {
        return res.status(400).json({ message: "Invalid client" });
      }

      const photo = await storage.createQuickPhoto({ ...input, userId });
      res.status(201).json(photo);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.quickPhotos.delete.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    await storage.deleteQuickPhoto(Number(req.params.id), userId);
    res.status(204).end();
  });
}
