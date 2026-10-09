import type { Express } from "express";
import { z } from "zod";
import { requireAuth } from "./middleware";
import { storage } from "../storage";
import { api } from "@shared/routes";

export function registerPendingTasksRoutes(app: Express): void {
  app.get(api.pendingTasks.count.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const count = await storage.getPendingTasksCount(userId);
    res.json({ count });
  });

  app.get(api.pendingTasks.list.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
    const includeCompleted = req.query.includeCompleted === 'true';
    const tasks = await storage.getPendingTasks(userId, clientId, includeCompleted);
    res.json(tasks);
  });

  app.get(api.pendingTasks.get.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const task = await storage.getPendingTask(Number(req.params.id), userId);
    if (!task) return res.status(404).json({ message: "Tarefa não encontrada" });
    res.json(task);
  });

  app.post(api.pendingTasks.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.pendingTasks.create.input.parse(req.body);
      const userId = req.user!.id;

      const client = await storage.getClient(input.clientId);
      if (!client || client.userId !== userId) {
        return res.status(400).json({ message: "Invalid client" });
      }

      const task = await storage.createPendingTask({ ...input, userId });
      res.status(201).json(task);
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

  app.put(api.pendingTasks.update.path, requireAuth, async (req, res) => {
    try {
      const input = api.pendingTasks.update.input.parse(req.body);
      const userId = req.user!.id;

      if (input.clientId !== undefined) {
        const client = await storage.getClient(input.clientId);
        if (!client || client.userId !== userId) {
          return res.status(400).json({ message: "Invalid client" });
        }
      }

      const updated = await storage.updatePendingTask(Number(req.params.id), userId, input);
      if (!updated) return res.status(404).json({ message: "Tarefa não encontrada" });
      res.json(updated);
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

  app.put(api.pendingTasks.complete.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const serviceLogId = req.body?.serviceLogId;
    const updated = await storage.completePendingTask(Number(req.params.id), userId, serviceLogId);
    if (!updated) return res.status(404).json({ message: "Tarefa não encontrada" });
    res.json(updated);
  });

  app.delete(api.pendingTasks.delete.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    await storage.deletePendingTask(Number(req.params.id), userId);
    res.status(204).end();
  });
}
