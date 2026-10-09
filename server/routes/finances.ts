import type { Express } from "express";
import { z } from "zod";
import { requireAuth } from "./middleware";
import { storage } from "../storage";
import { api } from "@shared/routes";

export function registerFinancesRoutes(app: Express): void {
  // --- Financial Config ---

  app.get(api.financialConfig.get.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const config = await storage.getFinancialConfig(userId);
    res.json(config || null);
  });

  app.put(api.financialConfig.update.path, requireAuth, async (req, res) => {
    try {
      const input = api.financialConfig.update.input.parse(req.body);
      const userId = req.user!.id;
      const config = await storage.createOrUpdateFinancialConfig(userId, input);
      res.json(config);
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

  // --- Monthly Distributions ---

  app.get(api.monthlyDistributions.list.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const distributions = await storage.getMonthlyDistributions(userId, year);
    res.json(distributions);
  });

  app.get(api.monthlyDistributions.get.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const year = Number(req.params.year);
    const month = Number(req.params.month);
    const distribution = await storage.getMonthlyDistribution(userId, year, month);
    res.json(distribution || null);
  });

  app.post(api.monthlyDistributions.calculate.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const year = Number(req.params.year);
    const month = Number(req.params.month);
    const distribution = await storage.calculateAndSaveDistribution(userId, year, month);
    res.json(distribution);
  });

  app.put(api.monthlyDistributions.update.path, requireAuth, async (req, res) => {
    try {
      const input = api.monthlyDistributions.update.input.parse(req.body);
      const userId = req.user!.id;
      const updated = await storage.updateMonthlyDistribution(Number(req.params.id), userId, input);
      if (!updated) return res.status(404).json({ message: "Distribuição não encontrada" });
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
}
