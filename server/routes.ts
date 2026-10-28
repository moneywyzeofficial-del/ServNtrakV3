import type { Express } from "express";
import type { Server } from "http";
import { setupAuth, registerAuthRoutes } from "./auth";
import { registerObjectStorageRoutes } from "./objectStorage";
import { pool } from "./db";
import { getStorageService } from "./lib/storageProvider";

import { registerClientsRoutes } from "./routes/clients";
import { registerAppointmentsRoutes } from "./routes/appointments";
import { registerServiceLogsRoutes } from "./routes/serviceLogs";
import { registerRemindersRoutes } from "./routes/reminders";
import { registerQuickPhotosRoutes } from "./routes/quickPhotos";
import { registerPurchasesRoutes } from "./routes/purchases";
import { registerClientPaymentsRoutes } from "./routes/clientPayments";
import { registerServiceVisitsRoutes } from "./routes/serviceVisits";
import { registerFinancesRoutes } from "./routes/finances";
import { registerEmployeesRoutes } from "./routes/employees";
import { registerPendingTasksRoutes } from "./routes/pendingTasks";
import { registerSuggestedWorksRoutes } from "./routes/suggestedWorks";
import { registerAiRoutes } from "./routes/ai";
import { registerPushRoutes } from "./routes/push";
import { registerExpenseNotesRoutes } from "./routes/expenseNotes";
import { registerQuotesRoutes } from "./routes/quotes";
import { registerUserPreferencesRoutes } from "./routes/userPreferences";
import { registerAssistantRoutes } from "./routes/assistant";
import { registerShoppingListRoutes } from "./routes/shoppingList";
import { registerPoolRoutes } from "./routes/pool";
import { registerClientEquipmentRoutes } from "./routes/clientEquipment";
import { registerClientDocumentsRoutes } from "./routes/clientDocuments";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/health", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "healthy", database: "connected", timestamp: new Date().toISOString() });
    } catch (err: any) {
      res.status(503).json({ status: "unhealthy", database: "disconnected", error: err?.message });
    }
  });

  await setupAuth(app);
  registerAuthRoutes(app);
  registerObjectStorageRoutes(app, getStorageService());

  registerClientsRoutes(app);
  registerAppointmentsRoutes(app);
  registerServiceLogsRoutes(app);
  registerRemindersRoutes(app);
  registerQuickPhotosRoutes(app);
  registerPurchasesRoutes(app);
  registerClientPaymentsRoutes(app);
  registerServiceVisitsRoutes(app);
  registerFinancesRoutes(app);
  registerEmployeesRoutes(app);
  registerPendingTasksRoutes(app);
  registerSuggestedWorksRoutes(app);
  registerAiRoutes(app);
  registerPushRoutes(app);
  registerExpenseNotesRoutes(app);
  registerQuotesRoutes(app);
  registerUserPreferencesRoutes(app);
  registerAssistantRoutes(app);
  registerShoppingListRoutes(app);
  registerPoolRoutes(app);
  registerClientEquipmentRoutes(app);
  registerClientDocumentsRoutes(app);

  return httpServer;
}
