import type { Express } from "express";
import { z } from "zod";
import { requireAuth } from "./middleware";
import { storage } from "../storage";
import { api } from "@shared/routes";

export function registerClientPaymentsRoutes(app: Express): void {
  app.get(api.clientPayments.list.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const month = req.query.month ? Number(req.query.month) : undefined;
    const payments = await storage.getClientPayments(userId, year, month);
    res.json(payments);
  });

  app.post(api.clientPayments.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.clientPayments.create.input.parse(req.body);
      const userId = req.user!.id;

      const client = await storage.getClient(input.clientId);
      if (!client || client.userId !== userId) {
        return res.status(400).json({ message: "Invalid client" });
      }

      const payment = await storage.createClientPayment({ ...input, userId });
      res.status(201).json(payment);
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

  app.put(api.clientPayments.markPaid.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const updated = await storage.markPaymentAsPaid(Number(req.params.id), userId);
    if (!updated) return res.status(404).json({ message: "Pagamento não encontrado" });
    res.json(updated);
  });

  app.post(api.clientPayments.generate.path, requireAuth, async (req, res) => {
    try {
      const input = api.clientPayments.generate.input.parse(req.body);
      const userId = req.user!.id;
      const newPayments = await storage.generateMonthlyPayments(userId, input.year, input.month);
      res.status(201).json(newPayments);
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

  app.delete(api.clientPayments.delete.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    await storage.deleteClientPayment(Number(req.params.id), userId);
    res.status(204).end();
  });
}
