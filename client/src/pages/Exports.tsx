import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText, FileSpreadsheet, Download, Receipt, ShoppingCart, Users, TrendingUp } from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type { Client, PurchaseWithDetails, ClientPayment } from "@shared/schema";
import { PageHeader } from "@/components/PageHeader";

function exportToCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const csv = [headers.map(escape).join(","), ...rows.map(r => headers.map(h => escape(r[h])).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const MONTHS = [
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

export default function Exports() {
  const { toast } = useToast();
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString());
  const [isExporting, setIsExporting] = useState(false);

  const years = [
    currentDate.getFullYear().toString(),
    (currentDate.getFullYear() - 1).toString(),
    (currentDate.getFullYear() - 2).toString(),
  ];

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: purchases } = useQuery<PurchaseWithDetails[]>({
    queryKey: ["/api/purchases"],
  });

  const { data: payments } = useQuery<(ClientPayment & { client: Client })[]>({
    queryKey: ["/api/client-payments", selectedYear, selectedMonth],
    queryFn: async () => {
      const res = await fetch(`/api/client-payments?year=${selectedYear}&month=${selectedMonth}`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const monthName = MONTHS.find(m => m.value === selectedMonth)?.label || "";

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-PT", { style: "currency", currency: "EUR" });

  const filterPurchasesByMonth = () => {
    if (!purchases) return [];
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth) - 1;
    const start = startOfMonth(new Date(year, month));
    const end = endOfMonth(new Date(year, month));
    
    return purchases.filter(p => {
      const date = new Date(p.purchaseDate);
      return date >= start && date <= end;
    });
  };

  const exportPaymentsPDF = () => {
    if (!payments || payments.length === 0) {
      toast({ title: "Sem dados", description: "Não há pagamentos para exportar", variant: "destructive" });
      return;
    }

    setIsExporting(true);
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.setTextColor(45, 90, 39);
      doc.text("ServNtrak", 14, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Pagamentos de Clientes - ${monthName} ${selectedYear}`, 14, 30);
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: pt })}`, 14, 36);

      const tableData = payments.map(p => [
        p.client?.name || "N/A",
        formatCurrency(p.amount),
        p.isPaid ? "Pago" : "Pendente",
        p.paidAt ? format(new Date(p.paidAt), "dd/MM/yyyy", { locale: pt }) : "-",
        p.notes || "-"
      ]);

      const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
      const paidAmount = payments.filter(p => p.isPaid).reduce((sum, p) => sum + p.amount, 0);

      autoTable(doc, {
        startY: 45,
        head: [["Cliente", "Valor", "Estado", "Data Pagamento", "Notas"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [45, 90, 39] },
        foot: [[
          "TOTAL",
          formatCurrency(totalAmount),
          `Recebido: ${formatCurrency(paidAmount)}`,
          "",
          ""
        ]],
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
      });

      doc.save(`pagamentos_${monthName.toLowerCase()}_${selectedYear}.pdf`);
      toast({ title: "Exportado", description: "PDF gerado com sucesso" });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao gerar PDF", variant: "destructive" });
    }
    setIsExporting(false);
  };

  const exportPaymentsExcel = () => {
    if (!payments || payments.length === 0) {
      toast({ title: "Sem dados", description: "Não há pagamentos para exportar", variant: "destructive" });
      return;
    }

    setIsExporting(true);
    try {
      const data = payments.map(p => ({
        "Cliente": p.client?.name || "N/A",
        "Valor": p.amount,
        "Estado": p.isPaid ? "Pago" : "Pendente",
        "Data Pagamento": p.paidAt ? format(new Date(p.paidAt), "dd/MM/yyyy", { locale: pt }) : "-",
        "Notas": p.notes || "-"
      }));

      exportToCsv(`pagamentos_${monthName.toLowerCase()}_${selectedYear}.csv`, data);
      toast({ title: "Exportado", description: "Excel gerado com sucesso" });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao gerar Excel", variant: "destructive" });
    }
    setIsExporting(false);
  };

  const exportPurchasesPDF = () => {
    const monthPurchases = filterPurchasesByMonth();
    if (monthPurchases.length === 0) {
      toast({ title: "Sem dados", description: "Não há compras para exportar", variant: "destructive" });
      return;
    }

    setIsExporting(true);
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.setTextColor(45, 90, 39);
      doc.text("ServNtrak", 14, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Despesas - ${monthName} ${selectedYear}`, 14, 30);
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: pt })}`, 14, 36);

      const tableData = monthPurchases.map(p => [
        format(new Date(p.purchaseDate), "dd/MM", { locale: pt }),
        p.store?.name || "N/A",
        p.category?.name || "N/A",
        p.productName || "-",
        formatCurrency(p.finalTotal),
        p.client?.name || "-"
      ]);

      const total = monthPurchases.reduce((sum, p) => sum + p.finalTotal, 0);

      autoTable(doc, {
        startY: 45,
        head: [["Data", "Loja", "Categoria", "Descrição", "Total", "Cliente"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [45, 90, 39] },
        columnStyles: {
          0: { cellWidth: 20 },
          4: { cellWidth: 25, halign: "right" },
        },
        foot: [["", "", "", "TOTAL", formatCurrency(total), ""]],
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
      });

      doc.save(`despesas_${monthName.toLowerCase()}_${selectedYear}.pdf`);
      toast({ title: "Exportado", description: "PDF gerado com sucesso" });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao gerar PDF", variant: "destructive" });
    }
    setIsExporting(false);
  };

  const exportPurchasesExcel = () => {
    const monthPurchases = filterPurchasesByMonth();
    if (monthPurchases.length === 0) {
      toast({ title: "Sem dados", description: "Não há compras para exportar", variant: "destructive" });
      return;
    }

    setIsExporting(true);
    try {
      const data = monthPurchases.map(p => ({
        "Data": format(new Date(p.purchaseDate), "dd/MM/yyyy", { locale: pt }),
        "Loja": p.store?.name || "N/A",
        "Categoria": p.category?.name || "N/A",
        "Produto": p.productName || "-",
        "Quantidade": p.quantity,
        "Valor s/ Desconto": p.totalWithoutDiscount,
        "Desconto": p.discountValue || 0,
        "Total Final": p.finalTotal,
        "Cliente Associado": p.client?.name || "-"
      }));

      exportToCsv(`despesas_${monthName.toLowerCase()}_${selectedYear}.csv`, data);
      toast({ title: "Exportado", description: "Excel gerado com sucesso" });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao gerar Excel", variant: "destructive" });
    }
    setIsExporting(false);
  };

  const exportFinancialSummaryPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.setTextColor(45, 90, 39);
      doc.text("ServNtrak", 14, 20);
      
      doc.setFontSize(14);
      doc.setTextColor(60);
      doc.text(`Resumo Financeiro - ${selectedYear}`, 14, 32);
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: pt })}`, 14, 40);

      const year = parseInt(selectedYear);
      const monthlyData: { month: string; receitas: number; despesas: number; lucro: number }[] = [];

      for (let month = 1; month <= 12; month++) {
        const res = await fetch(`/api/client-payments?year=${year}&month=${month}`, {
          credentials: "include",
        });
        const monthPayments = res.ok ? await res.json() : [];
        
        const monthStart = startOfMonth(new Date(year, month - 1));
        const monthEnd = endOfMonth(new Date(year, month - 1));
        
        const monthPurchases = (purchases || []).filter(p => {
          const date = new Date(p.purchaseDate);
          return date >= monthStart && date <= monthEnd;
        });

        const receitas = monthPayments
          .filter((p: any) => p.isPaid)
          .reduce((sum: number, p: any) => sum + p.amount, 0);
        const despesas = monthPurchases.reduce((sum, p) => sum + p.finalTotal, 0);

        monthlyData.push({
          month: MONTHS[month - 1].label,
          receitas,
          despesas,
          lucro: receitas - despesas,
        });
      }

      autoTable(doc, {
        startY: 50,
        head: [["Mês", "Receitas", "Despesas", "Lucro"]],
        body: monthlyData.map(m => [
          m.month,
          formatCurrency(m.receitas),
          formatCurrency(m.despesas),
          formatCurrency(m.lucro)
        ]),
        theme: "striped",
        headStyles: { fillColor: [45, 90, 39] },
        columnStyles: {
          1: { halign: "right" },
          2: { halign: "right" },
          3: { halign: "right" },
        },
        foot: [[
          "TOTAL ANUAL",
          formatCurrency(monthlyData.reduce((s, m) => s + m.receitas, 0)),
          formatCurrency(monthlyData.reduce((s, m) => s + m.despesas, 0)),
          formatCurrency(monthlyData.reduce((s, m) => s + m.lucro, 0))
        ]],
        footStyles: { fillColor: [45, 90, 39], textColor: [255, 255, 255], fontStyle: "bold" },
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 200;
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text("Este documento foi gerado automaticamente pela aplicação ServNtrak.", 14, finalY + 15);

      doc.save(`resumo_financeiro_${selectedYear}.pdf`);
      toast({ title: "Exportado", description: "Resumo financeiro gerado com sucesso" });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao gerar resumo", variant: "destructive" });
    }
    setIsExporting(false);
  };

  const exportClientListPDF = () => {
    if (!clients || clients.length === 0) {
      toast({ title: "Sem dados", description: "Não há clientes para exportar", variant: "destructive" });
      return;
    }

    setIsExporting(true);
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.setTextColor(45, 90, 39);
      doc.text("ServNtrak", 14, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text("Lista de Clientes", 14, 30);
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: pt })}`, 14, 36);
      doc.text(`Total: ${clients.length} clientes`, 14, 42);

      const tableData = clients.map(c => {
        const services = [];
        if (c.hasGarden) services.push("Jardim");
        if (c.hasPool) services.push("Piscina");
        if (c.hasJacuzzi) services.push("Jacuzzi");
        return [
          c.name,
          c.phone || "-",
          c.address || "-",
          services.join(", ") || "Geral",
          formatCurrency(c.monthlyRate || 0)
        ];
      });

      autoTable(doc, {
        startY: 50,
        head: [["Nome", "Telefone", "Morada", "Serviços", "Mensalidade"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [45, 90, 39] },
        columnStyles: {
          4: { halign: "right" },
        },
      });

      doc.save(`clientes_peralta_gardens.pdf`);
      toast({ title: "Exportado", description: "Lista de clientes gerada com sucesso" });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao gerar PDF", variant: "destructive" });
    }
    setIsExporting(false);
  };

  const exportClientListExcel = () => {
    if (!clients || clients.length === 0) {
      toast({ title: "Sem dados", description: "Não há clientes para exportar", variant: "destructive" });
      return;
    }

    setIsExporting(true);
    try {
      const data = clients.map(c => {
        const services = [];
        if (c.hasGarden) services.push("Jardim");
        if (c.hasPool) services.push("Piscina");
        if (c.hasJacuzzi) services.push("Jacuzzi");
        return {
          "Nome": c.name,
          "Telefone": c.phone || "-",
          "Email": c.email || "-",
          "Morada": c.address || "-",
          "Serviços": services.join(", ") || "Geral",
          "Mensalidade": c.monthlyRate || 0,
          "Notas": c.notes || "-"
        };
      });

      exportToCsv(`clientes_peralta_gardens.csv`, data);
      toast({ title: "Exportado", description: "Excel de clientes gerado com sucesso" });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao gerar Excel", variant: "destructive" });
    }
    setIsExporting(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Exportar Dados"
        subtitle="Gerar PDF e Excel para contabilidade"
        backHref="/more"
      />

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="w-4 h-4" />
              Período de Exportação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground mb-1 block">Mês</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger data-testid="select-export-month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm text-muted-foreground mb-1 block">Ano</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger data-testid="select-export-year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(y => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="w-4 h-4 text-green-600" />
              Pagamentos de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Exportar pagamentos de {monthName} {selectedYear}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={exportPaymentsPDF}
                disabled={isExporting}
                data-testid="button-export-payments-pdf"
              >
                <FileText className="w-4 h-4 text-red-500" />
                PDF
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={exportPaymentsExcel}
                disabled={isExporting}
                data-testid="button-export-payments-excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              Despesas / Compras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Exportar compras e despesas de {monthName} {selectedYear}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={exportPurchasesPDF}
                disabled={isExporting}
                data-testid="button-export-purchases-pdf"
              >
                <FileText className="w-4 h-4 text-red-500" />
                PDF
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={exportPurchasesExcel}
                disabled={isExporting}
                data-testid="button-export-purchases-excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Resumo Financeiro Anual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Resumo de receitas, despesas e lucro de {selectedYear}
            </p>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={exportFinancialSummaryPDF}
              disabled={isExporting}
              data-testid="button-export-summary-pdf"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 text-red-500" />
              )}
              Gerar PDF do Resumo Anual
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              Lista de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Exportar lista completa de clientes
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={exportClientListPDF}
                disabled={isExporting}
                data-testid="button-export-clients-pdf"
              >
                <FileText className="w-4 h-4 text-red-500" />
                PDF
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={exportClientListExcel}
                disabled={isExporting}
                data-testid="button-export-clients-excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
