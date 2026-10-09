import type { Express } from "express";
import { z } from "zod";
import { requireAuth } from "./middleware";
import { storage } from "../storage";
import { api } from "@shared/routes";

export function registerClientsRoutes(app: Express): void {
  app.get(api.clients.list.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const clients = await storage.getClients(userId);
    res.json(clients);
  });

  app.get(api.clients.get.path, requireAuth, async (req, res) => {
    const client = await storage.getClient(Number(req.params.id));
    if (!client) return res.status(404).json({ message: "Client not found" });

    const userId = req.user!.id;
    if (client.userId !== userId) return res.status(403).json({ message: "Forbidden" });

    res.json(client);
  });

  app.post(api.clients.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.clients.create.input.parse(req.body);
      const userId = req.user!.id;
      const client = await storage.createClient({ ...input, userId });
      res.status(201).json(client);
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

  app.put(api.clients.update.path, requireAuth, async (req, res) => {
    try {
      const input = api.clients.update.input.parse(req.body);
      const userId = req.user!.id;
      const updated = await storage.updateClient(Number(req.params.id), userId, input);

      if (!updated) return res.status(404).json({ message: "Client not found or access denied" });
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

  app.delete(api.clients.delete.path, requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const id = Number(req.params.id);
      await storage.deleteClient(id, userId);
      res.status(204).end();
    } catch (err: any) {
      if (err?.code === "23503") {
        return res.status(409).json({ message: "Cliente tem registos associados. Elimine primeiro os agendamentos, visitas ou notas de despesa." });
      }
      console.error("Erro ao eliminar cliente:", err);
      res.status(500).json({ message: "Erro interno ao eliminar cliente" });
    }
  });

  app.get("/api/clients/profitability", requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const data = await storage.getClientsProfitability(userId);
    res.json(data);
  });

  app.post("/api/clients/quick-add", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { name, phone, countryCode, email } = req.body;

      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "O nome é obrigatório" });
      }

      const created = await storage.createClient({
        userId,
        name: name.trim(),
        phone: phone?.trim() || null,
        countryCode: countryCode?.trim() || "+351",
        email: email?.trim() || null,
      });

      res.status(201).json(created);
    } catch (err: any) {
      console.error("Quick-add client error:", err);
      res.status(500).json({ message: "Erro ao criar cliente" });
    }
  });
}
