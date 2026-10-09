import type { Express } from "express";
import { z } from "zod";
import { requireAuth } from "./middleware";
import { storage } from "../storage";
import { api } from "@shared/routes";

export function registerSuggestedWorksRoutes(app: Express): void {
  app.get(api.suggestedWorks.list.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
    const includeCompleted = req.query.includeCompleted === 'true';
    const works = await storage.getSuggestedWorks(userId, clientId, includeCompleted);
    res.json(works);
  });

  app.get(api.suggestedWorks.get.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const work = await storage.getSuggestedWork(Number(req.params.id), userId);
    if (!work) return res.status(404).json({ message: 'Trabalho sugerido não encontrado' });
    res.json(work);
  });

  app.post(api.suggestedWorks.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.suggestedWorks.create.input.parse(req.body);
      const userId = req.user!.id;

      const client = await storage.getClient(input.clientId);
      if (!client || client.userId !== userId) {
        return res.status(400).json({ message: "Invalid client" });
      }

      const work = await storage.createSuggestedWork({ ...input, userId });
      res.status(201).json(work);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors.map(err => err.message).join(', ') });
      }
      throw e;
    }
  });

  app.put(api.suggestedWorks.update.path, requireAuth, async (req, res) => {
    try {
      const input = api.suggestedWorks.update.input.parse(req.body);
      const userId = req.user!.id;

      if (input.clientId !== undefined) {
        const client = await storage.getClient(input.clientId);
        if (!client || client.userId !== userId) {
          return res.status(400).json({ message: "Invalid client" });
        }
      }

      const updated = await storage.updateSuggestedWork(Number(req.params.id), userId, input);
      if (!updated) return res.status(404).json({ message: 'Trabalho sugerido não encontrado' });
      res.json(updated);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors.map(err => err.message).join(', ') });
      }
      throw e;
    }
  });

  app.delete(api.suggestedWorks.delete.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    await storage.deleteSuggestedWork(Number(req.params.id), userId);
    res.status(204).end();
  });
}
