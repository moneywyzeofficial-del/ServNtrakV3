import type { Express } from "express";
import { requireAuth } from "./middleware";
import { storage } from "../storage";
import { getStorageService } from "../lib/storageProvider";
import { api } from "@shared/routes";

const MAX_DOC_SIZE = 10 * 1024 * 1024;

export function registerClientDocumentsRoutes(app: Express): void {
  app.get(api.clientDocuments.list.path, requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const clientId = parseInt(req.params.clientId);
      if (isNaN(clientId)) return res.status(400).json({ error: "clientId inválido" });
      const docs = await storage.getClientDocuments(clientId, userId);
      res.json(docs);
    } catch (err) {
      console.error("Error listing documents:", err);
      res.status(500).json({ error: "Erro ao listar documentos" });
    }
  });

  app.post(api.clientDocuments.create.path, requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const clientId = parseInt(req.params.clientId);

      console.log("[documents:create] start", { clientId, userId, bodyKeys: Object.keys(req.body) });

      if (isNaN(clientId)) return res.status(400).json({ error: "clientId inválido" });

      const parsed = api.clientDocuments.create.input.safeParse(req.body);
      if (!parsed.success) {
        console.error("[documents:create] validation failed", parsed.error.issues);
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Dados inválidos" });
      }

      const { mimeType, fileSize } = parsed.data;
      if (mimeType !== "application/pdf") {
        return res.status(400).json({ error: "Apenas ficheiros PDF são aceites." });
      }
      if (fileSize > MAX_DOC_SIZE) {
        return res.status(400).json({ error: `O ficheiro excede o limite de ${MAX_DOC_SIZE / (1024 * 1024)} MB.` });
      }

      console.log("[documents:create] creating record", { clientId, userId, title: parsed.data.title });
      const doc = await storage.createClientDocument({ ...parsed.data, clientId, userId });
      console.log("[documents:create] record created", { docId: doc.id });
      res.status(201).json(doc);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      console.error("[documents:create] error", {
        message: e.message,
        stack: e.stack?.split("\n").slice(0, 3).join(" | "),
      });
      res.status(500).json({ error: "Erro ao criar documento", message: e.message });
    }
  });

  app.put(api.clientDocuments.update.path, requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

      const parsed = api.clientDocuments.update.input.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Dados inválidos" });
      }

      const updated = await storage.updateClientDocument(id, userId, parsed.data);
      if (!updated) return res.status(404).json({ error: "Documento não encontrado" });
      res.json(updated);
    } catch (err) {
      console.error("Error updating document:", err);
      res.status(500).json({ error: "Erro ao atualizar documento" });
    }
  });

  app.delete(api.clientDocuments.delete.path, requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

      const deleted = await storage.deleteClientDocument(id, userId);
      if (!deleted) return res.status(404).json({ error: "Documento não encontrado" });

      // Best-effort: try to remove the file from storage
      if (deleted.fileUrl) {
        getStorageService().deleteObjectEntity(deleted.fileUrl).catch(() => {});
      }

      res.status(204).send();
    } catch (err) {
      console.error("Error deleting document:", err);
      res.status(500).json({ error: "Erro ao eliminar documento" });
    }
  });
}
