import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth } from "./middleware";
import { insertShoppingListSchema } from "@shared/schema";

const updateShoppingListSchema = insertShoppingListSchema.partial();

export function registerShoppingListRoutes(app: Express): void {
  app.get("/api/shopping-list", requireAuth, async (req, res) => {
    try {
      const items = await storage.getShoppingList(req.user!.id);
      res.json(items);
    } catch (error) {
      console.error("Erro ao obter lista de compras:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/shopping-list", requireAuth, async (req, res) => {
    try {
      const parsed = insertShoppingListSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" });
      const item = await storage.createShoppingListItem({ ...parsed.data, userId: req.user!.id });
      res.status(201).json(item);
    } catch (error) {
      console.error("Erro ao criar item da lista de compras:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.put("/api/shopping-list/:id", requireAuth, async (req, res) => {
    try {
      const parsed = updateShoppingListSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" });
      const updated = await storage.updateShoppingListItem(parseInt(req.params.id), req.user!.id, parsed.data);
      if (!updated) return res.status(404).json({ message: "Item não encontrado" });
      res.json(updated);
    } catch (error) {
      console.error("Erro ao actualizar item da lista de compras:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.delete("/api/shopping-list/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteShoppingListItem(parseInt(req.params.id), req.user!.id);
      res.status(204).send();
    } catch (error) {
      console.error("Erro ao eliminar item da lista de compras:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.patch("/api/shopping-list/:id/status", requireAuth, async (req, res) => {
    try {
      const updated = await storage.toggleShoppingListItemStatus(parseInt(req.params.id), req.user!.id);
      if (!updated) return res.status(404).json({ message: "Item não encontrado" });
      res.json(updated);
    } catch (error) {
      console.error("Erro ao alterar estado do item:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
}
