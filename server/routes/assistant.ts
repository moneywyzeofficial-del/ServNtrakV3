import type { Express } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "./middleware";
import { storage } from "../storage";
import { checkAssistantRateLimit } from "../aiRateLimiter";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

const CLASSIFY_SYSTEM = `És um assistente de gestão de negócio para a Peralta Gardens (jardinagem e manutenção de piscinas/jacuzzis).
Recebes texto ditado por voz pelo técnico. Classifica a intenção em exatamente um de:
- AGENDAMENTO: marcar, reagendar ou cancelar uma visita/serviço
- COMPRA: comprar, encomendar ou obter um produto/material
- NOTA: registar trabalho feito, observação, pendência ou qualquer outra nota
- LEMBRETE: criar um lembrete recorrente para um cliente (ex: "lembrar de tratar a piscina do João todos os meses")

Responde APENAS com JSON válido (sem markdown), com este formato:
{
  "type": "AGENDAMENTO" | "COMPRA" | "NOTA" | "LEMBRETE",
  "summary": "<resumo limpo do que foi dito, corrigindo erros de reconhecimento de voz>",
  "data": {
    // Para AGENDAMENTO:
    "clientName": "<nome do cliente se mencionado>",
    "date": "<data: YYYY-MM-DD se absoluta, ou uma das palavras-chave: hoje|amanhã|depois-de-amanhã|segunda|terça|quarta|quinta|sexta|sábado|domingo|semana-que-vem; null se não mencionada>",
    "time": "<hora em HH:MM se mencionada, null caso contrário>",
    "tasks": ["<tarefa 1>", "<tarefa 2>"],
    "serviceType": "<tipo de serviço principal: Jardim | Piscina | Jacuzzi | Geral>",
    "notes": "<notas adicionais>",
    // Para COMPRA:
    "item": "<nome do produto/material>",
    "quantity": "<quantidade e unidade se mencionadas>",
    "urgency": "low" | "normal" | "high",
    "notes": "<notas adicionais>",
    // Para NOTA:
    "description": "<descrição completa da nota/trabalho/pendência>",
    "serviceType": "<tipo de serviço: Jardim | Piscina | Jacuzzi | Geral>",
    "clientName": "<nome do cliente se mencionado>",
    // Para LEMBRETE:
    "clientName": "<nome do cliente>",
    "title": "<título/descrição do lembrete>",
    "serviceType": "<tipo de serviço: Jardim | Piscina | Jacuzzi | Geral>",
    "frequency": "<frequência: weekly | biweekly | monthly | quarterly | yearly>",
    "nextDue": "<data da próxima ocorrência: YYYY-MM-DD, ou palavra-chave: hoje|amanhã|depois-de-amanhã|segunda|terça|quarta|quinta|sexta|sábado|domingo; null se não mencionada>"
  }
}

Regras para AGENDAMENTO:
- "tasks" deve listar cada tarefa/serviço distinto mencionado (ex: ["Tratar piscina", "Cortar relva"]). Se só uma tarefa, coloca um array com um elemento.
- Para datas relativas usa as palavras-chave em português indicadas acima (não converta para YYYY-MM-DD).
- Se o técnico mencionar "dia 5", "dia 12", etc., usa o formato "dia-N" (ex: "dia-5").
- Se não houver data, usa null.

Regras para LEMBRETE:
- "frequency": interpreta palavras como "semanal"→weekly, "quinzenal"→biweekly, "mensal"→monthly, "trimestral"→quarterly, "anual"→yearly. Se não mencionada, usa "monthly".
- "nextDue": se não mencionada, usa null (será assumido hoje no servidor).`;

function resolveDate(raw: string | null | undefined, timeStr: string | null | undefined): Date {
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let resolved: Date;

  if (!raw) {
    resolved = base;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    resolved = new Date(raw + "T00:00:00");
  } else if (/^dia-(\d{1,2})$/.test(raw)) {
    const day = parseInt(raw.replace("dia-", ""), 10);
    resolved = new Date(base.getFullYear(), base.getMonth(), day);
    if (resolved <= base) resolved.setMonth(resolved.getMonth() + 1);
  } else {
    const keyword = raw.toLowerCase().trim();
    const dow: Record<string, number> = {
      "domingo": 0, "segunda": 1, "terça": 2, "quarta": 3,
      "quinta": 4, "sexta": 5, "sábado": 6,
    };
    if (keyword === "hoje") {
      resolved = base;
    } else if (keyword === "amanhã") {
      resolved = new Date(base); resolved.setDate(base.getDate() + 1);
    } else if (keyword === "depois-de-amanhã") {
      resolved = new Date(base); resolved.setDate(base.getDate() + 2);
    } else if (keyword === "semana-que-vem") {
      resolved = new Date(base);
      const daysUntilMonday = ((1 - base.getDay() + 7) % 7) || 7;
      resolved.setDate(base.getDate() + daysUntilMonday);
    } else if (dow[keyword] !== undefined) {
      const target = dow[keyword];
      let diff = target - base.getDay();
      if (diff <= 0) diff += 7;
      resolved = new Date(base); resolved.setDate(base.getDate() + diff);
    } else {
      resolved = base;
    }
  }

  if (timeStr && /^\d{2}:\d{2}$/.test(timeStr)) {
    const [h, m] = timeStr.split(":").map(Number);
    resolved.setHours(h, m, 0, 0);
  }

  return resolved;
}

