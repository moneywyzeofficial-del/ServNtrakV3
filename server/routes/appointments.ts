import type { Express } from "express";
import { z } from "zod";
import { requireAuth } from "./middleware";
import { storage } from "../storage";
import { api } from "@shared/routes";

export function registerAppointmentsRoutes(app: Express): void {
  app.get(api.appointments.list.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
    const appointmentsList = await storage.getAppointments(userId, clientId);

    const enrichedAppointments = await Promise.all(appointmentsList.map(async (appt) => {
      const client = await storage.getClientForUser(appt.clientId, userId);
      return { ...appt, client: client! };
    }));

    res.json(enrichedAppointments);
  });

  app.post(api.appointments.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.appointments.create.input.parse(req.body);
      const userId = req.user!.id;

      const client = await storage.getClient(input.clientId);
      if (!client || client.userId !== userId) {
        return res.status(400).json({ message: "Invalid client" });
      }

      const appt = await storage.createAppointment({ ...input, userId });
      res.status(201).json(appt);
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

  app.put(api.appointments.update.path, requireAuth, async (req, res) => {
    try {
      const input = api.appointments.update.input.parse(req.body);
      const userId = req.user!.id;

      if (input.clientId !== undefined) {
        const client = await storage.getClient(input.clientId);
        if (!client || client.userId !== userId) {
          return res.status(400).json({ message: "Invalid client" });
        }
      }

      const updated = await storage.updateAppointment(Number(req.params.id), userId, input);

      if (!updated) return res.status(404).json({ message: "Appointment not found" });
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

  app.delete(api.appointments.delete.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    await storage.deleteAppointment(Number(req.params.id), userId);
    res.status(204).end();
  });

  app.post("/api/appointments/:id/visit-response", requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { confirmed } = z.object({ confirmed: z.boolean() }).parse(req.body);
      const userId = req.user!.id;

      if (confirmed) {
        await storage.updateAppointment(id, userId, { isCompleted: true });
      }

      res.json({ ok: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post("/api/appointments/generate-preview", requireAuth, async (req, res) => {
    try {
      const { year, month } = z.object({
        year: z.number().int().min(2020).max(2100),
        month: z.number().int().min(1).max(12),
      }).parse(req.body);
      const userId = req.user!.id;
      const preview = await storage.generateAppointmentPreview(userId, year, month);
      res.json(preview);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post("/api/appointments/generate-confirm", requireAuth, async (req, res) => {
    try {
      const { appointments: appts } = z.object({
        appointments: z.array(z.object({
          clientId: z.number(),
          clientName: z.string(),
          date: z.string(),
          type: z.string(),
          reason: z.string(),
        }))
      }).parse(req.body);
      const userId = req.user!.id;
      const count = await storage.confirmAppointments(userId, appts);
      res.json({ created: count });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });
}
