import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import type { ServiceLogWithEntries, Client } from "@shared/schema";
import logoUrl from "@assets/logo.png";

interface AutoTableResult {
  finalY?: number;
}

function runAutoTable(doc: jsPDF, options: Parameters<typeof autoTable>[1]): AutoTableResult {
  autoTable(doc, options);
  const docRecord = doc as unknown as Record<string, AutoTableResult>;
  return docRecord["lastAutoTable"] ?? { finalY: options.startY };
}

function loadImageAsDataUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas 2D context unavailable"));
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Failed to load logo image"));
    img.src = url;
  });
}

const SERVICE_LABELS: Record<string, string> = {
  Garden: "Jardim",
  Pool: "Piscina",
  Jacuzzi: "Jacuzzi",
  General: "Geral",
};

const COLORS = {
  brand: [45, 90, 39] as [number, number, number],
  dark: [30, 30, 30] as [number, number, number],
  grey: [120, 120, 120] as [number, number, number],
  lightGrey: [200, 200, 200] as [number, number, number],
  tableHead: [45, 90, 39] as [number, number, number],
  tableFoot: [240, 240, 240] as [number, number, number],
};

export async function generateServiceNote(
  log: ServiceLogWithEntries,
  client: Pick<Client, "name" | "address" | "phone" | "email">
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const logoSize = 28;
  const textStartX = margin + logoSize + 6;

  try {
    const logoData = await loadImageAsDataUrl(logoUrl);
    doc.addImage(logoData, "PNG", margin, 12, logoSize, logoSize);
  } catch {
    // logo failed to load silently — subtitle/contact lines remain
  }

  let y = 18;
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.grey);
  doc.text("Manutenção de Jardins, Piscinas e Jacuzzis", textStartX, y);

  y += 4;
  doc.text("Lourinhã, Portugal · Tel: 912 000 000 · info@peraltagardens.pt", textStartX, y);

  doc.setFontSize(14);
  doc.setTextColor(...COLORS.dark);
  doc.text("Nota de Despesa", pageWidth - margin, 18, { align: "right" });

  doc.setFontSize(9);
  doc.setTextColor(...COLORS.grey);
  doc.text(
    `Data: ${format(new Date(log.date), "d 'de' MMMM 'de' yyyy", { locale: pt })}`,
    pageWidth - margin,
    25,
    { align: "right" }
  );

  y = 12 + logoSize + 6;
  doc.setDrawColor(...COLORS.lightGrey);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.dark);
  doc.setFont("helvetica", "bold");
  doc.text("Cliente", margin, y);
  doc.setFont("helvetica", "normal");

  y += 6;
  doc.setFontSize(12);
  doc.text(client.name, margin, y);

  if (client.address) {
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.grey);
    doc.text(client.address, margin, y);
  }

  if (client.phone) {
    y += 4;
    doc.setFontSize(9);
    doc.text(`Tel: ${client.phone}`, margin, y);
  }

  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.dark);
  doc.setFont("helvetica", "bold");
  doc.text("Serviço Realizado", margin, y);
  doc.setFont("helvetica", "normal");

  y += 6;
  doc.setFontSize(9);
  const serviceLabel = SERVICE_LABELS[log.type] || log.type;
  doc.text(`Tipo: ${serviceLabel}`, margin, y);

  if (log.billingType === "extra") {
    doc.setTextColor(180, 100, 0);
    doc.text("  (Serviço Extra)", margin + doc.getTextWidth(`Tipo: ${serviceLabel}`), y);
    doc.setTextColor(...COLORS.dark);
  }

  if (log.description) {
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.grey);
    const descLines = doc.splitTextToSize(log.description, pageWidth - margin * 2);
    doc.text(descLines, margin, y);
    y += descLines.length * 4;
  }

  y += 4;

  if (log.laborEntries && log.laborEntries.length > 0) {
    y += 4;
    const laborResult = runAutoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Trabalhador", "Horas", "Taxa/h (€)", "Subtotal (€)"]],
      body: log.laborEntries.map((e) => [
        e.workerName,
        e.hours.toFixed(1),
        e.hourlyRate.toFixed(2),
        e.cost.toFixed(2),
      ]),
      foot: [
        [
          { content: "Subtotal Mão-de-Obra", colSpan: 3, styles: { halign: "right" as const } },
          (log.laborSubtotal ?? 0).toFixed(2),
        ],
      ],
      theme: "striped",
      headStyles: { fillColor: COLORS.tableHead, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      footStyles: {
        fillColor: COLORS.tableFoot,
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 8,
      },
    });
    y = (laborResult.finalY ?? y) + 6;
  }

  if (log.materialEntries && log.materialEntries.length > 0) {
    const materialsResult = runAutoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Material", "Qtd.", "Preço Unit. (€)", "Subtotal (€)"]],
      body: log.materialEntries.map((e) => [
        e.materialName,
        e.quantity.toString(),
        e.unitPrice.toFixed(2),
        e.cost.toFixed(2),
      ]),
      foot: [
        [
          { content: "Subtotal Materiais", colSpan: 3, styles: { halign: "right" as const } },
          (log.materialsSubtotal ?? 0).toFixed(2),
        ],
      ],
      theme: "striped",
      headStyles: { fillColor: COLORS.tableHead, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      footStyles: {
        fillColor: COLORS.tableFoot,
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 8,
      },
    });
    y = (materialsResult.finalY ?? y) + 6;
  }

  const total = log.totalAmount ?? 0;
  if (total > 0) {
    y += 2;
    doc.setDrawColor(...COLORS.brand);
    doc.setLineWidth(0.5);
    doc.line(pageWidth - margin - 80, y, pageWidth - margin, y);

    y += 8;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.dark);
    doc.text("Total:", pageWidth - margin - 80, y);
    doc.text(`${total.toFixed(2)} €`, pageWidth - margin, y, { align: "right" });
    doc.setFont("helvetica", "normal");

    y += 4;
    doc.setDrawColor(...COLORS.brand);
    doc.setLineWidth(0.5);
    doc.line(pageWidth - margin - 80, y, pageWidth - margin, y);
  }

  const footerY = doc.internal.pageSize.getHeight() - 16;
  doc.setDrawColor(...COLORS.lightGrey);
  doc.setLineWidth(0.2);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFontSize(7);
  doc.setTextColor(...COLORS.grey);
  doc.text(
    "Documento não oficial — apenas para informação do cliente.",
    pageWidth / 2,
    footerY,
    { align: "center" }
  );
  doc.text(
    `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: pt })} · Peralta Gardens`,
    pageWidth / 2,
    footerY + 4,
    { align: "center" }
  );

  const clientSlug = client.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .toLowerCase();
  const dateSlug = format(new Date(log.date), "yyyy-MM-dd");
  doc.save(`nota_${clientSlug}_${dateSlug}.pdf`);
}
