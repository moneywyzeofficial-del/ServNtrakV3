/**
 * expenseNotesPdf.ts
 * Gerador de PDF para Notas de Despesa.
 * Usa o documentTemplate.ts para cabeçalho/rodapé.
 *
 * Localização sugerida: client/src/lib/expenseNotesPdf.ts
 *
 * Uso:
 *   import { generateExpenseNotePdf } from "@/lib/expenseNotesPdf";
 *   const doc = generateExpenseNotePdf(expenseNote);
 *   doc.save(`ND-${expenseNote.noteNumber}.pdf`);
 *   // ou para Web Share:
 *   const blob = doc.output("blob");
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  applyDocumentTemplate,
  CONTENT_START_Y,
  PAGE_WIDTH,
  MARGIN,
  CONTENT_WIDTH,
} from "@/lib/documentTemplate";
import type { ExpenseNoteWithDetails } from "@shared/schema";

const PRIMARY_COLOR: [number, number, number] = [83, 129, 53];   // #538135 verde
const HEADER_BG: [number, number, number] = [240, 246, 235];      // verde muito claro
const EDITED_COLOR: [number, number, number] = [180, 100, 0];    // laranja — linha editada

export function generateExpenseNotePdf(note: ExpenseNoteWithDetails): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  let y = CONTENT_START_Y;

  // ── Título do documento ────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text("NOTA DE DESPESA", MARGIN, y);
  y += 7;

  // Número e data
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  const dateStr = note.issueDate
    ? new Date(note.issueDate).toLocaleDateString("pt-PT")
    : new Date().toLocaleDateString("pt-PT");
  doc.text(`Nº ${note.noteNumber}`, MARGIN, y);
  doc.text(`Data: ${dateStr}`, PAGE_WIDTH - MARGIN, y, { align: "right" });
  y += 2;

  // Linha separadora
  doc.setDrawColor(...PRIMARY_COLOR);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 6;

  // ── Dados do cliente ───────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text("CLIENTE", MARGIN, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(note.client.name, MARGIN, y);
  y += 5;

  if (note.client.address) {
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text(note.client.address, MARGIN, y);
    y += 4;
  }

  if (note.client.phone) {
    doc.text(`Tel: ${note.client.phone}`, MARGIN, y);
    y += 4;
  }

  y += 4;

  // ── Referência ao serviceLog ───────────────────────────────
  if (note.serviceLog) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    const logDate = note.serviceLog.serviceDate
      ? new Date(note.serviceLog.serviceDate).toLocaleDateString("pt-PT")
      : "";
    doc.text(
      `Referente a serviço realizado em ${logDate}`,
      MARGIN,
      y
    );
    y += 6;
  }

  // ── Tabela de itens ────────────────────────────────────────
  const typeLabels: Record<string, string> = {
    service: "Serviço",
    material: "Material",
    labor: "Mão de obra",
  };

  const tableRows = note.items.map((item) => [
    typeLabels[item.type] ?? item.type,
    item.description + (item.sourceType === "edited" ? " ⚠" : ""),
    item.quantity.toString(),
    `${item.unitPrice.toFixed(2)} €`,
    `${item.total.toFixed(2)} €`,
  ]);

  // Calcular total geral
  const grandTotal = note.items.reduce((sum, item) => sum + item.total, 0);

  autoTable(doc, {
    startY: y,
    head: [["Tipo", "Descrição", "Qtd.", "Preço unit.", "Total"]],
    body: tableRows,
    foot: [["", "", "", "TOTAL", `${grandTotal.toFixed(2)} €`]],
    margin: { left: MARGIN, right: MARGIN },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: PRIMARY_COLOR,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    footStyles: {
      fillColor: HEADER_BG,
      textColor: [40, 40, 40],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [250, 253, 248],
    },
    // Linhas editadas em laranja
    didParseCell: (data) => {
      if (data.section === "body") {
        const item = note.items[data.row.index];
        if (item?.sourceType === "edited") {
          data.cell.styles.textColor = EDITED_COLOR;
          data.cell.styles.fontStyle = "italic";
        }
      }
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY ?? y + 40;

  // ── Nota sobre itens editados (se existirem) ───────────────
  const editedItems = note.items.filter((i) => i.sourceType === "edited");
  if (editedItems.length > 0) {
    let noteY = finalY + 6;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(...EDITED_COLOR);
    doc.text("⚠ Itens com divergência em relação ao registo original:", MARGIN, noteY);
    noteY += 4;
    editedItems.forEach((item) => {
      doc.text(
        `  • ${item.description}: ${item.editReason ?? "sem justificação"}`,
        MARGIN,
        noteY
      );
      noteY += 4;
    });
  }

  // ── Observações gerais ─────────────────────────────────────
  if (note.notes) {
    let obsY = finalY + (editedItems.length > 0 ? editedItems.length * 4 + 14 : 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    doc.text("Observações:", MARGIN, obsY);
    obsY += 4;
    const lines = doc.splitTextToSize(note.notes, CONTENT_WIDTH);
    doc.text(lines, MARGIN, obsY);
  }

  // ── Aplicar template (logo + rodapé) em todas as páginas ──
  applyDocumentTemplate(doc);

  return doc;
}

/**
 * Partilha o PDF via Web Share API (WhatsApp, email, etc.)
 * Fallback para download se Web Share não disponível.
 */
export async function shareExpenseNotePdf(
  note: ExpenseNoteWithDetails
): Promise<void> {
  const doc = generateExpenseNotePdf(note);
  const fileName = `Nota-Despesa-${note.noteNumber}.pdf`;

  if (navigator.canShare) {
    const blob = doc.output("blob");
    const file = new File([blob], fileName, { type: "application/pdf" });
    if (navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: fileName });
      return;
    }
  }

  // Fallback: download directo
  doc.save(fileName);
}
