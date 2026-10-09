import { z } from 'zod';
import { insertClientSchema, insertAppointmentSchema, insertServiceLogSchema, insertReminderSchema, insertQuickPhotoSchema, insertPurchaseCategorySchema, insertStoreSchema, insertPurchaseSchema, insertClientPaymentSchema, insertServiceVisitSchema, insertFinancialConfigSchema, insertMonthlyDistributionSchema, insertEmployeeSchema, insertPendingTaskSchema, insertSuggestedWorkSchema, insertExpenseNoteSchema, insertExpenseNoteItemSchema, insertQuoteSchema, insertQuoteItemSchema, insertShoppingListSchema, updateWorkingHoursSchema, clients, appointments, serviceLogs, reminders, quickPhotos, serviceLogLaborEntries, serviceLogMaterialEntries, purchaseCategories, stores, purchases, clientPayments, serviceVisits, serviceVisitServices, financialConfig, monthlyDistributions, employees, pendingTasks, suggestedWorks, expenseNotes, expenseNoteItems, expenseNoteEdits, quotes, quoteItems, shoppingList, poolEquipment, poolPhotos, clientEquipment, clientDocuments, insertPoolEquipmentSchema, insertPoolPhotoSchema, insertClientEquipmentSchema, insertClientDocumentSchema } from './schema';

// Robust numeric validator: preprocess to reject NaN/Infinity before coercion
const safePositiveNumber = (max: number, fieldName: string) =>
  z.preprocess(
    (val) => {
      const num = typeof val === 'string' ? parseFloat(val) : Number(val);
      if (!Number.isFinite(num) || Number.isNaN(num)) return undefined;
      return num;
    },
    z.number({ required_error: `${fieldName} é obrigatório`, invalid_type_error: `${fieldName} inválido` })
      .positive(`${fieldName} deve ser positivo`)
      .max(max, `${fieldName} muito alto (máx ${max})`)
  );

// Labor entry input schema for creating service logs
export const laborEntryInputSchema = z.object({
  workerName: z.string().min(1, "Nome do funcionário é obrigatório"),
  hours: safePositiveNumber(24, "Horas"),
  hourlyRate: safePositiveNumber(1000, "Valor/hora"),
  cost: z.number().optional(),
});

// Material entry input schema for creating service logs
export const materialEntryInputSchema = z.object({
  materialName: z.string().min(1, "Nome do material é obrigatório"),
  quantity: safePositiveNumber(10000, "Quantidade"),
  unitPrice: safePositiveNumber(100000, "Preço unitário"),
  cost: z.number().optional(),
});

// Extended service log input with entries
export const createServiceLogWithEntriesInput = insertServiceLogSchema.extend({
  date: z.union([z.date(), z.string().transform((s) => new Date(s))]),
  laborEntries: z.array(laborEntryInputSchema).default([]),
  materialEntries: z.array(materialEntryInputSchema).default([]),
});

// Shared error schemas
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

const dateCoerceRoute = z.union([z.date(), z.string().transform((s) => new Date(s))]);

export const reminderInputSchema = insertReminderSchema.extend({
  clientId: z.number().optional().nullable(),
  frequency: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  category: z.string().optional(),
  priority: z.string().optional(),
  isCompleted: z.boolean().optional(),
  completedAt: dateCoerceRoute.optional().nullable(),
  nextDue: dateCoerceRoute,
});

