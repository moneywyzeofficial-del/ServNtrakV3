import { useQuery, useMutation } from "@tanstack/react-query";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Clock, AlertCircle, RefreshCw, Euro, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useState, useMemo } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import type { ClientPaymentWithClient } from "@shared/schema";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type ColumnDef, type SortDir } from "@/components/ui/data-table";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function Payments() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString());
  const { toast } = useToast();

  const years = useMemo(() => {
    const currentYear = currentDate.getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2].map(y => y.toString());
  }, []);

  const { data: payments, isLoading } = useQuery<ClientPaymentWithClient[]>({
    queryKey: ['/api/client-payments', selectedYear, selectedMonth],
    queryFn: async () => {
      const res = await fetch(`/api/client-payments?year=${selectedYear}&month=${selectedMonth}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha ao carregar pagamentos");
      return res.json();
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('PUT', `/api/client-payments/${id}/paid`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client-payments'] });
      toast({ title: "Pagamento registado", description: "O pagamento foi marcado como recebido." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível registar o pagamento.", variant: "destructive" });
    },
  });

  const generatePaymentsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/client-payments/generate', {
        year: parseInt(selectedYear),
        month: parseInt(selectedMonth),
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/client-payments'] });
      const count = Array.isArray(data) ? data.length : 0;
      if (count > 0) {
        toast({ title: "Pagamentos gerados", description: `${count} pagamento(s) criado(s) para ${MONTHS[parseInt(selectedMonth) - 1]}.` });
      } else {
        toast({ title: "Sem novos pagamentos", description: "Todos os clientes já têm pagamentos para este mês." });
      }
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível gerar pagamentos.", variant: "destructive" });
    },
  });

  const paidPayments = payments?.filter(p => p.isPaid) || [];
  const unpaidPayments = payments?.filter(p => !p.isPaid) || [];
  const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalUnpaid = unpaidPayments.reduce((sum, p) => sum + p.amount, 0);

  // Table / filters state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending" | "late">("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const [tableSortKey, setTableSortKey] = useState<string>("date");
  const [tableSortDir, setTableSortDir] = useState<SortDir>("desc");
  const [monthInput, setMonthInput] = useState(() => `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}`);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <PageHeader
          title="Pagamentos"
          backHref="/more"
          sticky={false}
          rightSlot={
            <Button
              size="sm"
              variant="outline"
              onClick={() => generatePaymentsMutation.mutate()}
              disabled={generatePaymentsMutation.isPending}
              data-testid="button-generate-payments"
            >
              {generatePaymentsMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="ml-2">Gerar</span>
            </Button>
          }
        />
        <div className="px-6 pb-4 flex gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="flex-1" data-testid="select-month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month, index) => (
                <SelectItem key={index} value={(index + 1).toString()}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-24" data-testid="select-year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-xs text-muted-foreground">Recebido</span>
              </div>
              <p className="text-lg font-bold text-green-600" data-testid="text-total-paid">
                {totalPaid.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
              </p>
              <p className="text-xs text-muted-foreground">{paidPayments.length} cliente(s)</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-destructive" />
                <span className="text-xs text-muted-foreground">Pendente</span>
              </div>
              <p className="text-lg font-bold text-destructive" data-testid="text-total-unpaid">
                {totalUnpaid.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
              </p>
              <p className="text-xs text-muted-foreground">{unpaidPayments.length} cliente(s)</p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : !payments || payments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <Euro className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-foreground font-medium">Sem pagamentos para este mês</p>
              <p className="text-sm text-muted-foreground mt-1">
                Clique em "Gerar" para criar pagamentos para clientes mensais.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div>
            {
              (() => {
                const all = payments || [];
                function getStatus(p: ClientPaymentWithClient) {
                  if (p.isPaid) return "paid";
                  const pDate = new Date(p.year, p.month - 1, 1);
                  const nowDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                  return pDate < nowDate ? "late" : "pending";
                }

                let filtered = all.filter((p) => p.client?.name?.toLowerCase().includes(search.toLowerCase()));
                if (statusFilter !== "all") filtered = filtered.filter((p) => getStatus(p) === statusFilter);

                const sorted = filtered.slice().sort((a, b) => {
                  const dir = tableSortDir === "asc" ? 1 : -1;
                  if (tableSortKey === "client") return a.client.name.localeCompare(b.client.name) * dir;
                  if (tableSortKey === "amount") return (a.amount - b.amount) * dir;
                  const ad = a.year * 100 + a.month;
                  const bd = b.year * 100 + b.month;
                  return (ad - bd) * dir;
                });

                const total = sorted.length;
                const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

                const columns: ColumnDef<ClientPaymentWithClient>[] = [
                  {
                    key: "client",
                    header: "Cliente",
                    sortable: true,
                    mobileLabel: "Cliente",
                    cell: (row) => (
                      <Link href={`/clients/${row.clientId}`} className="font-medium truncate">
                        {row.client.name}
                      </Link>
                    ),
                  },
                  {
                    key: "period",
                    header: "Mês/Período",
                    cell: (row) => `${MONTHS[row.month - 1]} ${row.year}`,
                  },
                  {
                    key: "amount",
                    header: "Valor (€)",
                    sortable: true,
                    className: "text-right",
                    mobileLabel: "Valor",
                    cell: (row) => row.amount.toLocaleString("pt-PT", { style: "currency", currency: "EUR" }),
                  },
                  {
                    key: "method",
                    header: "Método",
                    cell: (row) => row.client?.paymentMethod ?? "—",
                  },
                  {
                    key: "status",
                    header: "Estado",
                    mobileLabel: "Estado",
                    cell: (row) => {
                      const s = getStatus(row);
                      if (s === "paid") return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">Pago</span>;
                      if (s === "pending") return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800">Pendente</span>;
                      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">Atrasado</span>;
                    },
                  },
                  {
                    key: "paidAt",
                    header: "Data Pagamento",
                    sortable: true,
                    cell: (row) => (row.paidAt ? format(new Date(row.paidAt), "d MMM yyyy", { locale: pt }) : "—"),
                  },
                  {
                    key: "actions",
                    header: "Ações",
                    isAction: true,
                    cell: (row) => (
                      <div className="flex items-center gap-2 justify-end">
                        <Link href={`/clients/${row.clientId}`} className="text-sm text-muted-foreground hover:text-foreground">Ver</Link>
                        {!row.isPaid && (
                          <Button size="sm" onClick={() => markPaidMutation.mutate(row.id)} disabled={markPaidMutation.isPending} data-testid={`button-mark-paid-${row.id}`}>
                            <Check className="w-4 h-4 mr-1" />Recebido
                          </Button>
                        )}
                      </div>
                    ),
                  },
                ];

                return (
                  <DataTable
                    columns={columns}
                    data={paginated}
                    onSort={(key, dir) => {
                      setTableSortKey(key);
                      setTableSortDir(dir);
                      setPage(1);
                    }}
                    sortKey={tableSortKey}
                    sortDir={tableSortDir}
                    page={page}
                    pageSize={PAGE_SIZE}
                    totalCount={total}
                    onPageChange={setPage}
                    emptyMessage={"Nenhum pagamento encontrado. Ajuste os filtros."}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:gap-3 md:justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <input aria-label="Pesquisar cliente" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Pesquisar cliente" className="w-64 px-3 py-2 rounded-md border" />
                        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }} className="px-2 py-1 rounded-md border text-sm">
                          <option value="all">Todos</option>
                          <option value="paid">Pago</option>
                          <option value="pending">Pendente</option>
                          <option value="late">Atrasado</option>
                        </select>
                        <input type="month" value={monthInput} onChange={(e) => { setMonthInput(e.target.value); const [y, m] = e.target.value.split('-'); if (y && m) { setSelectedYear(y); setSelectedMonth(String(parseInt(m))); } }} className="px-2 py-1 rounded-md border text-sm" />
                      </div>
                    </div>
                  </DataTable>
                );
              })()
            }
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
