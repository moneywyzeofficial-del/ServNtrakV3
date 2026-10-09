import type { Express } from "express";
import { z } from "zod";
import { requireAuth } from "./middleware";
import { storage } from "../storage";
import { api } from "@shared/routes";

export function registerServiceVisitsRoutes(app: Express): void {
  // --- Service Visits ---

  app.get(api.serviceVisits.list.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
    const visits = await storage.getServiceVisits(userId, clientId);
    res.json(visits);
  });

  app.post(api.serviceVisits.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.serviceVisits.create.input.parse(req.body);
      const userId = req.user!.id;
      const visit = await storage.createServiceVisit(
        { ...input.visit, userId },
        input.services
      );
      res.status(201).json(visit);
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

  app.get(api.serviceVisits.stats.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const clientId = Number(req.params.id);
    const stats = await storage.getClientServiceStats(userId, clientId);
    res.json(stats);
  });

  // --- Geofencing ---

  const verifyClientOwnership = async (clientId: number, userId: string) => {
    const userClients = await storage.getClients(userId);
    return userClients.some(c => c.id === clientId);
  };

  const geofencingArrivalSchema = z.object({
    clientId: z.number().int().positive(),
    appointmentId: z.number().int().positive().optional(),
    timestamp: z.string().datetime(),
  });

  app.post("/api/geofencing/arrival", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const parsed = geofencingArrivalSchema.parse(req.body);

      if (!(await verifyClientOwnership(parsed.clientId, userId))) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }

      const visit = await storage.createServiceVisit(
        {
          userId,
          clientId: parsed.clientId,
          appointmentId: parsed.appointmentId,
          visitDate: new Date(parsed.timestamp),
          actualDurationMinutes: 0,
          workerCount: 1,
          source: "geofencing",
          status: "em_curso",
        },
        []
      );

      res.status(201).json(visit);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors.map(e => e.message).join(', ') });
      }
      console.error("Geofencing arrival error:", err);
      res.status(500).json({ message: "Erro ao registar chegada" });
    }
  });

  const geofencingVisitSchema = z.object({
    clientId: z.number().int().positive(),
    appointmentId: z.number().int().positive().optional(),
    inicio: z.string().datetime(),
    fim: z.string().datetime(),
    duracaoMinutos: z.number().int().min(1).max(720),
    fonte: z.string().optional().default("geofencing"),
  });

  app.post("/api/geofencing/visit", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const parsed = geofencingVisitSchema.parse(req.body);

      if (!(await verifyClientOwnership(parsed.clientId, userId))) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }

      const existingVisits = await storage.getServiceVisits(userId, parsed.clientId);
      const emCurso = existingVisits.find(
        v => v.source === "geofencing" && v.status === "em_curso" && v.clientId === parsed.clientId
      );

      let visit;
      if (emCurso) {
        const updated = await storage.completeServiceVisit(emCurso.id, {
          endTime: new Date(parsed.fim),
          actualDurationMinutes: parsed.duracaoMinutos,
          ...(parsed.appointmentId ? { appointmentId: parsed.appointmentId } : {}),
        });

        if (parsed.appointmentId) {
          await storage.updateAppointment(parsed.appointmentId, userId, { isCompleted: true });
        }

        visit = { ...updated, services: emCurso.services ?? [] };
      } else {
        visit = await storage.createServiceVisit(
          {
            userId,
            clientId: parsed.clientId,
            appointmentId: parsed.appointmentId,
            visitDate: new Date(parsed.inicio),
            endTime: new Date(parsed.fim),
            actualDurationMinutes: parsed.duracaoMinutos,
            workerCount: 1,
            source: parsed.fonte,
            status: "concluida",
          },
          []
        );
      }

      res.json(visit);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors.map(e => e.message).join(', ') });
      }
      console.error("Geofencing visit error:", err);
      res.status(500).json({ message: "Erro ao registar visita" });
    }
  });

  const geofencingDiscardSchema = z.object({
    clientId: z.number().int().positive(),
    appointmentId: z.number().int().positive().optional(),
  });

  app.post("/api/geofencing/discard", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const parsed = geofencingDiscardSchema.parse(req.body);

      const existingVisits = await storage.getServiceVisits(userId, parsed.clientId);
      const emCurso = existingVisits.find(
        v => v.source === "geofencing" && v.status === "em_curso" && v.clientId === parsed.clientId
      );

      if (emCurso) {
        await storage.deleteServiceVisit(emCurso.id);
      }

      res.status(204).end();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors.map(e => e.message).join(', ') });
      }
      console.error("Geofencing discard error:", err);
      res.status(500).json({ message: "Erro ao descartar visita" });
    }
  });
}
