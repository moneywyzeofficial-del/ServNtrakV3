// ============================================================
// EXPENSE NOTES — Notas de Despesa
// Adicionar a shared/schema.ts antes da secção === RELATIONS ===
// ============================================================

export const expenseNotes = pgTable("expense_notes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  noteNumber: text("note_number").notNull().unique(), // ex: ND-2026-001
  clientId: integer("client_id").notNull(),
  serviceLogId: integer("service_log_id"), // nullable — origem do documento
  status: text("status").notNull().default("draft"), // 'draft' | 'issued'
  issueDate: timestamp("issue_date"),
  notes: text("notes"), // observações gerais do documento
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const expenseNoteItems = pgTable("expense_note_items", {
  id: serial("id").primaryKey(),
  expenseNoteId: integer("expense_note_id").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // 'service' | 'material' | 'labor'
  quantity: doublePrecision("quantity").notNull().default(1),
  unitPrice: doublePrecision("unit_price").notNull(),
  total: doublePrecision("total").notNull(), // quantity * unitPrice
  sourceType: text("source_type").notNull().default("manual"), // 'auto' | 'manual' | 'edited'
  editReason: text("edit_reason"), // obrigatório quando sourceType = 'edited'
  createdAt: timestamp("created_at").defaultNow(),
});

// --- Relations (adicionar junto às outras relations) ---

export const expenseNotesRelations = relations(expenseNotes, ({ one, many }) => ({
  user: one(users, {
    fields: [expenseNotes.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [expenseNotes.clientId],
    references: [clients.id],
  }),
  serviceLog: one(serviceLogs, {
    fields: [expenseNotes.serviceLogId],
    references: [serviceLogs.id],
  }),
  items: many(expenseNoteItems),
}));

export const expenseNoteItemsRelations = relations(expenseNoteItems, ({ one }) => ({
  expenseNote: one(expenseNotes, {
    fields: [expenseNoteItems.expenseNoteId],
    references: [expenseNotes.id],
  }),
}));

// --- Insert schemas (adicionar junto aos outros insertSchemas) ---

export const insertExpenseNoteSchema = createInsertSchema(expenseNotes).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExpenseNoteItemSchema = createInsertSchema(expenseNoteItems).omit({
  id: true,
  createdAt: true,
});

// --- Types (adicionar junto aos outros types) ---

export type ExpenseNote = typeof expenseNotes.$inferSelect;
export type InsertExpenseNote = z.infer<typeof insertExpenseNoteSchema>;

export type ExpenseNoteItem = typeof expenseNoteItems.$inferSelect;
export type InsertExpenseNoteItem = z.infer<typeof insertExpenseNoteItemSchema>;

export type ExpenseNoteWithDetails = ExpenseNote & {
  client: Client;
  items: ExpenseNoteItem[];
  serviceLog?: ServiceLog | null;
};
