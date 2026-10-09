// ============================================================
// EXPENSE NOTES — Adições ao server/storage.ts
// ============================================================
//
// 1. Adicionar ao import do topo do ficheiro:
//    - expenseNotes, expenseNoteItems (tabelas)
//    - InsertExpenseNote, ExpenseNote, InsertExpenseNoteItem,
//      ExpenseNoteItem, ExpenseNoteWithDetails (tipos)
//
// 2. Adicionar à interface IStorage (junto aos outros métodos):
//
//   // Expense Notes
//   getExpenseNotes(userId: string, clientId?: number): Promise<ExpenseNoteWithDetails[]>;
//   getExpenseNote(id: number, userId: string): Promise<ExpenseNoteWithDetails | undefined>;
//   createExpenseNote(note: InsertExpenseNote & { userId: string }, items: Omit<InsertExpenseNoteItem, 'expenseNoteId'>[]): Promise<ExpenseNoteWithDetails>;
//   updateExpenseNote(id: number, userId: string, updates: Partial<InsertExpenseNote>): Promise<ExpenseNote | undefined>;
//   updateExpenseNoteItems(noteId: number, userId: string, items: Omit<InsertExpenseNoteItem, 'expenseNoteId'>[]): Promise<ExpenseNoteItem[]>;
//   deleteExpenseNote(id: number, userId: string): Promise<void>;
//   generateNoteNumber(userId: string): Promise<string>;
//
// 3. Adicionar os métodos abaixo à classe DatabaseStorage,
//    antes da linha: export const storage = new DatabaseStorage();
// ============================================================

  // Expense Notes
  async generateNoteNumber(userId: string): Promise<string> {
    const year = new Date().getFullYear();
    // Conta notas do utilizador no ano corrente
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
        .where(eq(clients.id, note.clientId));
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
          .where(eq(serviceLogs.id, note.serviceLogId));
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
      .where(eq(clients.id, note.clientId));
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
        .where(eq(serviceLogs.id, note.serviceLogId));
      serviceLog = log ?? null;
    }

    return { ...note, client, items, serviceLog };
  }

  async createExpenseNote(
    note: InsertExpenseNote & { userId: string },
    items: Omit<InsertExpenseNoteItem, "expenseNoteId">[]
  ): Promise<ExpenseNoteWithDetails> {
    // Gera número sequencial
    const noteNumber = note.noteNumber ?? (await this.generateNoteNumber(note.userId));

    const [newNote] = await db
      .insert(expenseNotes)
      .values({ ...note, noteNumber })
      .returning();

    const createdItems: ExpenseNoteItem[] = [];
    for (const item of items) {
      // Garante que o total é consistente (quantity * unitPrice)
      const total = Math.round(item.quantity * item.unitPrice * 100) / 100;
      const [newItem] = await db
        .insert(expenseNoteItems)
        .values({ ...item, expenseNoteId: newNote.id, total })
        .returning();
      createdItems.push(newItem);
    }

    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, newNote.clientId));

    let serviceLog = null;
    if (newNote.serviceLogId) {
      const [log] = await db
        .select()
        .from(serviceLogs)
        .where(eq(serviceLogs.id, newNote.serviceLogId));
      serviceLog = log ?? null;
    }

    return { ...newNote, client: client!, items: createdItems, serviceLog };
  }

  async updateExpenseNote(
    id: number,
    userId: string,
    updates: Partial<InsertExpenseNote>
  ): Promise<ExpenseNote | undefined> {
    // Não permite alterar nota já emitida (status = 'issued')
    const [existing] = await db
      .select()
      .from(expenseNotes)
      .where(and(eq(expenseNotes.id, id), eq(expenseNotes.userId, userId)));
    if (!existing) return undefined;
    if (existing.status === "issued") {
      throw new Error("Não é possível editar uma nota já emitida.");
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
    // Valida ownership
    const [note] = await db
      .select()
      .from(expenseNotes)
      .where(and(eq(expenseNotes.id, noteId), eq(expenseNotes.userId, userId)));
    if (!note) throw new Error("Nota não encontrada.");
    if (note.status === "issued") throw new Error("Não é possível editar itens de uma nota já emitida.");

    // Apaga itens existentes e reinsere
    await db
      .delete(expenseNoteItems)
      .where(eq(expenseNoteItems.expenseNoteId, noteId));

    const createdItems: ExpenseNoteItem[] = [];
    for (const item of items) {
      const total = Math.round(item.quantity * item.unitPrice * 100) / 100;
      const [newItem] = await db
        .insert(expenseNoteItems)
        .values({ ...item, expenseNoteId: noteId, total })
        .returning();
      createdItems.push(newItem);
    }
    return createdItems;
  }

  async deleteExpenseNote(id: number, userId: string): Promise<void> {
    // Apaga itens primeiro (FK)
    await db
      .delete(expenseNoteItems)
      .where(eq(expenseNoteItems.expenseNoteId, id));
    await db
      .delete(expenseNotes)
      .where(and(eq(expenseNotes.id, id), eq(expenseNotes.userId, userId)));
  }
