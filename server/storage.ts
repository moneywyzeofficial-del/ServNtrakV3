import { db } from "./db";
import {
  clients, appointments, serviceLogs, reminders, quickPhotos,
  serviceLogLaborEntries, serviceLogMaterialEntries,
  purchaseCategories, stores, purchases, clientPayments,
  serviceVisits, serviceVisitServices,
  financialConfig, monthlyDistributions, employees, pendingTasks, suggestedWorks,
  expenseNotes, expenseNoteItems, expenseNoteEdits,
  quotes, quoteItems,
  shoppingList,
  poolEquipment, poolPhotos, clientEquipment, clientDocuments,
  type InsertClient, type Client,
  type InsertAppointment, type Appointment,
  type InsertServiceLog, type ServiceLog,
  type InsertReminder, type Reminder,
  type InsertQuickPhoto, type QuickPhoto,
  type InsertServiceLogLaborEntry, type ServiceLogLaborEntry,
  type InsertServiceLogMaterialEntry, type ServiceLogMaterialEntry,
  type ServiceLogWithEntries,
  type InsertPurchaseCategory, type PurchaseCategory,
  type InsertStore, type Store,
  type InsertPurchase, type Purchase, type PurchaseWithDetails,
  type InsertClientPayment, type ClientPayment, type ClientPaymentWithClient,
  type InsertServiceVisit, type ServiceVisit, type ServiceVisitWithServices,
  type InsertServiceVisitService, type ServiceVisitService,
  type ClientServiceStats,
  type InsertFinancialConfig, type FinancialConfig,
  type InsertMonthlyDistribution, type MonthlyDistribution,
  type InsertEmployee, type Employee,
  type InsertPendingTask, type PendingTask, type PendingTaskWithClient,
  type InsertSuggestedWork, type SuggestedWork, type SuggestedWorkWithClient,
  type ClientProfitabilityData,
  type AppointmentPreview,
  type InsertExpenseNote, type ExpenseNote,
  type InsertExpenseNoteItem, type ExpenseNoteItem, type ExpenseNoteWithDetails,
  type InsertQuote, type Quote,
  type InsertQuoteItem, type QuoteItem, type QuoteWithDetails,
  type ShoppingListItem, type InsertShoppingListItem,
  type PoolEquipment, type InsertPoolEquipment,
  type PoolPhoto, type InsertPoolPhoto,
  type ClientEquipment, type InsertClientEquipment,
  type ClientDocument, type InsertClientDocument,
  userPreferences,
  type UserPreferences, type UpdateWorkingHours,
} from "@shared/schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";

