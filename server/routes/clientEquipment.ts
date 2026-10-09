import type { Express } from "express";
import { requireAuth } from "./middleware";
import { storage } from "../storage";
import { api, buildUrl } from "@shared/routes";

export function registerClientEquipmentRoutes(app: Express): void {
  app.get(api.clientEquipment.list.path, requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const clientId = parseInt(req.params.clientId);
      if (isNaN(clientId)) return res.status(400).json({ error: "clientId inválido" });

      const items = await storage.getClientEquipment(clientId, userId);
      res.json(items);
    } catch (err) {
      console.error("Error listing equipment:", err);
      res.status(500).json({ error: "Erro ao listar equipamentos" });
    }
  });

  app.post(api.clientEquipment.create.path, requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const clientId = parseInt(req.params.clientId);
      if (isNaN(clientId)) return res.status(400).json({ error: "clientId inválido" });

      const parsed = api.clientEquipment.create.input.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Dados inválidos" });
      }

      const item = await storage.createClientEquipment({ ...parsed.data, clientId, userId });
      res.status(201).json(item);
    } catch (err) {
      console.error("Error creating equipment:", err);
      res.status(500).json({ error: "Erro ao criar equipamento" });
    }
  });

  app.put(api.clientEquipment.update.path, requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

      const parsed = api.clientEquipment.update.input.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Dados inválidos" });
      }

      const updated = await storage.updateClientEquipment(id, userId, parsed.data);
      if (!updated) return res.status(404).json({ error: "Equipamento não encontrado" });

      res.json(updated);
    } catch (err) {
      console.error("Error updating equipment:", err);
      res.status(500).json({ error: "Erro ao atualizar equipamento" });
    }
  });

  app.delete(api.clientEquipment.delete.path, requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

      await storage.deleteClientEquipment(id, userId);
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting equipment:", err);
      res.status(500).json({ error: "Erro ao eliminar equipamento" });
    }
  });
}
