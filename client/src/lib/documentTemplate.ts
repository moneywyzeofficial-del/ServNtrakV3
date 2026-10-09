import jsPDF from "jspdf";
import logoUrl from "@assets/logo.png";

export const PAGE_WIDTH = 210;
export const PAGE_HEIGHT = 297;
export const MARGIN = 15;
export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const LOGO_SIZE = 30;
const LOGO_X = PAGE_WIDTH - MARGIN - LOGO_SIZE;
const LOGO_Y = 10;

export const CONTENT_START_Y = LOGO_Y + LOGO_SIZE + 8;

const BANKING_Y = PAGE_HEIGHT - 26;
const FOOTER_LINE_Y = PAGE_HEIGHT - 20;
const LEGAL_Y = PAGE_HEIGHT - 15;
const FOOTER_TEXT_Y = PAGE_HEIGHT - 9;
const FOOTER_COLOR: [number, number, number] = [83, 129, 53];

// Carrega o logo como data URL via canvas (mesmo padrão de generateServiceNote.ts)
async function _loadLogoDataUrl(): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(null); return; }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = logoUrl;
  });
}

export async function applyDocumentTemplate(doc: jsPDF): Promise<void> {
  const logoDataUrl = await _loadLogoDataUrl();
  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    _drawHeader(doc, logoDataUrl);
    _drawFooter(doc);
  }
}

export async function applyTemplateToCurrentPage(doc: jsPDF): Promise<void> {
  const logoDataUrl = await _loadLogoDataUrl();
  _drawHeader(doc, logoDataUrl);
  _drawFooter(doc);
}

function _drawHeader(doc: jsPDF, logoDataUrl: string | null): void {
  if (!logoDataUrl) return;
  try {
    doc.addImage(logoDataUrl, "PNG", LOGO_X, LOGO_Y, LOGO_SIZE, LOGO_SIZE);
  } catch {
    console.warn("documentTemplate: falha ao carregar logo");
  }
}

function _drawFooter(doc: jsPDF): void {
  // Dados bancários — linha única, letra pequena, acima da linha verde
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...FOOTER_COLOR);
  doc.text(
    "CGD: PT50 0035 0405 0001 2321 4004 3  ·  BIC: CGDIPTPL     |     Montepio: PT50 0036 0275 9910 0034 6181 1  ·  BIC: MPIOPTPL     |     MBWay: +351 918 297 502",
    MARGIN,
    BANKING_Y,
    { maxWidth: CONTENT_WIDTH }
  );

  // Linha verde
  doc.setDrawColor(...FOOTER_COLOR);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, FOOTER_LINE_Y, PAGE_WIDTH - MARGIN, FOOTER_LINE_Y);

  // Nota legal — entre a linha e o contacto
  doc.setFont("helvetica", "italic");
  doc.setFontSize(6);
  doc.setTextColor(...FOOTER_COLOR);
  doc.text(
    "Este documento não constitui fatura fiscal nem tem validade legal para efeitos tributários.",
    PAGE_WIDTH / 2,
    LEGAL_Y,
    { align: "center", maxWidth: CONTENT_WIDTH }
  );

  // Contacto
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...FOOTER_COLOR);
  doc.text(
    "Tiago Santos – 918 297 502   ·   peraltagardens@gmail.com",
    PAGE_WIDTH / 2,
    FOOTER_TEXT_Y,
    { align: "center" }
  );

  // Reset
  doc.setDrawColor(0);
  doc.setTextColor(0);
}