export interface IStorage {
  // Clients
  getClients(userId: string): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient & { userId: string }): Promise<Client>;
  updateClient(id: number, userId: string, updates: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number, userId: string): Promise<void>;
  getClientsProfitability(userId: string): Promise<ClientProfitabilityData[]>;

  // Appointments
  getAppointments(userId: string, clientId?: number): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment & { userId: string }): Promise<Appointment>;
  updateAppointment(id: number, userId: string, updates: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number, userId: string): Promise<void>;
  generateAppointmentPreview(userId: string, year: number, month: number): Promise<AppointmentPreview[]>;
  confirmAppointments(userId: string, appointments: AppointmentPreview[]): Promise<number>;

  // Service Logs
  getServiceLogs(userId: string, clientId?: number): Promise<ServiceLog[]>;
  getServiceLogWithEntries(id: number, userId: string): Promise<ServiceLogWithEntries | undefined>;
  getUnpaidExtraServices(userId: string): Promise<(ServiceLog & { clientName: string })[]>;
  createServiceLogWithEntries(
    log: InsertServiceLog & { userId: string },
    laborEntries: Omit<InsertServiceLogLaborEntry, 'serviceLogId' | 'cost'>[],
    materialEntries: Omit<InsertServiceLogMaterialEntry, 'serviceLogId' | 'cost'>[]
  ): Promise<ServiceLogWithEntries>;
  updateServiceLog(id: number, userId: string, updates: Partial<InsertServiceLog>): Promise<ServiceLog | undefined>;
  markServiceLogAsPaid(id: number, userId: string): Promise<ServiceLog | undefined>;
  deleteServiceLog(id: number, userId: string): Promise<void>;

  // Reminders
  getReminders(userId: string, clientId?: number): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder & { userId: string }): Promise<Reminder>;
  updateReminder(id: number, userId: string, updates: Partial<InsertReminder>): Promise<Reminder | undefined>;
  deleteReminder(id: number, userId: string): Promise<void>;

  // Quick Photos
  getQuickPhotos(userId: string, clientId?: number): Promise<QuickPhoto[]>;
  createQuickPhoto(photo: InsertQuickPhoto & { userId: string }): Promise<QuickPhoto>;
  deleteQuickPhoto(id: number, userId: string): Promise<void>;

  // Purchase Categories
  getPurchaseCategories(userId: string): Promise<PurchaseCategory[]>;
  createPurchaseCategory(category: InsertPurchaseCategory & { userId: string }): Promise<PurchaseCategory>;
  updatePurchaseCategory(id: number, userId: string, updates: Partial<InsertPurchaseCategory>): Promise<PurchaseCategory | undefined>;
  deletePurchaseCategory(id: number, userId: string): Promise<void>;
  initializeDefaultCategories(userId: string): Promise<void>;

  // Stores
  getStores(userId: string): Promise<Store[]>;
  getStore(id: number, userId: string): Promise<Store | undefined>;
  createStore(store: InsertStore & { userId: string }): Promise<Store>;
  updateStore(id: number, userId: string, updates: Partial<InsertStore>): Promise<Store | undefined>;
  deleteStore(id: number, userId: string): Promise<void>;

  // Purchases
  getPurchases(userId: string, categoryId?: number, storeId?: number): Promise<PurchaseWithDetails[]>;
  createPurchase(purchase: InsertPurchase & { userId: string }): Promise<Purchase>;
  updatePurchase(id: number, userId: string, updates: Partial<InsertPurchase>): Promise<Purchase | undefined>;
  deletePurchase(id: number, userId: string): Promise<void>;
  checkInvoiceExists(invoiceNumber: string, userId: string): Promise<boolean>;
  getPurchasesByInvoice(invoiceNumber: string, userId: string): Promise<PurchaseWithDetails[]>;
  getDistinctItemsByCategory(category: string, userId: string): Promise<Array<{ productName: string; latestPurchaseId: number }>>;
  getPurchasesByProductName(productName: string, userId: string): Promise<PurchaseWithDetails[]>;

  // Client Payments
  getClientPayments(userId: string, year?: number, month?: number): Promise<ClientPaymentWithClient[]>;
  getClientPayment(id: number, userId: string): Promise<ClientPayment | undefined>;
  createClientPayment(payment: InsertClientPayment & { userId: string }): Promise<ClientPayment>;
  updateClientPayment(id: number, userId: string, updates: Partial<InsertClientPayment>): Promise<ClientPayment | undefined>;
  markPaymentAsPaid(id: number, userId: string): Promise<ClientPayment | undefined>;
  deleteClientPayment(id: number, userId: string): Promise<void>;
  generateMonthlyPayments(userId: string, year: number, month: number): Promise<ClientPayment[]>;

  // Service Visits
  getServiceVisits(userId: string, clientId?: number): Promise<ServiceVisitWithServices[]>;
  createServiceVisit(
    visit: InsertServiceVisit & { userId: string },
    services: Omit<InsertServiceVisitService, 'visitId'>[]
  ): Promise<ServiceVisitWithServices>;
  getClientServiceStats(userId: string, clientId: number): Promise<ClientServiceStats | undefined>;
  completeServiceVisit(id: number, data: { endTime: Date; actualDurationMinutes: number; appointmentId?: number }): Promise<ServiceVisit>;
  deleteServiceVisit(id: number): Promise<void>;

  // Financial Config
  getFinancialConfig(userId: string): Promise<FinancialConfig | undefined>;
  createOrUpdateFinancialConfig(userId: string, config: InsertFinancialConfig): Promise<FinancialConfig>;

  // Monthly Distributions
  getMonthlyDistributions(userId: string, year?: number): Promise<MonthlyDistribution[]>;
  getMonthlyDistribution(userId: string, year: number, month: number): Promise<MonthlyDistribution | undefined>;
  calculateAndSaveDistribution(userId: string, year: number, month: number): Promise<MonthlyDistribution>;
  updateMonthlyDistribution(id: number, userId: string, updates: Partial<InsertMonthlyDistribution>): Promise<MonthlyDistribution | undefined>;

  // Employees
  getEmployees(userId: string, includeInactive?: boolean): Promise<Employee[]>;
  getEmployee(id: number, userId: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee & { userId: string }): Promise<Employee>;
  updateEmployee(id: number, userId: string, updates: Partial<InsertEmployee>): Promise<Employee | undefined>;
  toggleEmployeeActive(id: number, userId: string): Promise<Employee | undefined>;
  deleteEmployee(id: number, userId: string): Promise<void>;

  // Pending Tasks
  getPendingTasks(userId: string, clientId?: number, includeCompleted?: boolean): Promise<PendingTaskWithClient[]>;
  getPendingTask(id: number, userId: string): Promise<PendingTask | undefined>;
  createPendingTask(task: InsertPendingTask & { userId: string }): Promise<PendingTask>;
  updatePendingTask(id: number, userId: string, updates: Partial<InsertPendingTask>): Promise<PendingTask | undefined>;
  completePendingTask(id: number, userId: string, serviceLogId?: number): Promise<PendingTask | undefined>;
  deletePendingTask(id: number, userId: string): Promise<void>;
  getPendingTasksCount(userId: string): Promise<number>;
  
  // Suggested Works
  getSuggestedWorks(userId: string, clientId?: number, includeCompleted?: boolean): Promise<SuggestedWorkWithClient[]>;
  getSuggestedWork(id: number, userId: string): Promise<SuggestedWork | undefined>;
  createSuggestedWork(work: InsertSuggestedWork & { userId: string }): Promise<SuggestedWork>;
  updateSuggestedWork(id: number, userId: string, updates: Partial<InsertSuggestedWork>): Promise<SuggestedWork | undefined>;
  deleteSuggestedWork(id: number, userId: string): Promise<void>;

  // Expense Notes
  getExpenseNotes(userId: string, clientId?: number): Promise<ExpenseNoteWithDetails[]>;
  getExpenseNote(id: number, userId: string): Promise<ExpenseNoteWithDetails | undefined>;
  createExpenseNote(note: Omit<InsertExpenseNote, 'noteNumber'> & { userId: string }, items: Omit<InsertExpenseNoteItem, 'expenseNoteId'>[]): Promise<ExpenseNoteWithDetails>;
  updateExpenseNote(id: number, userId: string, updates: Partial<InsertExpenseNote>): Promise<ExpenseNote | undefined>;
  updateExpenseNoteItems(noteId: number, userId: string, items: Omit<InsertExpenseNoteItem, 'expenseNoteId'>[]): Promise<ExpenseNoteItem[]>;
  deleteExpenseNote(id: number, userId: string): Promise<void>;
  generateNoteNumber(userId: string): Promise<string>;
  createExpenseNoteEdit(expenseNoteId: number, userId: string, fieldChanged: string, reason: string): Promise<void>;

  // Quotes
  getQuotes(userId: string, clientId?: number): Promise<QuoteWithDetails[]>;
  getQuote(id: number, userId: string): Promise<QuoteWithDetails | undefined>;
  createQuote(quote: InsertQuote & { userId: string }, items: Omit<InsertQuoteItem, 'quoteId'>[]): Promise<QuoteWithDetails>;
  updateQuote(id: number, userId: string, updates: Partial<InsertQuote>): Promise<Quote | undefined>;
  updateQuoteItems(quoteId: number, userId: string, items: Omit<InsertQuoteItem, 'quoteId'>[]): Promise<QuoteItem[]>;
  deleteQuote(id: number, userId: string): Promise<void>;
  generateQuoteNumber(userId: string): Promise<string>;

  // User Preferences
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  upsertUserPreferences(userId: string, prefs: UpdateWorkingHours): Promise<UserPreferences>;

  // Clients (extra)
  getClientForUser(id: number, userId: string): Promise<Client | undefined>;

  // Shopping List
  getShoppingList(userId: string): Promise<ShoppingListItem[]>;
  createShoppingListItem(item: InsertShoppingListItem & { userId: string }): Promise<ShoppingListItem>;
  updateShoppingListItem(id: number, userId: string, updates: Partial<InsertShoppingListItem>): Promise<ShoppingListItem | undefined>;
  deleteShoppingListItem(id: number, userId: string): Promise<void>;
  toggleShoppingListItemStatus(id: number, userId: string): Promise<ShoppingListItem | undefined>;

  // Pool Equipment
  getPoolEquipment(clientId: number): Promise<PoolEquipment[]>;
  getPoolEquipmentForUser(id: number, userId: string): Promise<PoolEquipment | undefined>;
  createPoolEquipment(data: InsertPoolEquipment & { clientId: number }): Promise<PoolEquipment>;
  updatePoolEquipment(id: number, data: Partial<InsertPoolEquipment>): Promise<PoolEquipment | undefined>;
  deletePoolEquipment(id: number, userId: string): Promise<void>;

  // Client Equipment
  getClientEquipment(clientId: number, userId: string): Promise<ClientEquipment[]>;
  createClientEquipment(data: InsertClientEquipment & { clientId: number; userId: string }): Promise<ClientEquipment>;
  updateClientEquipment(id: number, userId: string, data: Partial<InsertClientEquipment>): Promise<ClientEquipment | undefined>;
  deleteClientEquipment(id: number, userId: string): Promise<void>;

  // Client Documents
  getClientDocuments(clientId: number, userId: string): Promise<ClientDocument[]>;
  createClientDocument(data: InsertClientDocument & { clientId: number; userId: string }): Promise<ClientDocument>;
  updateClientDocument(id: number, userId: string, data: Partial<InsertClientDocument>): Promise<ClientDocument | undefined>;
  deleteClientDocument(id: number, userId: string): Promise<ClientDocument | undefined>;

  // Pool Photos
  getPoolPhotos(clientId: number, equipmentId?: number): Promise<PoolPhoto[]>;
  createPoolPhoto(data: InsertPoolPhoto & { clientId: number }): Promise<PoolPhoto>;
  deletePoolPhoto(id: number, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Clients
  async getClients(userId: string): Promise<Client[]> {
    return await db.select().from(clients).where(eq(clients.userId, userId));
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async getClientForUser(id: number, userId: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.userId, userId)));
    return client;
  }

  async createClient(client: InsertClient & { userId: string }): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: number, userId: string, updates: Partial<InsertClient>): Promise<Client | undefined> {
    const [updated] = await db
      .update(clients)
      .set(updates)
      .where(and(eq(clients.id, id), eq(clients.userId, userId)))
      .returning();
    return updated;
  }

  async deleteClient(id: number, userId: string): Promise<void> {
    await db.delete(clients).where(and(eq(clients.id, id), eq(clients.userId, userId)));
  }

  async getClientsProfitability(userId: string): Promise<ClientProfitabilityData[]> {
    const userClients = await this.getClients(userId);
    const results: ClientProfitabilityData[] = [];

    for (const client of userClients) {
      const payments = await db
        .select()
        .from(clientPayments)
        .where(and(
          eq(clientPayments.clientId, client.id),
          eq(clientPayments.userId, userId),
          eq(clientPayments.isPaid, true)
        ));
      const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);

      const visits = await db
        .select()
        .from(serviceVisits)
        .where(and(
          eq(serviceVisits.clientId, client.id),
          eq(serviceVisits.userId, userId),
          eq(serviceVisits.status, "concluida")
        ));
      const totalVisits = visits.length;
      const totalWorkerHours = visits.reduce(
        (sum, v) => sum + ((v.actualDurationMinutes ?? 0) * v.workerCount) / 60,
        0
      );

      const logs = await db
        .select()
        .from(serviceLogs)
        .where(and(
          eq(serviceLogs.clientId, client.id),
          eq(serviceLogs.userId, userId)
        ));

      let totalLaborCost = 0;
      for (const log of logs) {
        const laborEntries = await db
          .select()
          .from(serviceLogLaborEntries)
          .where(eq(serviceLogLaborEntries.serviceLogId, log.id));
        totalLaborCost += laborEntries.reduce((sum, e) => {
          const payRate = e.hourlyPayRate ?? e.hourlyRate;
          return sum + (e.hours * payRate);
        }, 0);
      }

      const grossMargin = totalReceived - totalLaborCost;
      const grossMarginPercent = totalReceived > 0
        ? Math.round((grossMargin / totalReceived) * 1000) / 10
        : null;

      results.push({
        clientId: client.id,
        clientName: client.name,
        billingType: client.billingType ?? "monthly",
        monthlyRate: client.monthlyRate ?? null,
        totalReceived: Math.round(totalReceived * 100) / 100,
        totalVisits,
        totalWorkerHours: Math.round(totalWorkerHours * 10) / 10,
        totalLaborCost: Math.round(totalLaborCost * 100) / 100,
        grossMargin: Math.round(grossMargin * 100) / 100,
        grossMarginPercent,
      });
    }

    return results.sort((a, b) => b.grossMargin - a.grossMargin);
  }

  // Appointments
  async getAppointments(userId: string, clientId?: number): Promise<Appointment[]> {
    const conditions = [eq(appointments.userId, userId)];
    if (clientId) conditions.push(eq(appointments.clientId, clientId));
    
    return await db
      .select()
      .from(appointments)
      .where(and(...conditions))
      .orderBy(desc(appointments.date));
  }

  async createAppointment(appointment: InsertAppointment & { userId: string }): Promise<Appointment> {
    const [newAppt] = await db.insert(appointments).values(appointment).returning();
    return newAppt;
  }

  async updateAppointment(id: number, userId: string, updates: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const [updated] = await db
      .update(appointments)
      .set(updates)
      .where(and(eq(appointments.id, id), eq(appointments.userId, userId)))
      .returning();
    return updated;
  }

  async deleteAppointment(id: number, userId: string): Promise<void> {
    await db.delete(appointments).where(and(eq(appointments.id, id), eq(appointments.userId, userId)));
  }

  async generateAppointmentPreview(userId: string, year: number, month: number): Promise<AppointmentPreview[]> {
    const userClients = await this.getClients(userId);
    const existingAppointments = await db
      .select()
      .from(appointments)
      .where(eq(appointments.userId, userId));

    const isHighSeason = month >= 4 && month <= 9;
    const previews: AppointmentPreview[] = [];

    const getDaysForVisits = (count: number, y: number, m: number): string[] => {
      const daysInMonth = new Date(y, m, 0).getDate();
      const fmt = (d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (count === 1) return [fmt(Math.round(daysInMonth / 2))];
      if (count === 2) return [fmt(8), fmt(22)];
      if (count === 4) return [7, 14, 21, 28].map(d => fmt(d));
      return [];
    };

    const hasExisting = (clientId: number, type: string): boolean => {
      return existingAppointments.some(a => {
        const d = new Date(a.date);
        return (
          a.clientId === clientId &&
          a.type === type &&
          d.getFullYear() === year &&
          d.getMonth() + 1 === month
        );
      });
    };

    for (const client of userClients) {
      if (client.hasGarden && client.gardenVisitFrequency !== 'on_demand') {
        if (!hasExisting(client.id, 'Garden')) {
          let count = 0;
          let reason = '';
          if (client.gardenVisitFrequency === 'once_monthly') {
            count = 1;
            reason = 'Jardim — acordo especial 1x/mês';
          } else {
            count = isHighSeason ? 2 : 1;
            reason = isHighSeason ? 'Jardim sazonal — época alta 2x/mês' : 'Jardim sazonal — época baixa 1x/mês';
          }
          const days = getDaysForVisits(count, year, month);
          days.forEach(date => {
            previews.push({ clientId: client.id, clientName: client.name, date, type: 'Garden', reason });
          });
        }
      }

      if (client.hasPool && client.poolVisitFrequency !== 'on_demand') {
        if (!hasExisting(client.id, 'Pool')) {
          let count = 0;
          let reason = '';
          if (client.poolVisitFrequency === 'once_monthly') {
            count = 2;
            reason = 'Piscina — 2x/mês';
          } else {
            count = isHighSeason ? 4 : 2;
            reason = isHighSeason ? 'Piscina sazonal — época alta 4x/mês' : 'Piscina sazonal — época baixa 2x/mês';
          }
          const days = getDaysForVisits(count, year, month);
          days.forEach(date => {
            previews.push({ clientId: client.id, clientName: client.name, date, type: 'Pool', reason });
          });
        }
      }

      if (client.hasJacuzzi && client.jacuzziVisitFrequency !== 'on_demand') {
        if (!hasExisting(client.id, 'Jacuzzi')) {
          let count = 0;
          let reason = '';
          if (client.jacuzziVisitFrequency === 'once_monthly') {
            count = 2;
            reason = 'Jacuzzi — 2x/mês';
          } else {
            count = isHighSeason ? 4 : 2;
            reason = isHighSeason ? 'Jacuzzi sazonal — época alta 4x/mês' : 'Jacuzzi sazonal — época baixa 2x/mês';
          }
          const days = getDaysForVisits(count, year, month);
          days.forEach(date => {
            previews.push({ clientId: client.id, clientName: client.name, date, type: 'Jacuzzi', reason });
          });
        }
      }
    }

    return previews.sort((a, b) => a.date.localeCompare(b.date));
  }

  async confirmAppointments(userId: string, appts: AppointmentPreview[]): Promise<number> {
    let created = 0;
    for (const appt of appts) {
      const date = new Date(appt.date);
      await db.insert(appointments).values({
        userId,
        clientId: appt.clientId,
        date,
        type: appt.type,
        notes: appt.reason,
        isCompleted: false,
      });
      created++;
    }
    return created;
  }

  // Service Logs
  async getServiceLogs(userId: string, clientId?: number): Promise<ServiceLog[]> {
    const conditions = [eq(serviceLogs.userId, userId)];
    if (clientId) conditions.push(eq(serviceLogs.clientId, clientId));
    
    return await db
      .select()
      .from(serviceLogs)
      .where(and(...conditions))
      .orderBy(desc(serviceLogs.date));
  }

  async getServiceLogWithEntries(id: number, userId: string): Promise<ServiceLogWithEntries | undefined> {
    const [log] = await db
      .select()
      .from(serviceLogs)
      .where(and(eq(serviceLogs.id, id), eq(serviceLogs.userId, userId)));
    
    if (!log) return undefined;

    const laborEntriesList = await db
      .select()
      .from(serviceLogLaborEntries)
      .where(eq(serviceLogLaborEntries.serviceLogId, id));

    const materialEntriesList = await db
      .select()
      .from(serviceLogMaterialEntries)
      .where(eq(serviceLogMaterialEntries.serviceLogId, id));

    return {
      ...log,
      laborEntries: laborEntriesList,
      materialEntries: materialEntriesList,
    };
  }

  async getUnpaidExtraServices(userId: string): Promise<(ServiceLog & { clientName: string })[]> {
    const result = await db
      .select({
        serviceLog: serviceLogs,
        clientName: clients.name,
      })
      .from(serviceLogs)
      .innerJoin(clients, eq(serviceLogs.clientId, clients.id))
      .where(and(
        eq(serviceLogs.userId, userId),
        eq(serviceLogs.billingType, 'extra'),
        eq(serviceLogs.isPaymentCollected, false)
      ))
      .orderBy(desc(serviceLogs.date));
    
    return result.map(r => ({
      ...r.serviceLog,
      clientName: r.clientName,
    }));
  }

  async createServiceLogWithEntries(
    log: InsertServiceLog & { userId: string },
    laborEntries: Omit<InsertServiceLogLaborEntry, 'serviceLogId' | 'cost'>[],
    materialEntries: Omit<InsertServiceLogMaterialEntry, 'serviceLogId' | 'cost'>[]
  ): Promise<ServiceLogWithEntries> {
    // Recalculate costs server-side for data integrity (round to 2 decimal places)
    const roundToTwo = (n: number) => Math.round(n * 100) / 100;
    
    const calculatedLaborEntries = laborEntries.map(entry => ({
      ...entry,
      cost: roundToTwo(Number(entry.hours || 0) * Number(entry.hourlyRate || 0)),
    }));
    
    const calculatedMaterialEntries = materialEntries.map(entry => ({
      ...entry,
      cost: roundToTwo(Number(entry.quantity || 0) * Number(entry.unitPrice || 0)),
    }));
    
    // Calculate subtotals from recalculated costs (rounded for consistency)
    const laborSubtotal = roundToTwo(calculatedLaborEntries.reduce((sum, entry) => sum + entry.cost, 0));
    const materialsSubtotal = roundToTwo(calculatedMaterialEntries.reduce((sum, entry) => sum + entry.cost, 0));
    const totalAmount = roundToTwo(laborSubtotal + materialsSubtotal);

    // Create service log with calculated totals
    const [newLog] = await db.insert(serviceLogs).values({
      ...log,
      laborSubtotal,
      materialsSubtotal,
      totalAmount,
    }).returning();

    // Insert labor entries with server-calculated costs
    const createdLaborEntries: ServiceLogLaborEntry[] = [];
    for (const entry of calculatedLaborEntries) {
      const [newEntry] = await db.insert(serviceLogLaborEntries).values({
        ...entry,
        serviceLogId: newLog.id,
      }).returning();
      createdLaborEntries.push(newEntry);
    }

    // Insert material entries with server-calculated costs
    const createdMaterialEntries: ServiceLogMaterialEntry[] = [];
    for (const entry of calculatedMaterialEntries) {
      const [newEntry] = await db.insert(serviceLogMaterialEntries).values({
        ...entry,
        serviceLogId: newLog.id,
      }).returning();
      createdMaterialEntries.push(newEntry);
    }

    return {
      ...newLog,
      laborEntries: createdLaborEntries,
      materialEntries: createdMaterialEntries,
    };
  }

  async updateServiceLog(id: number, userId: string, updates: Partial<InsertServiceLog>): Promise<ServiceLog | undefined> {
    const [updated] = await db
      .update(serviceLogs)
      .set(updates)
      .where(and(eq(serviceLogs.id, id), eq(serviceLogs.userId, userId)))
      .returning();
    return updated;
  }

  async markServiceLogAsPaid(id: number, userId: string): Promise<ServiceLog | undefined> {
    const [updated] = await db
      .update(serviceLogs)
      .set({ isPaymentCollected: true })
      .where(and(eq(serviceLogs.id, id), eq(serviceLogs.userId, userId)))
      .returning();
    return updated;
  }

  async deleteServiceLog(id: number, userId: string): Promise<void> {
    // Delete related entries first
    await db.delete(serviceLogLaborEntries).where(eq(serviceLogLaborEntries.serviceLogId, id));
    await db.delete(serviceLogMaterialEntries).where(eq(serviceLogMaterialEntries.serviceLogId, id));
    // Then delete the service log
    await db.delete(serviceLogs).where(and(eq(serviceLogs.id, id), eq(serviceLogs.userId, userId)));
  }

  // Reminders
  async getReminders(userId: string, clientId?: number): Promise<Reminder[]> {
    const conditions = [eq(reminders.userId, userId)];
    if (clientId) conditions.push(eq(reminders.clientId, clientId));
    
    return await db
      .select()
      .from(reminders)
      .where(and(...conditions))
      .orderBy(desc(reminders.nextDue));
  }

  async createReminder(reminder: InsertReminder & { userId: string }): Promise<Reminder> {
    const [newReminder] = await db.insert(reminders).values(reminder).returning();
    return newReminder;
  }

  async updateReminder(id: number, userId: string, updates: Partial<InsertReminder>): Promise<Reminder | undefined> {
    const [updated] = await db
      .update(reminders)
      .set(updates)
      .where(and(eq(reminders.id, id), eq(reminders.userId, userId)))
      .returning();
    return updated;
  }

  async deleteReminder(id: number, userId: string): Promise<void> {
    await db.delete(reminders).where(and(eq(reminders.id, id), eq(reminders.userId, userId)));
  }

  // Quick Photos
  async getQuickPhotos(userId: string, clientId?: number): Promise<QuickPhoto[]> {
    const conditions = [eq(quickPhotos.userId, userId)];
    if (clientId) conditions.push(eq(quickPhotos.clientId, clientId));
    
    return await db
      .select()
      .from(quickPhotos)
      .where(and(...conditions))
      .orderBy(desc(quickPhotos.createdAt));
  }

  async createQuickPhoto(photo: InsertQuickPhoto & { userId: string }): Promise<QuickPhoto> {
    const [newPhoto] = await db.insert(quickPhotos).values(photo).returning();
    return newPhoto;
  }

  async deleteQuickPhoto(id: number, userId: string): Promise<void> {
    await db.delete(quickPhotos).where(and(eq(quickPhotos.id, id), eq(quickPhotos.userId, userId)));
  }

  // Purchase Categories
  async getPurchaseCategories(userId: string): Promise<PurchaseCategory[]> {
    return await db
      .select()
      .from(purchaseCategories)
      .where(eq(purchaseCategories.userId, userId))
      .orderBy(purchaseCategories.name);
  }

  async createPurchaseCategory(category: InsertPurchaseCategory & { userId: string }): Promise<PurchaseCategory> {
    const [newCategory] = await db.insert(purchaseCategories).values(category).returning();
    return newCategory;
  }

  async updatePurchaseCategory(id: number, userId: string, updates: Partial<InsertPurchaseCategory>): Promise<PurchaseCategory | undefined> {
    const [updated] = await db
      .update(purchaseCategories)
      .set(updates)
      .where(and(eq(purchaseCategories.id, id), eq(purchaseCategories.userId, userId)))
      .returning();
    return updated;
  }

  async deletePurchaseCategory(id: number, userId: string): Promise<void> {
    await db.delete(purchaseCategories).where(and(eq(purchaseCategories.id, id), eq(purchaseCategories.userId, userId)));
  }

  async initializeDefaultCategories(userId: string): Promise<void> {
    const existing = await this.getPurchaseCategories(userId);
    if (existing.length > 0) return;

    const defaultCategories = [
      'Jardim',
      'Rega',
      'Piscina',
      'Jacuzzi',
      'Fitofarmacêuticos',
      'Combustíveis',
      'Máquinas',
    ];

    for (const name of defaultCategories) {
      await db.insert(purchaseCategories).values({
        userId,
        name,
        isDefault: true,
      });
    }
  }

  // Stores
  async getStores(userId: string): Promise<Store[]> {
    return await db
      .select()
      .from(stores)
      .where(eq(stores.userId, userId))
      .orderBy(stores.name);
  }

  async getStore(id: number, userId: string): Promise<Store | undefined> {
    const [store] = await db
      .select()
      .from(stores)
      .where(and(eq(stores.id, id), eq(stores.userId, userId)));
    return store;
  }

  async createStore(store: InsertStore & { userId: string }): Promise<Store> {
    const [newStore] = await db.insert(stores).values(store).returning();
    return newStore;
  }

  async updateStore(id: number, userId: string, updates: Partial<InsertStore>): Promise<Store | undefined> {
    const [updated] = await db
      .update(stores)
      .set(updates)
      .where(and(eq(stores.id, id), eq(stores.userId, userId)))
      .returning();
    return updated;
  }

  async deleteStore(id: number, userId: string): Promise<void> {
    await db.delete(stores).where(and(eq(stores.id, id), eq(stores.userId, userId)));
  }

  // Purchases
  async getPurchases(userId: string, categoryId?: number, storeId?: number): Promise<PurchaseWithDetails[]> {
    const conditions = [eq(purchases.userId, userId)];
    if (categoryId) conditions.push(eq(purchases.categoryId, categoryId));
    if (storeId) conditions.push(eq(purchases.storeId, storeId));

    const result = await db
      .select({
        purchase: purchases,
        store: stores,
        category: purchaseCategories,
        client: clients,
      })
      .from(purchases)
      .innerJoin(stores, and(eq(purchases.storeId, stores.id), eq(stores.userId, userId)))
      .innerJoin(purchaseCategories, and(eq(purchases.categoryId, purchaseCategories.id), eq(purchaseCategories.userId, userId)))
      .leftJoin(clients, and(eq(purchases.clientId, clients.id), eq(clients.userId, purchases.userId)))
      .where(and(...conditions))
      .orderBy(desc(purchases.purchaseDate));

    return result.map(r => ({
      ...r.purchase,
      store: r.store,
      category: r.category,
      client: r.client,
    }));
  }

  async checkInvoiceExists(invoiceNumber: string, userId: string): Promise<boolean> {
    const [existing] = await db
      .select({ id: purchases.id })
      .from(purchases)
      .where(
        and(
          eq(purchases.invoiceNumber, invoiceNumber),
          eq(purchases.userId, userId)
        )
      )
      .limit(1);
    return !!existing;
  }

  async createPurchase(purchase: InsertPurchase & { userId: string }): Promise<Purchase> {
    // Validate that clientId belongs to the same user if provided
    if (purchase.clientId) {
      const [client] = await db.select().from(clients).where(
        and(eq(clients.id, purchase.clientId), eq(clients.userId, purchase.userId))
      );
      if (!client) {
        throw new Error("Cliente não encontrado ou não autorizado");
      }
    }
    const [newPurchase] = await db.insert(purchases).values(purchase).returning();
    return newPurchase;
  }

  async updatePurchase(id: number, userId: string, updates: Partial<InsertPurchase>): Promise<Purchase | undefined> {
    // Validate that clientId belongs to the same user if provided
    if (updates.clientId) {
      const [client] = await db.select().from(clients).where(
        and(eq(clients.id, updates.clientId), eq(clients.userId, userId))
      );
      if (!client) {
        throw new Error("Cliente não encontrado ou não autorizado");
      }
    }
    // Validate that storeId belongs to the same user if provided
    if (updates.storeId) {
      const [store] = await db.select().from(stores).where(
        and(eq(stores.id, updates.storeId), eq(stores.userId, userId))
      );
      if (!store) {
        throw new Error("Fornecedor não encontrado ou não autorizado");
      }
    }
    // Validate that categoryId belongs to the same user if provided
    if (updates.categoryId) {
      const [category] = await db.select().from(purchaseCategories).where(
        and(eq(purchaseCategories.id, updates.categoryId), eq(purchaseCategories.userId, userId))
      );
      if (!category) {
        throw new Error("Categoria não encontrada ou não autorizada");
      }
    }
    const [updated] = await db
      .update(purchases)
      .set(updates)
      .where(and(eq(purchases.id, id), eq(purchases.userId, userId)))
      .returning();
    return updated;
  }

  async deletePurchase(id: number, userId: string): Promise<void> {
    await db.delete(purchases).where(and(eq(purchases.id, id), eq(purchases.userId, userId)));
  }

  async getPurchasesByInvoice(invoiceNumber: string, userId: string): Promise<PurchaseWithDetails[]> {
    const result = await db
      .select({
        purchase: purchases,
        store: stores,
        category: purchaseCategories,
        client: clients,
      })
      .from(purchases)
      .innerJoin(stores, and(eq(purchases.storeId, stores.id), eq(stores.userId, userId)))
      .innerJoin(purchaseCategories, and(eq(purchases.categoryId, purchaseCategories.id), eq(purchaseCategories.userId, userId)))
      .leftJoin(clients, and(eq(purchases.clientId, clients.id), eq(clients.userId, purchases.userId)))
      .where(and(eq(purchases.invoiceNumber, invoiceNumber), eq(purchases.userId, userId)))
      .orderBy(desc(purchases.purchaseDate));

    return result.map(r => ({
      ...r.purchase,
      store: r.store,
      category: r.category,
      client: r.client,
    }));
  }

  async getDistinctItemsByCategory(category: string, userId: string): Promise<Array<{ productName: string; latestPurchaseId: number }>> {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const result = await db
      .select({
        productName: purchases.productName,
        latestPurchaseId: purchases.id,
        purchaseDate: purchases.purchaseDate,
      })
      .from(purchases)
      .innerJoin(purchaseCategories, eq(purchases.categoryId, purchaseCategories.id))
      .where(and(
        eq(purchases.userId, userId),
        eq(purchaseCategories.name, category),
        sql`${purchases.purchaseDate} > ${oneYearAgo}`
      ))
      .orderBy(purchases.productName, desc(purchases.purchaseDate));

    const grouped = new Map<string, number>();
    result.forEach(row => {
      if (!grouped.has(row.productName)) {
        grouped.set(row.productName, row.latestPurchaseId);
      }
    });

    return Array.from(grouped.entries()).map(([productName, latestPurchaseId]) => ({
      productName,
      latestPurchaseId,
    }));
  }

  async getPurchasesByProductName(productName: string, userId: string): Promise<PurchaseWithDetails[]> {
    const result = await db
      .select({
        purchase: purchases,
        store: stores,
        category: purchaseCategories,
        client: clients,
      })
      .from(purchases)
      .innerJoin(stores, eq(purchases.storeId, stores.id))
      .innerJoin(purchaseCategories, eq(purchases.categoryId, purchaseCategories.id))
      .leftJoin(clients, and(eq(purchases.clientId, clients.id), eq(clients.userId, purchases.userId)))
      .where(and(eq(purchases.productName, productName), eq(purchases.userId, userId)))
      .orderBy(desc(purchases.purchaseDate));

    return result.map(r => ({
      ...r.purchase,
      store: r.store,
      category: r.category,
      client: r.client,
    }));
  }

  // Client Payments
  async getClientPayments(userId: string, year?: number, month?: number): Promise<ClientPaymentWithClient[]> {
    const conditions = [eq(clientPayments.userId, userId)];
    if (year) conditions.push(eq(clientPayments.year, year));
    if (month) conditions.push(eq(clientPayments.month, month));

    const result = await db
      .select({
        payment: clientPayments,
        client: clients,
      })
      .from(clientPayments)
      .innerJoin(clients, and(eq(clientPayments.clientId, clients.id), eq(clients.userId, clientPayments.userId)))
      .where(and(...conditions))
      .orderBy(desc(clientPayments.year), desc(clientPayments.month), clientPayments.clientId);

    return result.map(r => ({
      ...r.payment,
      client: r.client,
    }));
  }

  async getClientPayment(id: number, userId: string): Promise<ClientPayment | undefined> {
    const [payment] = await db
      .select()
      .from(clientPayments)
      .where(and(eq(clientPayments.id, id), eq(clientPayments.userId, userId)));
    return payment;
  }

  async createClientPayment(payment: InsertClientPayment & { userId: string }): Promise<ClientPayment> {
    const [newPayment] = await db.insert(clientPayments).values(payment).returning();
    return newPayment;
  }

  async updateClientPayment(id: number, userId: string, updates: Partial<InsertClientPayment>): Promise<ClientPayment | undefined> {
    const [updated] = await db
      .update(clientPayments)
      .set(updates)
      .where(and(eq(clientPayments.id, id), eq(clientPayments.userId, userId)))
      .returning();
    return updated;
  }

  async markPaymentAsPaid(id: number, userId: string): Promise<ClientPayment | undefined> {
    const [updated] = await db
      .update(clientPayments)
      .set({ isPaid: true, paidAt: new Date() })
      .where(and(eq(clientPayments.id, id), eq(clientPayments.userId, userId)))
      .returning();
    return updated;
  }

  async deleteClientPayment(id: number, userId: string): Promise<void> {
    await db.delete(clientPayments).where(and(eq(clientPayments.id, id), eq(clientPayments.userId, userId)));
  }

  async generateMonthlyPayments(userId: string, year: number, month: number): Promise<ClientPayment[]> {
    const userClients = await this.getClients(userId);
    const monthlyClients = userClients.filter(c => c.billingType === 'monthly' && c.monthlyRate);
    
    const existingPayments = await db
      .select()
      .from(clientPayments)
      .where(and(
        eq(clientPayments.userId, userId),
        eq(clientPayments.year, year),
        eq(clientPayments.month, month)
      ));
    
    const existingClientIds = new Set(existingPayments.map(p => p.clientId));
    const newPayments: ClientPayment[] = [];
    
    for (const client of monthlyClients) {
      if (!existingClientIds.has(client.id)) {
        const [payment] = await db.insert(clientPayments).values({
          userId,
          clientId: client.id,
          year,
          month,
          amount: client.monthlyRate!,
          isPaid: false,
        }).returning();
        newPayments.push(payment);
      }
    }
    
    return newPayments;
  }

  // Service Visits
  async getServiceVisits(userId: string, clientId?: number): Promise<ServiceVisitWithServices[]> {
    const conditions = [eq(serviceVisits.userId, userId)];
    if (clientId) conditions.push(eq(serviceVisits.clientId, clientId));

    const visits = await db
      .select()
      .from(serviceVisits)
      .where(and(...conditions))
      .orderBy(desc(serviceVisits.visitDate));

    const result: ServiceVisitWithServices[] = [];
    for (const visit of visits) {
      const services = await db
        .select()
        .from(serviceVisitServices)
        .where(eq(serviceVisitServices.visitId, visit.id));
      result.push({ ...visit, services });
    }

    return result;
  }

  async createServiceVisit(
    visit: InsertServiceVisit & { userId: string },
    services: Omit<InsertServiceVisitService, 'visitId'>[]
  ): Promise<ServiceVisitWithServices> {
    const [newVisit] = await db.insert(serviceVisits).values(visit).returning();

    const insertedServices: ServiceVisitService[] = [];
    for (const service of services) {
      const [s] = await db.insert(serviceVisitServices).values({
        ...service,
        visitId: newVisit.id,
      }).returning();
      insertedServices.push(s);
    }

    if (visit.appointmentId && visit.status !== "em_curso") {
      await db
        .update(appointments)
        .set({ isCompleted: true })
        .where(and(
          eq(appointments.id, visit.appointmentId),
          eq(appointments.userId, visit.userId)
        ));
    }

    return { ...newVisit, services: insertedServices };
  }

  async getClientServiceStats(userId: string, clientId: number): Promise<ClientServiceStats | undefined> {
    const visits = await this.getServiceVisits(userId, clientId);

    if (visits.length === 0) return undefined;

    let totalDuration = 0;
    let totalWorkers = 0;
    const serviceBreakdown: Record<string, number> = {};

    for (const visit of visits) {
      totalDuration += visit.actualDurationMinutes ?? 0;
      totalWorkers += visit.workerCount;

      for (const service of visit.services) {
        serviceBreakdown[service.serviceType] = (serviceBreakdown[service.serviceType] || 0) + 1;
      }
    }

    const totalWorkerHours = visits.reduce(
      (sum, v) => sum + ((v.actualDurationMinutes ?? 0) * v.workerCount) / 60,
      0
    );

    return {
      clientId,
      totalVisits: visits.length,
      averageDurationMinutes: Math.round(totalDuration / visits.length),
      averageWorkerCount: Math.round((totalWorkers / visits.length) * 10) / 10,
      totalWorkerHours: Math.round(totalWorkerHours * 10) / 10,
      serviceBreakdown,
    };
  }

  async completeServiceVisit(id: number, data: { endTime: Date; actualDurationMinutes: number; appointmentId?: number }): Promise<ServiceVisit> {
    const [updated] = await db
      .update(serviceVisits)
      .set({
        endTime: data.endTime,
        actualDurationMinutes: data.actualDurationMinutes,
        status: "concluida" as const,
        ...(data.appointmentId ? { appointmentId: data.appointmentId } : {}),
      })
      .where(eq(serviceVisits.id, id))
      .returning();
    return updated;
  }

  async deleteServiceVisit(id: number): Promise<void> {
    await db.delete(serviceVisits).where(eq(serviceVisits.id, id));
  }

  // Financial Config
  async getFinancialConfig(userId: string): Promise<FinancialConfig | undefined> {
    const [config] = await db
      .select()
      .from(financialConfig)
      .where(and(eq(financialConfig.userId, userId), eq(financialConfig.isActive, true)));
    return config;
  }

  async createOrUpdateFinancialConfig(userId: string, config: InsertFinancialConfig): Promise<FinancialConfig> {
    const existing = await this.getFinancialConfig(userId);
    
    if (existing) {
      const [updated] = await db
        .update(financialConfig)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(financialConfig.id, existing.id))
        .returning();
      return updated;
    }
    
    const [newConfig] = await db
      .insert(financialConfig)
      .values({ ...config, userId })
      .returning();
    return newConfig;
  }

  // Monthly Distributions
  async getMonthlyDistributions(userId: string, year?: number): Promise<MonthlyDistribution[]> {
    if (year) {
      return await db
        .select()
        .from(monthlyDistributions)
        .where(and(eq(monthlyDistributions.userId, userId), eq(monthlyDistributions.year, year)))
        .orderBy(desc(monthlyDistributions.month));
    }
    return await db
      .select()
      .from(monthlyDistributions)
      .where(eq(monthlyDistributions.userId, userId))
      .orderBy(desc(monthlyDistributions.year), desc(monthlyDistributions.month));
  }

  async getMonthlyDistribution(userId: string, year: number, month: number): Promise<MonthlyDistribution | undefined> {
    const [dist] = await db
      .select()
      .from(monthlyDistributions)
      .where(and(
        eq(monthlyDistributions.userId, userId),
        eq(monthlyDistributions.year, year),
        eq(monthlyDistributions.month, month)
      ));
    return dist;
  }

  async calculateAndSaveDistribution(userId: string, year: number, month: number): Promise<MonthlyDistribution> {
    // Get current financial config
    const config = await this.getFinancialConfig(userId);
    const salaryPercentage = config?.salaryPercentage ?? 40;
    const companyPercentage = config?.companyPercentage ?? 60;

    // Get all paid payments for the month
    const payments = await this.getClientPayments(userId, year, month);
    const paidPayments = payments.filter(p => p.isPaid);
    const totalReceived = paidPayments.reduce((sum, p) => sum + p.amount, 0);

    // Calculate distribution
    const salaryAmount = Math.round((totalReceived * salaryPercentage / 100) * 100) / 100;
    const companyAmount = Math.round((totalReceived * companyPercentage / 100) * 100) / 100;

    // Check if distribution already exists
    const existing = await this.getMonthlyDistribution(userId, year, month);

    if (existing) {
      // Only update if not locked
      if (!existing.isLocked) {
        const [updated] = await db
          .update(monthlyDistributions)
          .set({
            totalReceived,
            salaryAmount,
            companyAmount,
            salaryPercentageUsed: salaryPercentage,
            updatedAt: new Date()
          })
          .where(eq(monthlyDistributions.id, existing.id))
          .returning();
        return updated;
      }
      return existing;
    }

    // Create new distribution
    const [newDist] = await db
      .insert(monthlyDistributions)
      .values({
        userId,
        year,
        month,
        totalReceived,
        salaryAmount,
        companyAmount,
        salaryPercentageUsed: salaryPercentage
      })
      .returning();
    return newDist;
  }

  async updateMonthlyDistribution(id: number, userId: string, updates: Partial<InsertMonthlyDistribution>): Promise<MonthlyDistribution | undefined> {
    const [updated] = await db
      .update(monthlyDistributions)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(monthlyDistributions.id, id), eq(monthlyDistributions.userId, userId)))
      .returning();
    return updated;
  }

  // Employees
  async getEmployees(userId: string, includeInactive: boolean = false): Promise<Employee[]> {
    if (includeInactive) {
      return await db.select().from(employees).where(eq(employees.userId, userId)).orderBy(desc(employees.createdAt));
    }
    return await db.select().from(employees).where(and(eq(employees.userId, userId), eq(employees.isActive, true))).orderBy(desc(employees.createdAt));
  }

  async getEmployee(id: number, userId: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(and(eq(employees.id, id), eq(employees.userId, userId)));
    return employee;
  }

  async createEmployee(employee: InsertEmployee & { userId: string }): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async updateEmployee(id: number, userId: string, updates: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [updated] = await db
      .update(employees)
      .set(updates)
      .where(and(eq(employees.id, id), eq(employees.userId, userId)))
      .returning();
    return updated;
  }

  async toggleEmployeeActive(id: number, userId: string): Promise<Employee | undefined> {
    const employee = await this.getEmployee(id, userId);
    if (!employee) return undefined;
    
    const [updated] = await db
      .update(employees)
      .set({ isActive: !employee.isActive })
      .where(and(eq(employees.id, id), eq(employees.userId, userId)))
      .returning();
    return updated;
  }

  async deleteEmployee(id: number, userId: string): Promise<void> {
    await db.delete(employees).where(and(eq(employees.id, id), eq(employees.userId, userId)));
  }

  // Pending Tasks
  async getPendingTasks(userId: string, clientId?: number, includeCompleted: boolean = false): Promise<PendingTaskWithClient[]> {
    const conditions = [eq(pendingTasks.userId, userId)];
    if (clientId) conditions.push(eq(pendingTasks.clientId, clientId));
    if (!includeCompleted) conditions.push(eq(pendingTasks.isCompleted, false));

    const tasks = await db
      .select()
      .from(pendingTasks)
      .where(and(...conditions))
      .orderBy(desc(pendingTasks.createdAt));

    // Fetch client details for each task (scoped to the owning user)
    const tasksWithClient: PendingTaskWithClient[] = [];
    for (const task of tasks) {
      const [client] = await db.select().from(clients).where(and(eq(clients.id, task.clientId), eq(clients.userId, userId)));
      if (client) {
        tasksWithClient.push({ ...task, client });
      }
    }
    return tasksWithClient;
  }

  async getPendingTask(id: number, userId: string): Promise<PendingTask | undefined> {
    const [task] = await db.select().from(pendingTasks).where(and(eq(pendingTasks.id, id), eq(pendingTasks.userId, userId)));
    return task;
  }

  async createPendingTask(task: InsertPendingTask & { userId: string }): Promise<PendingTask> {
    const [newTask] = await db.insert(pendingTasks).values(task).returning();
    return newTask;
  }

  async updatePendingTask(id: number, userId: string, updates: Partial<InsertPendingTask>): Promise<PendingTask | undefined> {
    const [updated] = await db
      .update(pendingTasks)
      .set(updates)
      .where(and(eq(pendingTasks.id, id), eq(pendingTasks.userId, userId)))
      .returning();
    return updated;
  }

  async completePendingTask(id: number, userId: string, serviceLogId?: number): Promise<PendingTask | undefined> {
    const [updated] = await db
      .update(pendingTasks)
      .set({ 
        isCompleted: true, 
        completedAt: new Date(),
        serviceLogId: serviceLogId
      })
      .where(and(eq(pendingTasks.id, id), eq(pendingTasks.userId, userId)))
      .returning();
    return updated;
  }

  async deletePendingTask(id: number, userId: string): Promise<void> {
    await db.delete(pendingTasks).where(and(eq(pendingTasks.id, id), eq(pendingTasks.userId, userId)));
  }

  async getPendingTasksCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(pendingTasks)
      .where(and(eq(pendingTasks.userId, userId), eq(pendingTasks.isCompleted, false)));
    return result[0]?.count ?? 0;
  }

  // Suggested Works
  async getSuggestedWorks(userId: string, clientId?: number, includeCompleted: boolean = false): Promise<SuggestedWorkWithClient[]> {
    const conditions = [eq(suggestedWorks.userId, userId)];
    if (clientId) conditions.push(eq(suggestedWorks.clientId, clientId));
    if (!includeCompleted) conditions.push(eq(suggestedWorks.isCompleted, false));

    const works = await db
      .select()
      .from(suggestedWorks)
      .where(and(...conditions))
      .orderBy(desc(suggestedWorks.createdAt));

    const worksWithClients: SuggestedWorkWithClient[] = [];
    for (const work of works) {
      const [client] = await db.select().from(clients).where(and(eq(clients.id, work.clientId), eq(clients.userId, userId)));
      if (client) {
        worksWithClients.push({ ...work, client });
      }
    }
    return worksWithClients;
  }

  async getSuggestedWork(id: number, userId: string): Promise<SuggestedWork | undefined> {
    const [work] = await db
      .select()
      .from(suggestedWorks)
      .where(and(eq(suggestedWorks.id, id), eq(suggestedWorks.userId, userId)));
    return work;
  }

  async createSuggestedWork(work: InsertSuggestedWork & { userId: string }): Promise<SuggestedWork> {
    const [newWork] = await db.insert(suggestedWorks).values(work).returning();
    return newWork;
  }

  async updateSuggestedWork(id: number, userId: string, updates: Partial<InsertSuggestedWork>): Promise<SuggestedWork | undefined> {
    const [updated] = await db
      .update(suggestedWorks)
      .set(updates)
      .where(and(eq(suggestedWorks.id, id), eq(suggestedWorks.userId, userId)))
      .returning();
    return updated;
  }

  async deleteSuggestedWork(id: number, userId: string): Promise<void> {
    await db.delete(suggestedWorks).where(and(eq(suggestedWorks.id, id), eq(suggestedWorks.userId, userId)));
  }

  async generateNoteNumber(userId: string): Promise<string> {
    const year = new Date().getFullYear();
    const existing = await db
      .select()
      .from(expenseNotes)
      .where(
        and(
          eq(expenseNotes.userId, userId),
          sql`EXTRACT(YEAR FROM ${expenseNotes.createdAt}) = ${year}`
        )
      );
    const seq = String(existing.length + 1).padStart(3, "0");
    return `ND-${year}-${seq}`;
  }

  async getExpenseNotes(userId: string, clientId?: number): Promise<ExpenseNoteWithDetails[]> {
    const conditions = [eq(expenseNotes.userId, userId)];
    if (clientId) conditions.push(eq(expenseNotes.clientId, clientId));

    const notes = await db
      .select()
      .from(expenseNotes)
      .where(and(...conditions))
      .orderBy(desc(expenseNotes.createdAt));

    const result: ExpenseNoteWithDetails[] = [];
    for (const note of notes) {
      const [client] = await db
        .select()
        .from(clients)
        .where(and(eq(clients.id, note.clientId), eq(clients.userId, userId)));
      if (!client) continue;

      const items = await db
        .select()
        .from(expenseNoteItems)
        .where(eq(expenseNoteItems.expenseNoteId, note.id));

      let serviceLog = null;
      if (note.serviceLogId) {
        const [log] = await db
          .select()
          .from(serviceLogs)
          .where(and(eq(serviceLogs.id, note.serviceLogId), eq(serviceLogs.userId, userId)));
        serviceLog = log ?? null;
      }

      result.push({ ...note, client, items, serviceLog });
    }
    return result;
  }

  async getExpenseNote(id: number, userId: string): Promise<ExpenseNoteWithDetails | undefined> {
    const [note] = await db
      .select()
      .from(expenseNotes)
      .where(and(eq(expenseNotes.id, id), eq(expenseNotes.userId, userId)));
    if (!note) return undefined;

    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, note.clientId), eq(clients.userId, userId)));
    if (!client) return undefined;

    const items = await db
      .select()
      .from(expenseNoteItems)
      .where(eq(expenseNoteItems.expenseNoteId, note.id));

    let serviceLog = null;
    if (note.serviceLogId) {
      const [log] = await db
        .select()
        .from(serviceLogs)
        .where(and(eq(serviceLogs.id, note.serviceLogId), eq(serviceLogs.userId, userId)));
      serviceLog = log ?? null;
    }

    const edits = await db
      .select()
      .from(expenseNoteEdits)
      .where(eq(expenseNoteEdits.expenseNoteId, note.id))
      .orderBy(desc(expenseNoteEdits.editedAt));

    return { ...note, client, items, serviceLog, edits };
  }

  async createExpenseNote(
    note: Omit<InsertExpenseNote, "noteNumber"> & { userId: string; noteNumber?: string },
    items: Omit<InsertExpenseNoteItem, "expenseNoteId">[]
  ): Promise<ExpenseNoteWithDetails> {
    const noteNumber = note.noteNumber ?? (await this.generateNoteNumber(note.userId));

    const [newNote] = await db
      .insert(expenseNotes)
      .values({ ...note, noteNumber })
      .returning();

    const createdItems: ExpenseNoteItem[] = [];
    for (const item of items) {
      const total = Math.round((item.quantity ?? 0) * (item.unitPrice ?? 0) * 100) / 100;
      const [newItem] = await db
        .insert(expenseNoteItems)
        .values({ ...item, expenseNoteId: newNote.id, total })
        .returning();
      createdItems.push(newItem);
    }

    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, newNote.clientId), eq(clients.userId, note.userId)));

    let serviceLog = null;
    if (newNote.serviceLogId) {
      const [log] = await db
        .select()
        .from(serviceLogs)
        .where(and(eq(serviceLogs.id, newNote.serviceLogId), eq(serviceLogs.userId, note.userId)));
      serviceLog = log ?? null;
    }

    return { ...newNote, client: client!, items: createdItems, serviceLog };
  }

  async updateExpenseNote(
    id: number,
    userId: string,
    updates: Partial<InsertExpenseNote>
  ): Promise<ExpenseNote | undefined> {
    const [existing] = await db
      .select()
      .from(expenseNotes)
      .where(and(eq(expenseNotes.id, id), eq(expenseNotes.userId, userId)));
    if (!existing) return undefined;
    if (existing.status === "emitida") {
      throw new Error("Não é possível editar uma nota já emitida.");
    }

    if (updates.issueDate && typeof updates.issueDate === "string") {
      updates.issueDate = new Date(updates.issueDate);
    }

    const [updated] = await db
      .update(expenseNotes)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(expenseNotes.id, id), eq(expenseNotes.userId, userId)))
      .returning();
    return updated;
  }

  async updateExpenseNoteItems(
    noteId: number,
    userId: string,
    items: Omit<InsertExpenseNoteItem, "expenseNoteId">[]
  ): Promise<ExpenseNoteItem[]> {
    const [note] = await db
      .select()
      .from(expenseNotes)
      .where(and(eq(expenseNotes.id, noteId), eq(expenseNotes.userId, userId)));
    if (!note) throw new Error("Nota não encontrada.");
    if (note.status === "emitida") throw new Error("Não é possível editar itens de uma nota já emitida.");

    await db
      .delete(expenseNoteItems)
      .where(eq(expenseNoteItems.expenseNoteId, noteId));

    const createdItems: ExpenseNoteItem[] = [];
    for (const item of items) {
      const total = Math.round((item.quantity ?? 0) * (item.unitPrice ?? 0) * 100) / 100;
      const [newItem] = await db
        .insert(expenseNoteItems)
        .values({ ...item, expenseNoteId: noteId, total })
        .returning();
      createdItems.push(newItem);
    }
    return createdItems;
  }

  async deleteExpenseNote(id: number, userId: string): Promise<void> {
    // Verificar ownership antes de apagar
    const note = await db
      .select()
      .from(expenseNotes)
      .where(and(eq(expenseNotes.id, id), eq(expenseNotes.userId, userId)))
      .limit(1);

    if (note.length === 0) {
      throw new Error("Nota não encontrada ou sem permissão");
    }

    // Apagar na ordem correcta para evitar foreign key constraint
    await db
      .delete(expenseNoteEdits)
      .where(eq(expenseNoteEdits.expenseNoteId, id));

    await db
      .delete(expenseNoteItems)
      .where(eq(expenseNoteItems.expenseNoteId, id));

    await db
      .delete(expenseNotes)
      .where(and(eq(expenseNotes.id, id), eq(expenseNotes.userId, userId)));
  }

  async createExpenseNoteEdit(
    expenseNoteId: number,
    userId: string,
    fieldChanged: string,
    reason: string
  ): Promise<void> {
    await db.insert(expenseNoteEdits).values({
      expenseNoteId,
      userId,
      fieldChanged,
      reason,
    });
  }

  // ── QUOTES ────────────────────────────────────────────────────

  async generateQuoteNumber(userId: string): Promise<string> {
    const year = new Date().getFullYear();
    const existing = await db
      .select()
      .from(quotes)
      .where(
        and(
          eq(quotes.userId, userId),
          sql`EXTRACT(YEAR FROM ${quotes.createdAt}) = ${year}`
        )
      );
    const seq = String(existing.length + 1).padStart(3, "0");
    return `ORC-${year}-${seq}`;
  }

  async getQuotes(userId: string, clientId?: number): Promise<QuoteWithDetails[]> {
    const conditions = [eq(quotes.userId, userId)];
    if (clientId) conditions.push(eq(quotes.clientId, clientId));

    const rows = await db
      .select()
      .from(quotes)
      .where(and(...conditions))
      .orderBy(desc(quotes.createdAt));

    const result: QuoteWithDetails[] = [];
    for (const quote of rows) {
      const [client] = await db
        .select()
        .from(clients)
        .where(and(eq(clients.id, quote.clientId), eq(clients.userId, userId)));
      if (!client) continue;

      const items = await db
        .select()
        .from(quoteItems)
        .where(eq(quoteItems.quoteId, quote.id));

      result.push({ ...quote, client, items });
    }
    return result;
  }

  async getQuote(id: number, userId: string): Promise<QuoteWithDetails | undefined> {
    const [quote] = await db
      .select()
      .from(quotes)
      .where(and(eq(quotes.id, id), eq(quotes.userId, userId)));
    if (!quote) return undefined;

    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, quote.clientId), eq(clients.userId, userId)));
    if (!client) return undefined;

    const items = await db
      .select()
      .from(quoteItems)
      .where(eq(quoteItems.quoteId, quote.id));

    return { ...quote, client, items };
  }

  async createQuote(
    quote: InsertQuote & { userId: string },
    items: Omit<InsertQuoteItem, "quoteId">[]
  ): Promise<QuoteWithDetails> {
    const quoteNumber = quote.quoteNumber ?? (await this.generateQuoteNumber(quote.userId));

    const [newQuote] = await db
      .insert(quotes)
      .values({ ...quote, quoteNumber })
      .returning();

    const createdItems: QuoteItem[] = [];
    for (const item of items) {
      const total = Math.round((item.quantity ?? 0) * (item.unitPrice ?? 0) * 100) / 100;
      const [newItem] = await db
        .insert(quoteItems)
        .values({ ...item, quoteId: newQuote.id, total })
        .returning();
      createdItems.push(newItem);
    }

    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, newQuote.clientId), eq(clients.userId, quote.userId)));

    return { ...newQuote, client: client!, items: createdItems };
  }

  async updateQuote(
    id: number,
    userId: string,
    updates: Partial<InsertQuote>
  ): Promise<Quote | undefined> {
    const [existing] = await db
      .select()
      .from(quotes)
      .where(and(eq(quotes.id, id), eq(quotes.userId, userId)));
    if (!existing) return undefined;

    if (updates.validUntil && typeof updates.validUntil === "string") {
      updates.validUntil = new Date(updates.validUntil);
    }

    const [updated] = await db
      .update(quotes)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(quotes.id, id), eq(quotes.userId, userId)))
      .returning();
    return updated;
  }

  async updateQuoteItems(
    quoteId: number,
    userId: string,
    items: Omit<InsertQuoteItem, "quoteId">[]
  ): Promise<QuoteItem[]> {
    const [quote] = await db
      .select()
      .from(quotes)
      .where(and(eq(quotes.id, quoteId), eq(quotes.userId, userId)));
    if (!quote) throw new Error("Orçamento não encontrado.");

    await db
      .delete(quoteItems)
      .where(eq(quoteItems.quoteId, quoteId));

    const createdItems: QuoteItem[] = [];
    for (const item of items) {
      const total = Math.round((item.quantity ?? 0) * (item.unitPrice ?? 0) * 100) / 100;
      const [newItem] = await db
        .insert(quoteItems)
        .values({ ...item, quoteId, total })
        .returning();
      createdItems.push(newItem);
    }
    return createdItems;
  }

  async deleteQuote(id: number, userId: string): Promise<void> {
    const row = await db
      .select()
      .from(quotes)
      .where(and(eq(quotes.id, id), eq(quotes.userId, userId)))
      .limit(1);

    if (row.length === 0) throw new Error("Orçamento não encontrado ou sem permissão");

    await db.delete(quoteItems).where(eq(quoteItems.quoteId, id));
    await db.delete(quotes).where(and(eq(quotes.id, id), eq(quotes.userId, userId)));
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return prefs;
  }

  async upsertUserPreferences(
    userId: string,
    prefs: UpdateWorkingHours
  ): Promise<UserPreferences> {
    const [row] = await db
      .insert(userPreferences)
      .values({ userId, ...prefs, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { ...prefs, updatedAt: new Date() },
      })
      .returning();
    return row;
  }

  async getShoppingList(userId: string): Promise<ShoppingListItem[]> {
    return await db.select().from(shoppingList).where(eq(shoppingList.userId, userId)).orderBy(shoppingList.createdAt);
  }

  async createShoppingListItem(item: InsertShoppingListItem & { userId: string }): Promise<ShoppingListItem> {
    const [newItem] = await db.insert(shoppingList).values(item).returning();
    return newItem;
  }

  async updateShoppingListItem(id: number, userId: string, updates: Partial<InsertShoppingListItem>): Promise<ShoppingListItem | undefined> {
    const [updated] = await db
      .update(shoppingList)
      .set(updates)
      .where(and(eq(shoppingList.id, id), eq(shoppingList.userId, userId)))
      .returning();
    return updated;
  }

  async deleteShoppingListItem(id: number, userId: string): Promise<void> {
    await db.delete(shoppingList).where(and(eq(shoppingList.id, id), eq(shoppingList.userId, userId)));
  }

  async toggleShoppingListItemStatus(id: number, userId: string): Promise<ShoppingListItem | undefined> {
    const [current] = await db.select().from(shoppingList).where(and(eq(shoppingList.id, id), eq(shoppingList.userId, userId)));
    if (!current) return undefined;
    const newStatus = current.status === 'pendente' ? 'comprado' : 'pendente';
    const [updated] = await db
      .update(shoppingList)
      .set({ status: newStatus })
      .where(and(eq(shoppingList.id, id), eq(shoppingList.userId, userId)))
      .returning();
    return updated;
  }

  // Pool Equipment
  async getPoolEquipment(clientId: number): Promise<PoolEquipment[]> {
    return await db.select().from(poolEquipment).where(eq(poolEquipment.clientId, clientId)).orderBy(poolEquipment.createdAt);
  }

  async getPoolEquipmentForUser(id: number, userId: string): Promise<PoolEquipment | undefined> {
    const rows = await db
      .select({ equipment: poolEquipment })
      .from(poolEquipment)
      .innerJoin(clients, eq(clients.id, poolEquipment.clientId))
      .where(and(eq(poolEquipment.id, id), eq(clients.userId, userId)));
    return rows[0]?.equipment;
  }

  async createPoolEquipment(data: InsertPoolEquipment & { clientId: number }): Promise<PoolEquipment> {
    const [item] = await db.insert(poolEquipment).values(data).returning();
    return item;
  }

  async updatePoolEquipment(id: number, data: Partial<InsertPoolEquipment>): Promise<PoolEquipment | undefined> {
    const [updated] = await db.update(poolEquipment).set(data).where(eq(poolEquipment.id, id)).returning();
    return updated;
  }

  async deletePoolEquipment(id: number, userId: string): Promise<void> {
    const userClientIds = (await db.select({ id: clients.id }).from(clients).where(eq(clients.userId, userId))).map(c => c.id);
    await db
      .delete(poolEquipment)
      .where(and(eq(poolEquipment.id, id), inArray(poolEquipment.clientId, userClientIds)));
  }

  // Client Equipment
  async getClientEquipment(clientId: number, userId: string): Promise<ClientEquipment[]> {
    const [client] = await db.select().from(clients).where(and(eq(clients.id, clientId), eq(clients.userId, userId)));
    if (!client) return [];
    return await db
      .select()
      .from(clientEquipment)
      .where(eq(clientEquipment.clientId, clientId))
      .orderBy(clientEquipment.createdAt);
  }

  async createClientEquipment(data: InsertClientEquipment & { clientId: number; userId: string }): Promise<ClientEquipment> {
    const [item] = await db.insert(clientEquipment).values(data).returning();
    return item;
  }

  async updateClientEquipment(id: number, userId: string, data: Partial<InsertClientEquipment>): Promise<ClientEquipment | undefined> {
    const userClientIds = (await db.select({ id: clients.id }).from(clients).where(eq(clients.userId, userId))).map(c => c.id);
    const [updated] = await db
      .update(clientEquipment)
      .set(data)
      .where(and(eq(clientEquipment.id, id), inArray(clientEquipment.clientId, userClientIds)))
      .returning();
    return updated;
  }

  async deleteClientEquipment(id: number, userId: string): Promise<void> {
    const userClientIds = (await db.select({ id: clients.id }).from(clients).where(eq(clients.userId, userId))).map(c => c.id);
    await db
      .delete(clientEquipment)
      .where(and(eq(clientEquipment.id, id), inArray(clientEquipment.clientId, userClientIds)));
  }

  // Client Documents
  async getClientDocuments(clientId: number, userId: string): Promise<ClientDocument[]> {
    const [client] = await db.select().from(clients).where(and(eq(clients.id, clientId), eq(clients.userId, userId)));
    if (!client) return [];
    return await db
      .select()
      .from(clientDocuments)
      .where(eq(clientDocuments.clientId, clientId))
      .orderBy(clientDocuments.createdAt);
  }

  async createClientDocument(data: InsertClientDocument & { clientId: number; userId: string }): Promise<ClientDocument> {
    const [item] = await db.insert(clientDocuments).values(data).returning();
    return item;
  }

  async updateClientDocument(id: number, userId: string, data: Partial<InsertClientDocument>): Promise<ClientDocument | undefined> {
    const userClientIds = (await db.select({ id: clients.id }).from(clients).where(eq(clients.userId, userId))).map(c => c.id);
    const [updated] = await db
      .update(clientDocuments)
      .set(data)
      .where(and(eq(clientDocuments.id, id), inArray(clientDocuments.clientId, userClientIds)))
      .returning();
    return updated;
  }

  async deleteClientDocument(id: number, userId: string): Promise<ClientDocument | undefined> {
    const userClientIds = (await db.select({ id: clients.id }).from(clients).where(eq(clients.userId, userId))).map(c => c.id);
    const [deleted] = await db
      .delete(clientDocuments)
      .where(and(eq(clientDocuments.id, id), inArray(clientDocuments.clientId, userClientIds)))
      .returning();
    return deleted;
  }

  // Pool Photos
  async getPoolPhotos(clientId: number, equipmentId?: number): Promise<PoolPhoto[]> {
    if (equipmentId !== undefined) {
      return await db
        .select()
        .from(poolPhotos)
        .where(and(eq(poolPhotos.clientId, clientId), eq(poolPhotos.equipmentId, equipmentId)))
        .orderBy(poolPhotos.createdAt);
    }
    return await db.select().from(poolPhotos).where(eq(poolPhotos.clientId, clientId)).orderBy(poolPhotos.createdAt);
  }

  async createPoolPhoto(data: InsertPoolPhoto & { clientId: number }): Promise<PoolPhoto> {
    const [photo] = await db.insert(poolPhotos).values(data).returning();
    return photo;
  }

  async deletePoolPhoto(id: number, userId: string): Promise<void> {
    const userClientIds = (await db.select({ id: clients.id }).from(clients).where(eq(clients.userId, userId))).map(c => c.id);
    await db
      .delete(poolPhotos)
      .where(and(eq(poolPhotos.id, id), inArray(poolPhotos.clientId, userClientIds)));
  }
}

export const storage = new DatabaseStorage();