export function registerAssistantRoutes(app: Express): void {
  app.post("/api/assistant/voice", requireAuth, async (req, res) => {
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

      const aiResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 512,
        system: CLASSIFY_SYSTEM,
        messages: [{ role: "user", content: text }],
      });

      const raw = aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "{}";
      let classified: { type: string; summary: string; data: Record<string, any> };

      try {
        classified = JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
      } catch {
        return res.status(422).json({ message: "Não foi possível classificar o relato" });
      }

      const { type, summary, data } = classified;

      if (type === "COMPRA") {
        await storage.createShoppingListItem({
          userId,
          item: data.item || summary,
          quantity: data.quantity ?? null,
          urgency: (data.urgency as string) || "normal",
          status: "pendente",
          notes: data.notes ?? null,
          clientId: null,
        });
        return res.json({ type, summary, message: "Item adicionado à lista de compras" });
      }

      if (type === "AGENDAMENTO") {
        const clients = await storage.getClients(userId);
        let clientId: number | null = null;
        let clientName: string | null = null;

        if (data.clientName) {
          const normalise = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
          const match = clients.find(c => normalise(c.name).includes(normalise(data.clientName)));
          if (match) { clientId = match.id; clientName = match.name; }
        }

        const appointmentDate = resolveDate(data.date, data.time);
        const tasks: string[] = Array.isArray(data.tasks) && data.tasks.length > 0
          ? data.tasks
          : [data.notes || summary];

        if (clientId) {
          const created = await Promise.all(
            tasks.map((task: string) =>
              storage.createAppointment({
                userId,
                clientId: clientId!,
                date: appointmentDate,
                type: data.serviceType || "Geral",
                serviceType: data.serviceType || null,
                notes: task,
                isCompleted: false,
              })
            )
          );
          return res.json({
            type,
            summary,
            message: `${created.length} agendamento(s) criado(s) para ${clientName}`,
            appointments: created.map(a => ({
              id: a.id,
              date: a.date,
              type: a.type,
              notes: a.notes,
            })),
          });
        }
        return res.json({ type, summary, message: "Agendamento registado como nota (cliente não identificado)", partial: true });
      }

      if (type === "NOTA") {
        const clients = await storage.getClients(userId);
        let clientId: number | null = null;

        if (data.clientName) {
          const normalise = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
          const match = clients.find(c => normalise(c.name).includes(normalise(data.clientName)));
          if (match) clientId = match.id;
        }

        if (clientId) {
          await storage.createPendingTask({
            clientId,
            description: data.description || summary,
            serviceType: data.serviceType || "Geral",
            priority: "normal",
            isCompleted: false,
            userId,
          });
          return res.json({ type, summary, message: "Nota guardada como tarefa pendente" });
        }
        return res.json({ type, summary, message: "Nota registada (cliente não identificado)" });
      }

      if (type === "LEMBRETE") {
        const clients = await storage.getClients(userId);
        let clientId: number | null = null;
        let clientName: string | null = null;

        if (data.clientName) {
          const normalise = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
          const match = clients.find(c => normalise(c.name).includes(normalise(data.clientName)));
          if (match) { clientId = match.id; clientName = match.name; }
        }

        if (!clientId) {
          return res.json({ type, summary, message: "Lembrete registado como nota (cliente não identificado)", partial: true });
        }

        const frequencyMap: Record<string, string> = {
          weekly: "weekly", biweekly: "biweekly", monthly: "monthly",
          quarterly: "quarterly", yearly: "yearly",
        };
        const frequency = frequencyMap[data.frequency] ?? "monthly";

        const serviceTypeMap: Record<string, string> = {
          "Jardim": "Garden", "Piscina": "Pool", "Jacuzzi": "Jacuzzi", "Geral": "General",
          "Garden": "Garden", "Pool": "Pool", "General": "General",
        };
        const reminderType = serviceTypeMap[data.serviceType] ?? "General";

        const nextDue = resolveDate(data.nextDue ?? null, null);

        await storage.createReminder({
          userId,
          clientId,
          title: data.title || summary,
          type: reminderType,
          frequency,
          nextDue,
          isActive: true,
        });

        return res.json({ type, summary, message: `Lembrete criado para ${clientName}` });
      }

      return res.json({ type, summary, message: "Relato processado" });

    } catch (err: any) {
      console.error("Assistant voice error:", err);
      res.status(500).json({ message: "Erro ao processar relato" });
    }
  });

  app.post("/api/ai/process-schedule", requireAuth, async (req, res) => {
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

      const clients = await storage.getClients(userId);
      const clientsContext = clients.map(c => `- Nome: ${c.name}${c.address ? `, Local: ${c.address}` : ""}`).join("\n");

      const promptAgendamento = `És o assistente da Peralta Gardens. O teu trabalho é extrair dados de agendamento.
Data atual: ${new Date().toISOString()}

Lista de clientes existentes na base de dados (nome + local de residência/obra):
${clientsContext || "(sem clientes registados)"}

Extrai:
1. Cliente (Nome) — compara o nome ouvido com a lista de clientes acima. Se o nome ouvido incluir uma localidade/morada que coincide com o "Local" de um cliente da lista, usa apenas o primeiro nome/apelido desse cliente como "cliente" e a localidade como "local". Preserva o nome próprio exatamente como aparece na lista. Não traduzas nem corrijas nomes de pessoas.
2. Local (Se mencionado, ou inferido da lista de clientes)
3. Data (Formata como YYYY-MM-DD)
4. Tarefas (Lista separada) — usa sempre Português Europeu para descrever as tarefas de manutenção.
Responde APENAS com um JSON válido (sem markdown) neste formato:
{ "cliente": string, "local": string, "data": string, "tarefas": string[] }`;

      const aiResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 512,
        system: promptAgendamento,
        messages: [{ role: "user", content: text }],
      });

      const raw = aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "{}";
      let draft: { cliente: string; local: string; data: string; tarefas: string[] };

      try {
        draft = JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
      } catch {
        return res.status(422).json({ message: "Não foi possível extrair os dados do agendamento" });
      }

      return res.json(draft);

    } catch (err: any) {
      console.error("Process schedule error:", err);
      res.status(500).json({ message: "Erro ao processar agendamento" });
    }
  });

  app.post("/api/ai/confirm-schedule", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;

      const rateCheck = checkAssistantRateLimit(userId);
      if (!rateCheck.allowed) {
        res.setHeader("Retry-After", String(rateCheck.retryAfterSeconds));
        return res.status(429).json({ message: `Limite de mensagens atingido. Tente novamente em ${Math.ceil(rateCheck.retryAfterSeconds / 60)} minuto(s).` });
      }

      const { cliente, local, data, tarefas, serviceType, time } = req.body;

      if (!cliente || !data || !Array.isArray(tarefas) || tarefas.length === 0) {
        return res.status(400).json({ message: "Dados incompletos: cliente, data e tarefas são obrigatórios" });
      }

      const clients = await storage.getClients(userId);
      const normalise = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      const match = clients.find(c => normalise(c.name).includes(normalise(cliente)));

      if (!match) {
        return res.status(404).json({ message: `Cliente "${cliente}" não encontrado` });
      }

      const appointmentDate = resolveDate(data, time ?? null);

      const created = await Promise.all(
        tarefas.map((task: string) =>
          storage.createAppointment({
            userId,
            clientId: match.id,
            date: appointmentDate,
            type: serviceType || "Geral",
            serviceType: serviceType || null,
            notes: task,
            isCompleted: false,
          })
        )
      );

      return res.json({
        message: `${created.length} agendamento(s) criado(s) para ${match.name}`,
        appointments: created.map(a => ({ id: a.id, date: a.date, type: a.type, notes: a.notes })),
      });

    } catch (err: any) {
      console.error("Confirm schedule error:", err);
      res.status(500).json({ message: "Erro ao guardar agendamento" });
    }
  });

  app.post("/api/ai/extract-client", requireAuth, async (req, res) => {
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

      const aiResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 256,
        system: `És um assistente de extração de dados de contacto. Extrai nome, telefone, indicativo de país (DDI) e email de texto ditado por voz.
Preserva nomes próprios exatamente como foram ditos (não traduzas).
Responde APENAS com JSON válido (sem markdown):
{ "name": string, "phone": string | null, "countryCode": string | null, "email": string | null }
- "countryCode": indicativo internacional (ex: "+351", "+44", "+33"). Se não mencionado, usa null.
- "phone": apenas o número local sem indicativo (ex: "912345678"). Se não mencionado, null.
- Se o número for dado completo com indicativo, separa-os. Se não conseguires separar, coloca o número completo em "phone" e null em "countryCode".`,
        messages: [{ role: "user", content: text }],
      });

      const raw = aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "{}";
      let extracted: { name: string; phone: string | null; countryCode: string | null; email: string | null };

      try {
        extracted = JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
      } catch {
        return res.status(422).json({ message: "Não foi possível extrair os dados do cliente" });
      }

      return res.json(extracted);

    } catch (err: any) {
      console.error("Extract client error:", err);
      res.status(500).json({ message: "Erro ao extrair dados do cliente" });
    }
  });
}
