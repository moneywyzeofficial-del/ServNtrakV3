import type { Express } from "express";
import { z } from "zod";
import { requireAuth } from "./middleware";
import { storage } from "../storage";
import { api } from "@shared/routes";

export function registerServiceLogsRoutes(app: Express): void {
  app.get(api.serviceLogs.list.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
    const logs = await storage.getServiceLogs(userId, clientId);
    res.json(logs);
  });

  // Must be before :id route
  app.get(api.serviceLogs.unpaid.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const unpaidLogs = await storage.getUnpaidExtraServices(userId);
    res.json(unpaidLogs);
  });

  app.get(api.serviceLogs.get.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const log = await storage.getServiceLogWithEntries(Number(req.params.id), userId);
    if (!log) return res.status(404).json({ message: "Service log not found" });
    res.json(log);
  });

  app.post(api.serviceLogs.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.serviceLogs.create.input.parse(req.body);
      const userId = req.user!.id;

      const client = await storage.getClient(input.clientId);
      if (!client || client.userId !== userId) {
        return res.status(400).json({ message: "Invalid client" });
      }

      const { laborEntries, materialEntries, ...logData } = input;
      const log = await storage.createServiceLogWithEntries(
        { ...logData, userId },
        laborEntries || [],
        materialEntries || []
      );
      res.status(201).json(log);
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

  app.put(api.serviceLogs.markPaid.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const updated = await storage.markServiceLogAsPaid(Number(req.params.id), userId);
    if (!updated) return res.status(404).json({ message: "Service log not found" });
    res.json(updated);
  });

  app.delete(api.serviceLogs.delete.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    await storage.deleteServiceLog(Number(req.params.id), userId);
    res.status(204).end();
  });
}
