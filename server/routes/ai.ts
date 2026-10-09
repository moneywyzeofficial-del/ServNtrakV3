import type { Express } from "express";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "./middleware";
import { storage } from "../storage";
import { checkScanDocumentRateLimit, checkAssistantRateLimit } from "../aiRateLimiter";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

const extractedPurchaseSchema = z.object({
  storeName: z.string().optional(),
  storeNif: z.string().optional(),
  storeAddress: z.string().optional(),
  purchaseDate: z.string().optional(),
  invoiceNumber: z.string().optional().nullable(),
  items: z.array(z.object({
    productName: z.string(),
    quantity: z.number().default(1),
    unitPrice: z.number().optional(),
    totalPrice: z.number(),
    discountValue: z.number().optional(),
    finalPrice: z.number().optional(),
  })).default([]),
  totalWithoutTax: z.number().optional(),
  taxAmount: z.number().optional(),
  grandTotal: z.number().optional(),
});

export function registerAiRoutes(app: Express): void {
  app.post("/api/scan-document", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;

      const rateCheck = checkScanDocumentRateLimit(userId);
      if (!rateCheck.allowed) {
        res.setHeader("Retry-After", String(rateCheck.retryAfterSeconds));
        return res.status(429).json({ message: `Limite de digitalizações atingido. Tente novamente em ${Math.ceil(rateCheck.retryAfterSeconds / 60)} minuto(s).` });
      }

      const { imageBase64 } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ message: "Imagem é obrigatória" });
      }

      let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg";
      let base64Data = imageBase64;
      if (imageBase64.startsWith("data:")) {
        const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mediaType = match[1] as typeof mediaType;
          base64Data = match[2];
        }
      }

      const response = await anthropic.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64Data,
                },
              },
              {
                type: "text",
                text: `Você é um assistente especializado em extrair informações de documentos de compra portugueses (faturas, recibos, talões).
Analise a imagem e extraia as seguintes informações em formato JSON:
- storeName: nome da loja/fornecedor
- storeNif: NIF/Contribuinte da loja (9 dígitos)
- storeAddress: morada da loja
- purchaseDate: data da compra (formato YYYY-MM-DD)
- invoiceNumber: número da fatura ou recibo (ex: FR 2026/1234, Recibo nº 456, FT 001/00123)
- items: lista de produtos com:
  - productName: nome do produto
  - quantity: quantidade
  - unitPrice: preço unitário
  - totalPrice: valor total sem desconto
  - discountValue: valor do desconto aplicado (0 se não houver)
  - finalPrice: valor final após desconto (= totalPrice - discountValue)
- totalWithoutTax: total sem IVA
- taxAmount: valor do IVA
- grandTotal: total final com IVA

Responda APENAS com o JSON válido, sem markdown ou explicações.
Se não conseguir identificar um campo, omita-o ou use null.
Valores monetários devem ser números (ex: 12.50, não "12,50€").`,
              },
            ],
          },
        ],
      });

      const content = (response.content[0] as { type: string; text: string })?.text || "{}";

      let extractedData;
      try {
        const cleanContent = content
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        extractedData = extractedPurchaseSchema.parse(JSON.parse(cleanContent));
      } catch (parseError) {
        // Do NOT log the raw model output: it contains extracted invoice
        // data (store names, addresses, NIFs, line items, totals) that we
        // never want copied into application logs.
        console.error("Failed to parse OCR response:", {
          message: parseError instanceof Error ? parseError.message : String(parseError),
          contentLength: content.length,
        });
        return res.status(422).json({
          message: "Não foi possível extrair informações do documento",
        });
      }

      res.json({
        success: true,
        data: extractedData,
      });
    } catch (error) {
      console.error("Error scanning document:", error);
      res.status(500).json({ message: "Erro ao processar documento" });
    }
  });

  app.post("/api/assistant", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;

      const rateCheck = checkAssistantRateLimit(userId);
      if (!rateCheck.allowed) {
        res.setHeader("Retry-After", String(rateCheck.retryAfterSeconds));
        return res.status(429).json({ message: `Limite de mensagens atingido. Tente novamente em ${Math.ceil(rateCheck.retryAfterSeconds / 60)} minuto(s).` });
      }

      const { message, history = [] } = req.body;

      if (!message) {
        return res.status(400).json({ message: "Mensagem em falta" });
      }

      const MAX_MESSAGE_LENGTH = 4000;
      const MAX_HISTORY_TURNS = 20;

      if (typeof message !== "string" || message.length > MAX_MESSAGE_LENGTH) {
        return res.status(400).json({ message: `A mensagem não pode exceder ${MAX_MESSAGE_LENGTH} caracteres` });
      }

      if (!Array.isArray(history) || history.length > MAX_HISTORY_TURNS) {
        return res.status(400).json({ message: `O histórico não pode exceder ${MAX_HISTORY_TURNS} mensagens` });
      }

      const clients = await storage.getClients(userId);
      const appointments = await storage.getAppointments(userId);

      const systemPrompt = `És um assistente de gestão de negócio para a Peralta Gardens, uma empresa de jardinagem e manutenção de piscinas e jacuzzis em Lourinhã, Portugal. O proprietário chama-se Tiago Santos.

  Tens acesso aos seguintes dados em tempo real:
  - Clientes: ${JSON.stringify(clients.map(c => ({ id: c.id, nome: c.name, morada: c.address })))}
  - Agendamentos: ${JSON.stringify(appointments.map(a => ({ id: a.id, cliente: a.clientId, data: a.date, servico: a.type })))}

  Responde sempre em português, de forma direta e prática. Ajuda o Tiago a gerir melhor o negócio.`;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          ...history,
          { role: "user", content: message }
        ],
      });

      const reply = response.content[0].type === "text" ? response.content[0].text : "";
      res.json({ reply });

    } catch (err: any) {
      console.error("Assistente Claude error:", err);
      res.status(500).json({ message: "Erro no assistente" });
    }
  });

  app.post("/api/ai/process-voice", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;

      const rateCheck = checkAssistantRateLimit(userId);
      if (!rateCheck.allowed) {
        res.setHeader("Retry-After", String(rateCheck.retryAfterSeconds));
        return res.status(429).json({ message: `Limite de mensagens atingido. Tente novamente em ${Math.ceil(rateCheck.retryAfterSeconds / 60)} minuto(s).` });
      }

      const { text } = req.body;

      if (!text || typeof text !== "string") {
        return res.status(400).json({ message: "Texto é obrigatório" });
      }

      if (text.length > 4000) {
        return res.status(400).json({ message: "O texto não pode exceder 4000 caracteres" });
      }

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: "És um assistente especializado em organizar relatórios de manutenção para a Peralta Gardens, uma empresa de jardinagem e manutenção de piscinas e jacuzzis em Lourinhã, Portugal. Recebeste um relato ditado por voz pelo técnico. Organiza o texto num relatório de serviço claro e estruturado, corrigindo erros de reconhecimento de voz e mantendo toda a informação técnica relevante. Responde em português.",
        messages: [{ role: "user", content: text }],
      });

      const summary = response.content[0].type === "text" ? response.content[0].text : "";
      res.json({ summary });

    } catch (err: any) {
      console.error("Process voice error:", err);
      res.status(500).json({ message: "Erro ao processar relato de voz" });
    }
  });
}
