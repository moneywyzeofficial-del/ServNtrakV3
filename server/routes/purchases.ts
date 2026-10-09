import type { Express } from "express";
import { z } from "zod";
import { requireAuth } from "./middleware";
import { storage } from "../storage";
import { api } from "@shared/routes";

export function registerPurchasesRoutes(app: Express): void {
  // --- Purchase Categories ---

  app.get(api.purchaseCategories.list.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    await storage.initializeDefaultCategories(userId);
    const categories = await storage.getPurchaseCategories(userId);
    res.json(categories);
  });

  app.post(api.purchaseCategories.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.purchaseCategories.create.input.parse(req.body);
      const userId = req.user!.id;
      const category = await storage.createPurchaseCategory({ ...input, userId });
      res.status(201).json(category);
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

  app.put(api.purchaseCategories.update.path, requireAuth, async (req, res) => {
    try {
      const input = api.purchaseCategories.update.input.parse(req.body);
      const userId = req.user!.id;
      const updated = await storage.updatePurchaseCategory(Number(req.params.id), userId, input);
      if (!updated) return res.status(404).json({ message: "Categoria não encontrada" });
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

  app.delete(api.purchaseCategories.delete.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    await storage.deletePurchaseCategory(Number(req.params.id), userId);
    res.status(204).end();
  });

  // --- Stores ---

  app.get(api.stores.list.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const storesList = await storage.getStores(userId);
    res.json(storesList);
  });

  app.get(api.stores.get.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const store = await storage.getStore(Number(req.params.id), userId);
    if (!store) return res.status(404).json({ message: "Loja não encontrada" });
    res.json(store);
  });

  app.post(api.stores.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.stores.create.input.parse(req.body);
      const userId = req.user!.id;
      const store = await storage.createStore({ ...input, userId });
      res.status(201).json(store);
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

  app.put(api.stores.update.path, requireAuth, async (req, res) => {
    try {
      const input = api.stores.update.input.parse(req.body);
      const userId = req.user!.id;
      const updated = await storage.updateStore(Number(req.params.id), userId, input);
      if (!updated) return res.status(404).json({ message: "Loja não encontrada" });
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

  app.delete(api.stores.delete.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    await storage.deleteStore(Number(req.params.id), userId);
    res.status(204).end();
  });

  // --- Purchases ---

  const bulkPurchaseItemSchema = api.purchases.create.input.pick({
    categoryId: true,
    productName: true,
    quantity: true,
    totalWithoutDiscount: true,
    discountValue: true,
    finalTotal: true,
  });

  const bulkPurchaseSchema = z.object({
    storeId: z.number().int().positive(),
    purchaseDate: z.union([z.date(), z.string().transform((s) => new Date(s))]),
    invoiceNumber: z.string().optional().nullable(),
    items: z.array(bulkPurchaseItemSchema).min(1, "Pelo menos um produto é obrigatório"),
  });

  type BulkPurchaseInput = z.infer<typeof bulkPurchaseSchema>;

  app.post("/api/purchases/bulk", requireAuth, async (req, res) => {
    try {
      const input: BulkPurchaseInput = bulkPurchaseSchema.parse(req.body);
      const userId = req.user!.id;

      const store = await storage.getStore(input.storeId, userId);
      if (!store) {
        return res.status(400).json({ message: "Loja inválida" });
      }

      const invoiceNumber = input.invoiceNumber?.trim() || undefined;
      if (invoiceNumber) {
        const exists = await storage.checkInvoiceExists(invoiceNumber, userId);
        if (exists) {
          return res.status(409).json({
            message: `A fatura ${invoiceNumber} já foi registada anteriormente.`,
            code: "DUPLICATE_INVOICE",
          });
        }
      }

      const createdPurchases = await Promise.all(
        input.items.map((item) =>
          storage.createPurchase({
            storeId: input.storeId,
            purchaseDate: input.purchaseDate,
            invoiceNumber: invoiceNumber ?? null,
            categoryId: item.categoryId,
            productName: item.productName,
            quantity: item.quantity,
            totalWithoutDiscount: item.totalWithoutDiscount,
            discountValue: item.discountValue,
            finalTotal: item.finalTotal,
            userId,
          })
        )
      );

      res.status(201).json(createdPurchases);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
          details: err.errors,
        });
      }
      console.error("BULK PURCHASE CREATE ERROR:", err);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get(api.purchases.list.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const storeId = req.query.storeId ? Number(req.query.storeId) : undefined;
    const purchasesList = await storage.getPurchases(userId, categoryId, storeId);
    res.json(purchasesList);
  });

  app.post(api.purchases.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.purchases.create.input.parse(req.body);
      const userId = req.user!.id;

      const store = await storage.getStore(input.storeId, userId);
      if (!store) {
        return res.status(400).json({ message: "Loja inválida" });
      }

      if (input.invoiceNumber) {
        const exists = await storage.checkInvoiceExists(input.invoiceNumber, userId);
        if (exists) {
          return res.status(409).json({
            message: `A fatura ${input.invoiceNumber} já foi registada anteriormente.`,
            code: "DUPLICATE_INVOICE"
          });
        }
      }

      const purchase = await storage.createPurchase({ ...input, userId });
      res.status(201).json(purchase);
    } catch (err) {
      // Do not log req.body — it contains store names, invoice numbers,
      // line items and prices that should never appear in application logs.
      console.error("PURCHASE CREATE ERROR:", {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        userId: req.user?.id,
      });
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
          details: err.errors,
        });
      }
      if (err instanceof Error && err.message.includes("não autorizado")) {
        return res.status(403).json({ message: err.message });
      }
      res.status(500).json({
        message: "Erro interno do servidor",
        detail: err instanceof Error ? err.message : String(err)
      });
    }
  });

  app.put(api.purchases.update.path, requireAuth, async (req, res) => {
    try {
      const input = api.purchases.update.input.parse(req.body);
      const userId = req.user!.id;
      const updated = await storage.updatePurchase(Number(req.params.id), userId, input);
      if (!updated) return res.status(404).json({ message: "Compra não encontrada" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      if (err instanceof Error && err.message.includes("não autorizado")) {
        return res.status(403).json({ message: err.message });
      }
      throw err;
    }
  });

  app.delete(api.purchases.delete.path, requireAuth, async (req, res) => {
    const userId = req.user!.id;
    await storage.deletePurchase(Number(req.params.id), userId);
    res.status(204).end();
  });

  app.get("/api/purchases/categories", requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const categories = await storage.getPurchaseCategories(userId);
    const categoryNames = Array.from(new Set(categories.map(c => c.name))).sort();
    res.json(categoryNames);
  });

  app.get("/api/purchases/details/:invoiceNumber", requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const invoiceNumber = req.params.invoiceNumber;
    const purchases = await storage.getPurchasesByInvoice(invoiceNumber, userId);
    res.json(purchases);
  });

  app.get("/api/purchases/items/:category", requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const category = req.params.category;
    const items = await storage.getDistinctItemsByCategory(category, userId);
    res.json(items);
  });

  app.get("/api/purchases/item/:productName", requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const productName = req.params.productName;
    const purchases = await storage.getPurchasesByProductName(productName, userId);
    res.json(purchases);
  });
}
