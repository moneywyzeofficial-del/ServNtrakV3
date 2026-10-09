// ============================================================
// EXPENSE NOTES — Rotas para server/routes.ts
// ============================================================
// Adicionar dentro da função registerRoutes(), junto às outras rotas.
// Padrão idêntico ao existente: req.user!.id, res.json(), try/catch.
//
// Imports a adicionar ao topo de routes.ts (se não existirem):
//   import { storage } from "./storage";
//   (já deve existir)
// ============================================================

  // ── GET /api/expense-notes ─────────────────────────────────
  // Lista todas as notas do utilizador. Opcional: ?clientId=N
  app.get("/api/expense-notes", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Não autenticado" });
    try {
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      const notes = await storage.getExpenseNotes(req.user!.id, clientId);
      res.json(notes);
    } catch (error) {
      console.error("Erro ao obter notas de despesa:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // ── GET /api/expense-notes/:id ─────────────────────────────
  app.get("/api/expense-notes/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Não autenticado" });
    try {
      const note = await storage.getExpenseNote(parseInt(req.params.id), req.user!.id);
      if (!note) return res.status(404).json({ error: "Nota não encontrada" });
      res.json(note);
    } catch (error) {
      console.error("Erro ao obter nota de despesa:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // ── POST /api/expense-notes ────────────────────────────────
  // Body: { clientId, serviceLogId?, status?, issueDate?, notes?, items[] }
  // items[]: { description, type, quantity, unitPrice, sourceType, editReason? }
  app.post("/api/expense-notes", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Não autenticado" });
    try {
      const { items = [], ...noteData } = req.body;

      // Valida que itens editados têm justificação
      const editedWithoutReason = items.filter(
        (i: any) => i.sourceType === "edited" && !i.editReason?.trim()
      );
      if (editedWithoutReason.length > 0) {
        return res.status(400).json({
          error: "Itens editados requerem justificação (editReason).",
          items: editedWithoutReason.map((i: any) => i.description),
        });
      }

      const note = await storage.createExpenseNote(
        { ...noteData, userId: req.user!.id },
        items
      );
      res.status(201).json(note);
    } catch (error) {
      console.error("Erro ao criar nota de despesa:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // ── PATCH /api/expense-notes/:id ──────────────────────────
  // Actualiza cabeçalho da nota (só rascunhos)
  app.patch("/api/expense-notes/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Não autenticado" });
    try {
      const updated = await storage.updateExpenseNote(
        parseInt(req.params.id),
        req.user!.id,
        req.body
      );
      if (!updated) return res.status(404).json({ error: "Nota não encontrada" });
      res.json(updated);
    } catch (error: any) {
      if (error?.message?.includes("emitida")) {
        return res.status(403).json({ error: error.message });
      }
      console.error("Erro ao actualizar nota de despesa:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // ── PUT /api/expense-notes/:id/items ──────────────────────
  // Substitui todos os itens da nota (só rascunhos)
  app.put("/api/expense-notes/:id/items", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Não autenticado" });
    try {
      const { items = [] } = req.body;

      // Valida itens editados
      const editedWithoutReason = items.filter(
        (i: any) => i.sourceType === "edited" && !i.editReason?.trim()
      );
      if (editedWithoutReason.length > 0) {
        return res.status(400).json({
          error: "Itens editados requerem justificação (editReason).",
          items: editedWithoutReason.map((i: any) => i.description),
        });
      }

      const updatedItems = await storage.updateExpenseNoteItems(
        parseInt(req.params.id),
        req.user!.id,
        items
      );
      res.json(updatedItems);
    } catch (error: any) {
      if (error?.message?.includes("emitida")) {
        return res.status(403).json({ error: error.message });
      }
      console.error("Erro ao actualizar itens:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // ── DELETE /api/expense-notes/:id ─────────────────────────
  app.delete("/api/expense-notes/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Não autenticado" });
    try {
      await storage.deleteExpenseNote(parseInt(req.params.id), req.user!.id);
      res.status(204).send();
    } catch (error) {
      console.error("Erro ao apagar nota de despesa:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // ── GET /api/expense-notes/:id/pdf ────────────────────────
  // Devolve a nota completa — o PDF é gerado no frontend com jsPDF.
  // Este endpoint serve apenas para garantir que os dados estão disponíveis.
  // (alternativa: gerar PDF no backend com puppeteer/pdfkit — não necessário aqui)
  app.get("/api/expense-notes/:id/pdf", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Não autenticado" });
    try {
      const note = await storage.getExpenseNote(parseInt(req.params.id), req.user!.id);
      if (!note) return res.status(404).json({ error: "Nota não encontrada" });
      // Devolve os dados completos; o frontend gera o PDF com jsPDF
      res.json(note);
    } catch (error) {
      console.error("Erro ao obter nota para PDF:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // ── POST /api/expense-notes/from-service-log/:logId ───────
  // Cria uma nota pré-populada a partir de um serviceLog existente.
  // Importa automaticamente materiais e mão-de-obra como itens 'auto'.
  app.post("/api/expense-notes/from-service-log/:logId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Não autenticado" });
    try {
      const logId = parseInt(req.params.logId);
      const log = await storage.getServiceLogWithEntries(logId, req.user!.id);
      if (!log) return res.status(404).json({ error: "Registo de serviço não encontrado" });

      // Monta itens automaticamente a partir do serviceLog
      const items: any[] = [];

      // Mão-de-obra
      for (const entry of log.laborEntries) {
        items.push({
          description: entry.employeeId
            ? `Mão de obra — ${entry.hours}h`
            : `Mão de obra — ${entry.hours}h`,
          type: "labor",
          quantity: entry.hours,
          unitPrice: entry.hourlyRate,
          sourceType: "auto",
          editReason: null,
        });
      }

      // Materiais
      for (const entry of log.materialEntries) {
        items.push({
          description: entry.description,
          type: "material",
          quantity: entry.quantity,
          unitPrice: entry.unitPrice,
          sourceType: "auto",
          editReason: null,
        });
      }

      // Se o log tem um valor total extra (billingType extra), adiciona como serviço
      if (log.billingType === "extra" && log.totalAmount && items.length === 0) {
        items.push({
          description: log.notes ?? "Serviço extra",
          type: "service",
          quantity: 1,
          unitPrice: log.totalAmount,
          sourceType: "auto",
          editReason: null,
        });
      }

      const note = await storage.createExpenseNote(
        {
          userId: req.user!.id,
          clientId: log.clientId,
          serviceLogId: logId,
          status: "draft",
          notes: req.body.notes ?? null,
        },
        items
      );
      res.status(201).json(note);
    } catch (error) {
      console.error("Erro ao criar nota a partir de serviceLog:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
