import type { Express } from "express";
import { z } from "zod";
import { requireAuth } from "./middleware";
import { storage } from "../storage";
import { api } from "@shared/routes";

export function registerPoolRoutes(app: Express): void {
  // Pool Equipment
  app.get(api.pool.equipment.list.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const clientId = Number(req.query.clientId);
    if (!clientId) return res.status(400).json({ message: "clientId é obrigatório" });

    const client = await storage.getClientForUser(clientId, userId);
    if (!client) return res.status(404).json({ message: "Cliente não encontrado" });

    const equipment = await storage.getPoolEquipment(clientId);
    res.json(equipment);
  });

  app.post(api.pool.equipment.create.path, requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { clientId, ...rest } = req.body;
      if (!clientId) return res.status(400).json({ message: "clientId é obrigatório" });

      const client = await storage.getClientForUser(clientId, userId);
      if (!client) return res.status(400).json({ message: "Cliente inválido" });

      const input = api.pool.equipment.create.input.parse(rest);
      const equipment = await storage.createPoolEquipment({ ...input, clientId });
      res.status(201).json(equipment);
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

  app.put(api.pool.equipment.update.path, requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const id = Number(req.params.id);
      const input = api.pool.equipment.update.input.parse(req.body);

      const existing = await storage.getPoolEquipmentForUser(id, userId);
      if (!existing) return res.status(404).json({ message: "Equipamento não encontrado" });

      const updated = await storage.updatePoolEquipment(id, input);
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

  app.delete(api.pool.equipment.delete.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const id = Number(req.params.id);

    const existing = await storage.getPoolEquipmentForUser(id, userId);
    if (!existing) return res.status(404).json({ message: "Equipamento não encontrado" });

    await storage.deletePoolEquipment(id, userId);
    res.status(204).end();
  });

  // Pool Photos
  app.get(api.pool.photos.list.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const clientId = Number(req.query.clientId);
    if (!clientId) return res.status(400).json({ message: "clientId é obrigatório" });

    const client = await storage.getClientForUser(clientId, userId);
    if (!client) return res.status(404).json({ message: "Cliente não encontrado" });

    const equipmentId = req.query.equipmentId ? Number(req.query.equipmentId) : undefined;
    const photos = await storage.getPoolPhotos(clientId, equipmentId);
    res.json(photos);
  });

  app.post(api.pool.photos.create.path, requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { clientId, ...rest } = req.body;
      if (!clientId) return res.status(400).json({ message: "clientId é obrigatório" });

      const client = await storage.getClientForUser(clientId, userId);
      if (!client) return res.status(400).json({ message: "Cliente inválido" });

      const input = api.pool.photos.create.input.parse(rest);
      const photo = await storage.createPoolPhoto({ ...input, clientId });
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

  app.delete(api.pool.photos.delete.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const id = Number(req.params.id);
    await storage.deletePoolPhoto(id, userId);
    res.status(204).end();
  });
}