export const api = {
  clients: {
    list: {
      method: 'GET' as const,
      path: '/api/clients',
      responses: {
        200: z.array(z.custom<typeof clients.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/clients/:id',
      responses: {
        200: z.custom<typeof clients.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/clients',
      input: insertClientSchema,
      responses: {
        201: z.custom<typeof clients.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/clients/:id',
      input: insertClientSchema.partial(),
      responses: {
        200: z.custom<typeof clients.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/clients/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  appointments: {
    list: {
      method: 'GET' as const,
      path: '/api/appointments',
      input: z.object({
        clientId: z.string().optional(), // Query param is string, will need coercion
        from: z.string().optional(),
        to: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof appointments.$inferSelect & { client: typeof clients.$inferSelect }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/appointments/:id',
      responses: {
        200: z.custom<typeof appointments.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/appointments',
      input: insertAppointmentSchema,
      responses: {
        201: z.custom<typeof appointments.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/appointments/:id',
      input: insertAppointmentSchema.partial(),
      responses: {
        200: z.custom<typeof appointments.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/appointments/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  serviceLogs: {
    list: {
      method: 'GET' as const,
      path: '/api/service-logs',
      input: z.object({
        clientId: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof serviceLogs.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/service-logs/:id',
      responses: {
        200: z.custom<typeof serviceLogs.$inferSelect & {
          laborEntries: (typeof serviceLogLaborEntries.$inferSelect)[];
          materialEntries: (typeof serviceLogMaterialEntries.$inferSelect)[];
        }>(),
        404: errorSchemas.notFound,
      },
    },
    unpaid: {
      method: 'GET' as const,
      path: '/api/service-logs/unpaid',
      responses: {
        200: z.array(z.custom<typeof serviceLogs.$inferSelect & { clientName: string }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/service-logs',
      input: createServiceLogWithEntriesInput,
      responses: {
        201: z.custom<typeof serviceLogs.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    markPaid: {
      method: 'PUT' as const,
      path: '/api/service-logs/:id/mark-paid',
      responses: {
        200: z.custom<typeof serviceLogs.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/service-logs/:id',
      input: insertServiceLogSchema.partial(),
      responses: {
        200: z.custom<typeof serviceLogs.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/service-logs/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  reminders: {
    list: {
      method: 'GET' as const,
      path: '/api/reminders',
      input: z.object({
        clientId: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof reminders.$inferSelect & { client: typeof clients.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/reminders',
      input: reminderInputSchema,
      responses: {
        201: z.custom<typeof reminders.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/reminders/:id',
      input: reminderInputSchema.partial(),
      responses: {
        200: z.custom<typeof reminders.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/reminders/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  quickPhotos: {
    list: {
      method: 'GET' as const,
      path: '/api/quick-photos',
      input: z.object({
        clientId: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof quickPhotos.$inferSelect & { client: typeof clients.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/quick-photos',
      input: insertQuickPhotoSchema,
      responses: {
        201: z.custom<typeof quickPhotos.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/quick-photos/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  purchaseCategories: {
    list: {
      method: 'GET' as const,
      path: '/api/purchase-categories',
      responses: {
        200: z.array(z.custom<typeof purchaseCategories.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/purchase-categories',
      input: insertPurchaseCategorySchema,
      responses: {
        201: z.custom<typeof purchaseCategories.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/purchase-categories/:id',
      input: insertPurchaseCategorySchema.partial(),
      responses: {
        200: z.custom<typeof purchaseCategories.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/purchase-categories/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  stores: {
    list: {
      method: 'GET' as const,
      path: '/api/stores',
      responses: {
        200: z.array(z.custom<typeof stores.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/stores/:id',
      responses: {
        200: z.custom<typeof stores.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/stores',
      input: insertStoreSchema,
      responses: {
        201: z.custom<typeof stores.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/stores/:id',
      input: insertStoreSchema.partial(),
      responses: {
        200: z.custom<typeof stores.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/stores/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  purchases: {
    list: {
      method: 'GET' as const,
      path: '/api/purchases',
      input: z.object({
        categoryId: z.string().optional(),
        storeId: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof purchases.$inferSelect & { store: typeof stores.$inferSelect; category: typeof purchaseCategories.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/purchases',
      input: insertPurchaseSchema,
      responses: {
        201: z.custom<typeof purchases.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/purchases/:id',
      input: insertPurchaseSchema.partial(),
      responses: {
        200: z.custom<typeof purchases.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/purchases/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  clientPayments: {
    list: {
      method: 'GET' as const,
      path: '/api/client-payments',
      input: z.object({
        year: z.string().optional(),
        month: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof clientPayments.$inferSelect & { client: typeof clients.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/client-payments',
      input: insertClientPaymentSchema,
      responses: {
        201: z.custom<typeof clientPayments.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    markPaid: {
      method: 'PUT' as const,
      path: '/api/client-payments/:id/paid',
      responses: {
        200: z.custom<typeof clientPayments.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    generate: {
      method: 'POST' as const,
      path: '/api/client-payments/generate',
      input: z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
      }),
      responses: {
        201: z.array(z.custom<typeof clientPayments.$inferSelect>()),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/client-payments/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  serviceVisits: {
    list: {
      method: 'GET' as const,
      path: '/api/service-visits',
      input: z.object({
        clientId: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof serviceVisits.$inferSelect & { services: (typeof serviceVisitServices.$inferSelect)[] }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/service-visits',
      input: z.object({
        visit: insertServiceVisitSchema,
        services: z.array(z.object({
          serviceType: z.string(),
          wasPlanned: z.boolean().optional(),
          notes: z.string().optional(),
        })),
      }),
      responses: {
        201: z.custom<typeof serviceVisits.$inferSelect & { services: (typeof serviceVisitServices.$inferSelect)[] }>(),
        400: errorSchemas.validation,
      },
    },
    stats: {
      method: 'GET' as const,
      path: '/api/clients/:id/service-stats',
      responses: {
        200: z.object({
          clientId: z.number(),
          totalVisits: z.number(),
          averageDurationMinutes: z.number(),
          averageWorkerCount: z.number(),
          totalWorkerHours: z.number(),
          serviceBreakdown: z.record(z.string(), z.number()),
        }).nullable(),
      },
    },
  },
  financialConfig: {
    get: {
      method: 'GET' as const,
      path: '/api/financial-config',
      responses: {
        200: z.custom<typeof financialConfig.$inferSelect>().nullable(),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/financial-config',
      input: insertFinancialConfigSchema,
      responses: {
        200: z.custom<typeof financialConfig.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  monthlyDistributions: {
    list: {
      method: 'GET' as const,
      path: '/api/monthly-distributions',
      input: z.object({
        year: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof monthlyDistributions.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/monthly-distributions/:year/:month',
      responses: {
        200: z.custom<typeof monthlyDistributions.$inferSelect>().nullable(),
      },
    },
    calculate: {
      method: 'POST' as const,
      path: '/api/monthly-distributions/:year/:month/calculate',
      responses: {
        200: z.custom<typeof monthlyDistributions.$inferSelect>(),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/monthly-distributions/:id',
      input: insertMonthlyDistributionSchema.partial(),
      responses: {
        200: z.custom<typeof monthlyDistributions.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  },
  employees: {
    list: {
      method: 'GET' as const,
      path: '/api/employees',
      input: z.object({
        includeInactive: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof employees.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/employees/:id',
      responses: {
        200: z.custom<typeof employees.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/employees',
      input: insertEmployeeSchema,
      responses: {
        201: z.custom<typeof employees.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/employees/:id',
      input: insertEmployeeSchema.partial(),
      responses: {
        200: z.custom<typeof employees.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    toggleActive: {
      method: 'PUT' as const,
      path: '/api/employees/:id/toggle-active',
      responses: {
        200: z.custom<typeof employees.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/employees/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  pendingTasks: {
    list: {
      method: 'GET' as const,
      path: '/api/pending-tasks',
      input: z.object({
        clientId: z.string().optional(),
        includeCompleted: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof pendingTasks.$inferSelect & { client: typeof clients.$inferSelect }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/pending-tasks/:id',
      responses: {
        200: z.custom<typeof pendingTasks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/pending-tasks',
      input: insertPendingTaskSchema,
      responses: {
        201: z.custom<typeof pendingTasks.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/pending-tasks/:id',
      input: insertPendingTaskSchema.partial(),
      responses: {
        200: z.custom<typeof pendingTasks.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    complete: {
      method: 'PUT' as const,
      path: '/api/pending-tasks/:id/complete',
      input: z.object({
        serviceLogId: z.number().optional(),
      }).optional(),
      responses: {
        200: z.custom<typeof pendingTasks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/pending-tasks/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    count: {
      method: 'GET' as const,
      path: '/api/pending-tasks/count',
      responses: {
        200: z.object({ count: z.number() }),
      },
    },
  },
  
  suggestedWorks: {
    list: {
      method: 'GET' as const,
      path: '/api/suggested-works',
      input: z.object({
        clientId: z.string().optional(),
        includeCompleted: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof suggestedWorks.$inferSelect & { client: typeof clients.$inferSelect }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/suggested-works/:id',
      responses: {
        200: z.custom<typeof suggestedWorks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/suggested-works',
      input: insertSuggestedWorkSchema,
      responses: {
        201: z.custom<typeof suggestedWorks.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/suggested-works/:id',
      input: insertSuggestedWorkSchema.partial(),
      responses: {
        200: z.custom<typeof suggestedWorks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/suggested-works/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },

  expenseNotes: {
    list: {
      method: 'GET' as const,
      path: '/api/expense-notes',
      input: z.object({
        clientId: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof expenseNotes.$inferSelect & { client: typeof clients.$inferSelect; items: (typeof expenseNoteItems.$inferSelect)[] }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/expense-notes/:id',
      responses: {
        200: z.custom<typeof expenseNotes.$inferSelect & { client: typeof clients.$inferSelect; items: (typeof expenseNoteItems.$inferSelect)[]; edits?: (typeof expenseNoteEdits.$inferSelect)[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/expense-notes',
      input: insertExpenseNoteSchema.extend({
        items: z.array(insertExpenseNoteItemSchema.innerType().omit({ expenseNoteId: true })).optional(),
      }),
      responses: {
        201: z.custom<typeof expenseNotes.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/expense-notes/:id',
      input: insertExpenseNoteSchema.partial(),
      responses: {
        200: z.custom<typeof expenseNotes.$inferSelect>(),
        400: errorSchemas.validation,
        403: errorSchemas.notFound,
        404: errorSchemas.notFound,
      },
    },
    updateItems: {
      method: 'PUT' as const,
      path: '/api/expense-notes/:id/items',
      input: z.object({
        items: z.array(insertExpenseNoteItemSchema.innerType().omit({ expenseNoteId: true })),
      }),
      responses: {
        200: z.array(z.custom<typeof expenseNoteItems.$inferSelect>()),
        400: errorSchemas.validation,
        403: errorSchemas.notFound,
      },
    },
    createEdit: {
      method: 'POST' as const,
      path: '/api/expense-notes/:id/edits',
      input: z.object({
        fieldChanged: z.string().min(1),
        reason: z.string().min(1),
      }),
      responses: {
        201: z.object({ success: z.boolean() }),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/expense-notes/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    fromServiceLog: {
      method: 'POST' as const,
      path: '/api/expense-notes/from-service-log/:logId',
      input: z.object({
        notes: z.string().optional(),
      }).optional(),
      responses: {
        201: z.custom<typeof expenseNotes.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },

  quotes: {
    list: {
      method: 'GET' as const,
      path: '/api/quotes',
      input: z.object({
        clientId: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof quotes.$inferSelect & { client: typeof clients.$inferSelect; items: (typeof quoteItems.$inferSelect)[] }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/quotes/:id',
      responses: {
        200: z.custom<typeof quotes.$inferSelect & { client: typeof clients.$inferSelect; items: (typeof quoteItems.$inferSelect)[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/quotes',
      input: insertQuoteSchema.extend({
        items: z.array(insertQuoteItemSchema.omit({ quoteId: true })).optional(),
      }),
      responses: {
        201: z.custom<typeof quotes.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/quotes/:id',
      input: insertQuoteSchema.partial(),
      responses: {
        200: z.custom<typeof quotes.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    updateItems: {
      method: 'PUT' as const,
      path: '/api/quotes/:id/items',
      input: z.object({
        items: z.array(insertQuoteItemSchema.omit({ quoteId: true })),
      }),
      responses: {
        200: z.array(z.custom<typeof quoteItems.$inferSelect>()),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/quotes/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },

  shoppingList: {
    list: {
      method: 'GET' as const,
      path: '/api/shopping-list',
      responses: {
        200: z.array(z.custom<typeof shoppingList.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/shopping-list',
      input: insertShoppingListSchema,
      responses: {
        201: z.custom<typeof shoppingList.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/shopping-list/:id',
      input: insertShoppingListSchema.partial(),
      responses: {
        200: z.custom<typeof shoppingList.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/shopping-list/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    toggleStatus: {
      method: 'PATCH' as const,
      path: '/api/shopping-list/:id/status',
      responses: {
        200: z.custom<typeof shoppingList.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },

  userPreferences: {
    getWorkingHours: {
      method: 'GET' as const,
      path: '/api/user/preferences/working-hours',
      responses: {
        200: z.object({
          workingHoursStart: z.number(),
          workingHoursEnd: z.number(),
          lunchEnabled: z.boolean(),
          lunchStart: z.number(),
          lunchEnd: z.number(),
          hasPreferences: z.boolean(),
        }),
      },
    },
    updateWorkingHours: {
      method: 'PUT' as const,
      path: '/api/user/preferences/working-hours',
      input: updateWorkingHoursSchema,
      responses: {
        200: z.object({
          workingHoursStart: z.number(),
          workingHoursEnd: z.number(),
          lunchEnabled: z.boolean(),
          lunchStart: z.number(),
          lunchEnd: z.number(),
          hasPreferences: z.boolean(),
        }),
        400: errorSchemas.validation,
      },
    },
  },
  pool: {
    equipment: {
      list: {
        method: 'GET' as const,
        path: '/api/pool/equipment',
        input: z.object({ clientId: z.coerce.number() }),
        responses: {
          200: z.array(z.custom<typeof poolEquipment.$inferSelect>()),
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/pool/equipment',
        input: insertPoolEquipmentSchema.omit({ clientId: true }),
        responses: {
          201: z.custom<typeof poolEquipment.$inferSelect>(),
          400: errorSchemas.validation,
        },
      },
      update: {
        method: 'PUT' as const,
        path: '/api/pool/equipment/:id',
        input: insertPoolEquipmentSchema.omit({ clientId: true }).partial(),
        responses: {
          200: z.custom<typeof poolEquipment.$inferSelect>(),
          404: errorSchemas.notFound,
        },
      },
      delete: {
        method: 'DELETE' as const,
        path: '/api/pool/equipment/:id',
        responses: {
          204: z.void(),
          404: errorSchemas.notFound,
        },
      },
    },
    photos: {
      list: {
        method: 'GET' as const,
        path: '/api/pool/photos',
        input: z.object({ clientId: z.coerce.number(), equipmentId: z.coerce.number().optional() }),
        responses: {
          200: z.array(z.custom<typeof poolPhotos.$inferSelect>()),
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/pool/photos',
        input: insertPoolPhotoSchema.omit({ clientId: true }),
        responses: {
          201: z.custom<typeof poolPhotos.$inferSelect>(),
          400: errorSchemas.validation,
        },
      },
      delete: {
        method: 'DELETE' as const,
        path: '/api/pool/photos/:id',
        responses: {
          204: z.void(),
          404: errorSchemas.notFound,
        },
      },
    },
  },
  clientEquipment: {
    list: {
      method: 'GET' as const,
      path: '/api/clients/:clientId/equipment',
      responses: {
        200: z.array(z.custom<typeof clientEquipment.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/clients/:clientId/equipment',
      input: insertClientEquipmentSchema,
      responses: {
        201: z.custom<typeof clientEquipment.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/client-equipment/:id',
      input: insertClientEquipmentSchema.partial(),
      responses: {
        200: z.custom<typeof clientEquipment.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/client-equipment/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  clientDocuments: {
    list: {
      method: 'GET' as const,
      path: '/api/clients/:clientId/documents',
      responses: {
        200: z.array(z.custom<typeof clientDocuments.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/clients/:clientId/documents',
      input: insertClientDocumentSchema.omit({ clientId: true, userId: true }),
      responses: {
        201: z.custom<typeof clientDocuments.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/client-documents/:id',
      input: insertClientDocumentSchema.pick({ title: true, documentType: true, notes: true }).partial(),
      responses: {
        200: z.custom<typeof clientDocuments.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/client-documents/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
