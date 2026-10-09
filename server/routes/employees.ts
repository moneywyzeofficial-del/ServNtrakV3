import type { Express } from "express";
import { z } from "zod";
import { requireAuth } from "./middleware";
import { storage } from "../storage";
import { api } from "@shared/routes";

export function registerEmployeesRoutes(app: Express): void {
  app.get(api.employees.list.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const includeInactive = req.query.includeInactive === 'true';
    const employeesList = await storage.getEmployees(userId, includeInactive);
    res.json(employeesList);
  });

  app.get(api.employees.get.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const employee = await storage.getEmployee(Number(req.params.id), userId);
    if (!employee) return res.status(404).json({ message: "Funcionário não encontrado" });
    res.json(employee);
  });

  app.post(api.employees.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.employees.create.input.parse(req.body);
      const userId = req.user!.id;
      const employee = await storage.createEmployee({ ...input, userId });
      res.status(201).json(employee);
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

  app.put(api.employees.update.path, requireAuth, async (req, res) => {
    try {
      const input = api.employees.update.input.parse(req.body);
      const userId = req.user!.id;
      const updated = await storage.updateEmployee(Number(req.params.id), userId, input);
      if (!updated) return res.status(404).json({ message: "Funcionário não encontrado" });
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

  app.put(api.employees.toggleActive.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const updated = await storage.toggleEmployeeActive(Number(req.params.id), userId);
    if (!updated) return res.status(404).json({ message: "Funcionário não encontrado" });
    res.json(updated);
  });

  app.delete(api.employees.delete.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    await storage.deleteEmployee(Number(req.params.id), userId);
    res.status(204).end();
  });
}
