import type { Express } from "express";
import { z } from "zod";
import { requireAuth } from "./middleware";
import { storage } from "../storage";
import { updateWorkingHoursSchema } from "@shared/schema";

const defaultWorkingHours = {
  workingHoursStart: 8,
  workingHoursEnd: 18,
  lunchEnabled: false,
  lunchStart: 12,
  lunchEnd: 14,
};

export function registerUserPreferencesRoutes(app: Express): void {
  app.get("/api/user/preferences/working-hours", requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const prefs = await storage.getUserPreferences(userId);
    if (!prefs) {
      return res.json({ ...defaultWorkingHours, hasPreferences: false });
    }
    res.json({
      workingHoursStart: prefs.workingHoursStart,
      workingHoursEnd: prefs.workingHoursEnd,
      lunchEnabled: prefs.lunchEnabled,
      lunchStart: prefs.lunchStart,
      lunchEnd: prefs.lunchEnd,
      hasPreferences: true,
    });
  });

  app.put("/api/user/preferences/working-hours", requireAuth, async (req, res) => {
    try {
      const input = updateWorkingHoursSchema.parse(req.body);
      const userId = req.user!.id;
      const prefs = await storage.upsertUserPreferences(userId, input);
      res.json({
        workingHoursStart: prefs.workingHoursStart,
        workingHoursEnd: prefs.workingHoursEnd,
        lunchEnabled: prefs.lunchEnabled,
        lunchStart: prefs.lunchStart,
        lunchEnd: prefs.lunchEnd,
        hasPreferences: true,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });
}
