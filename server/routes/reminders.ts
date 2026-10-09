import type { Express } from "express";
import { z } from "zod";
import { requireAuth } from "./middleware";
import { storage } from "../storage";
import { api } from "@shared/routes";

export function registerRemindersRoutes(app: Express): void {
  app.get(api.reminders.list.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
    const remindersList = await storage.getReminders(userId, clientId);

    const enrichedReminders = await Promise.all(remindersList.map(async (reminder) => {
      const client = reminder.clientId ? await storage.getClientForUser(reminder.clientId, userId) : null;
      return { ...reminder, client };
    }));

    res.json(enrichedReminders);
  });

  app.post(api.reminders.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.reminders.create.input.parse(req.body);
      const userId = req.user!.id;

      if (input.clientId) {
        const client = await storage.getClient(input.clientId);
        if (!client || client.userId !== userId) {
          return res.status(400).json({ message: "Invalid client" });
        }
      }

      const normalized = {
        ...input,
        clientId: input.clientId ?? undefined,
        frequency: input.frequency ?? undefined,
      };
      const reminder = await storage.createReminder({ ...normalized, userId });
      res.status(201).json(reminder);
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

  app.put(api.reminders.update.path, requireAuth, async (req, res) => {
    try {
      const input = api.reminders.update.input.parse(req.body);
      const userId = req.user!.id;

      if (input.clientId) {
        const client = await storage.getClient(input.clientId);
        if (!client || client.userId !== userId) {
          return res.status(400).json({ message: "Invalid client" });
        }
      }

      const normalized = {
        ...input,
        clientId: input.clientId ?? undefined,
        frequency: input.frequency ?? undefined,
      };
      const updated = await storage.updateReminder(Number(req.params.id), userId, normalized);

      if (!updated) return res.status(404).json({ message: "Reminder not found" });
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

  app.delete(api.reminders.delete.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    await storage.deleteReminder(Number(req.params.id), userId);
    res.status(204).end();
  });
}
