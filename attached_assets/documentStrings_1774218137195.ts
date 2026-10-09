/**
 * documentStrings.ts
 * Strings bilingues para documentos PDF emitidos pela app.
 * Suporta: 'pt' (Português) | 'en' (Inglês)
 *
 * Localização: client/src/lib/documentStrings.ts
 *
 * Para adicionar uma nova língua no futuro:
 *   1. Adicionar o código ao tipo Language
 *   2. Adicionar as traduções ao objecto strings[novaLingua]
 *   3. Atualizar o campo preferredLanguage na BD
 */

export type Language = "pt" | "en";

export const documentStrings = {
  pt: {
    // Nota de Despesa
    expenseNote: {
      title: "NOTA DE DESPESA",
      number: "Nº",
      date: "Data",
      client: "CLIENTE",
      phone: "Tel",
      serviceRef: "Referente a serviço realizado em",
      typeLabels: {
        service: "Serviço",
        material: "Material",
        labor: "Mão de obra",
      },
      tableHeaders: {
        type: "Tipo",
        description: "Descrição",
        qty: "Qtd.",
        unitPrice: "Preço unit.",
        total: "Total",
      },
      grandTotal: "TOTAL",
      editedWarning: "Itens com divergência em relação ao registo original:",
      observations: "Observações:",
    },
    // Orçamento (futuro)
    quote: {
      title: "ORÇAMENTO",
      number: "Nº",
      date: "Data",
      validUntil: "Válido até",
      client: "CLIENTE",
      phone: "Tel",
      tableHeaders: {
        description: "Descrição",
        qty: "Qtd.",
        unitPrice: "Preço unit.",
        total: "Total",
      },
      grandTotal: "TOTAL",
      observations: "Observações:",
      acceptance: "Aceite pelo cliente:",
      signature: "Assinatura: ___________________________",
    },
  },

  en: {
    // Expense Note
    expenseNote: {
      title: "EXPENSE NOTE",
      number: "No.",
      date: "Date",
      client: "CLIENT",
      phone: "Tel",
      serviceRef: "Reference to service carried out on",
      typeLabels: {
        service: "Service",
        material: "Material",
        labor: "Labour",
      },
      tableHeaders: {
        type: "Type",
        description: "Description",
        qty: "Qty.",
        unitPrice: "Unit price",
        total: "Total",
      },
      grandTotal: "TOTAL",
      editedWarning: "Items diverging from the original service record:",
      observations: "Notes:",
    },
    // Quote (future)
    quote: {
      title: "QUOTE",
      number: "No.",
      date: "Date",
      validUntil: "Valid until",
      client: "CLIENT",
      phone: "Tel",
      tableHeaders: {
        description: "Description",
        qty: "Qty.",
        unitPrice: "Unit price",
        total: "Total",
      },
      grandTotal: "TOTAL",
      observations: "Notes:",
      acceptance: "Accepted by client:",
      signature: "Signature: ___________________________",
    },
  },
} as const;

export type DocumentStrings = typeof documentStrings;

/** Helper — devolve as strings da língua pedida com fallback para PT */
export function getStrings(lang?: Language | null) {
  return documentStrings[lang ?? "pt"];
}
