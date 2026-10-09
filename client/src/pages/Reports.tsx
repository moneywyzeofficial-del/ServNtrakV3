import { useQuery } from "@tanstack/react-query";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, TrendingDown, Euro, ShoppingCart, Wrench, Users } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { format, startOfMonth, endOfMonth, subMonths, parseISO, isWithinInterval } from "date-fns";
import { pt } from "date-fns/locale";
import { useState, useMemo } from "react";
import type { Client, ServiceLog, PurchaseWithDetails, PurchaseCategory, ClientPayment } from "@shared/schema";
import { PageHeader } from "@/components/PageHeader";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const SERVICE_COLORS: Record<string, string> = {
  'Jardim': 'hsl(var(--chart-2))',
  'Piscina': 'hsl(var(--chart-3))',
  'Jacuzzi': 'hsl(var(--chart-4))',
  'Geral': 'hsl(var(--chart-5))',
};

export default function Reports() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  const { data: clients, isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  const { data: serviceLogs, isLoading: serviceLogsLoading } = useQuery<ServiceLog[]>({
    queryKey: ['/api/service-logs'],
  });

  const { data: purchases, isLoading: purchasesLoading } = useQuery<PurchaseWithDetails[]>({
    queryKey: ['/api/purchases'],
  });

  const { data: categories } = useQuery<PurchaseCategory[]>({
    queryKey: ['/api/purchase-categories'],
  });

  const { data: allPayments, isLoading: paymentsLoading } = useQuery<ClientPayment[]>({
    queryKey: ['/api/client-payments', 'year-summary', selectedYear],
    queryFn: async () => {
      const year = parseInt(selectedYear);
      const promises = [];
      for (let month = 1; month <= 12; month++) {
        promises.push(
          fetch(`/api/client-payments?year=${year}&month=${month}`, { credentials: "include" })
            .then(res => res.ok ? res.json() : [])
        );
      }
      const results = await Promise.all(promises);
      return results.flat();
    },
  });

  const isLoading = clientsLoading || serviceLogsLoading || purchasesLoading || paymentsLoading;

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2].map(y => y.toString());
  }, []);

  const stats = useMemo(() => {
    if (!clients || !serviceLogs || !purchases) return null;

    const year = parseInt(selectedYear);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const monthlyData: { month: string; receitas: number; despesas: number; lucro: number }[] = [];
    const servicesByType: Record<string, number> = {};
    const purchasesByCategory: Record<string, number> = {};

    const maxMonth = year < currentYear ? 11 : (year === currentYear ? currentMonth : -1);

    for (let month = 0; month <= maxMonth; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = endOfMonth(monthStart);
      const monthName = format(monthStart, 'MMM', { locale: pt });

      const monthPurchases = purchases.filter(p => {
        const purchaseDate = new Date(p.purchaseDate);
        return isWithinInterval(purchaseDate, { start: monthStart, end: monthEnd });
      });

      const monthExpenses = monthPurchases.reduce((sum, p) => sum + p.finalTotal, 0);

      const monthServices = serviceLogs.filter(s => {
        const serviceDate = new Date(s.date);
        return isWithinInterval(serviceDate, { start: monthStart, end: monthEnd });
      });

      const paidMonthlyRevenue = (allPayments || [])
        .filter(p => p.year === year && p.month === month + 1 && p.isPaid)
        .reduce((sum, p) => sum + p.amount, 0);

      const extraRevenue = monthServices
        .filter(s => s.billingType === 'extra')
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

      const totalRevenue = paidMonthlyRevenue + extraRevenue;

      monthlyData.push({
        month: monthName,
        receitas: totalRevenue,
        despesas: monthExpenses,
        lucro: totalRevenue - monthExpenses,
      });

      monthServices.forEach(s => {
        servicesByType[s.type] = (servicesByType[s.type] || 0) + 1;
      });

      monthPurchases.forEach(p => {
        const catName = p.category?.name || 'Outros';
        purchasesByCategory[catName] = (purchasesByCategory[catName] || 0) + p.finalTotal;
      });
    }

    const totalReceitas = monthlyData.reduce((sum, m) => sum + m.receitas, 0);
    const totalDespesas = monthlyData.reduce((sum, m) => sum + m.despesas, 0);
    const totalLucro = totalReceitas - totalDespesas;
    const totalServicos = Object.values(servicesByType).reduce((sum, v) => sum + v, 0);

    const servicesPieData = Object.entries(servicesByType).map(([name, value]) => ({
      name,
      value,
      color: SERVICE_COLORS[name] || COLORS[0],
    }));

    const purchasesPieData = Object.entries(purchasesByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length],
      }));

    return {
      monthlyData,
      servicesPieData,
      purchasesPieData,
      totalReceitas,
      totalDespesas,
      totalLucro,
      totalServicos,
      totalClientes: clients.length,
    };
  }, [clients, serviceLogs, purchases, allPayments, selectedYear]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <BottomNav />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground mt-4">Sem dados disponíveis</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Relatórios"
        backHref="/more"
        rightSlot={
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
        }
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-xs text-muted-foreground">Receitas</span>
              </div>
              <p className="text-lg font-bold text-green-600" data-testid="text-total-receitas">
                {stats.totalReceitas.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-xs text-muted-foreground">Despesas</span>
              </div>
              <p className="text-lg font-bold text-red-600" data-testid="text-total-despesas">
                {stats.totalDespesas.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Euro className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-muted-foreground">Lucro</span>
              </div>
              <p className={`text-lg font-bold ${stats.totalLucro >= 0 ? 'text-blue-600' : 'text-red-600'}`} data-testid="text-total-lucro">
                {stats.totalLucro.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Wrench className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-muted-foreground">Serviços</span>
              </div>
              <p className="text-lg font-bold text-purple-600" data-testid="text-total-servicos">
                {stats.totalServicos}
              </p>
            </CardContent>
          </Card>
        </div>

        <Link href="/profitability">
          <Button variant="outline" className="w-full gap-2 mb-6" data-testid="link-profitability">
            <TrendingUp className="w-4 h-4" />
            Rentabilidade por Cliente
          </Button>
        </Link>

        <Tabs defaultValue="financeiro" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="financeiro" data-testid="tab-financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="servicos" data-testid="tab-servicos">Serviços</TabsTrigger>
            <TabsTrigger value="despesas" data-testid="tab-despesas">Despesas</TabsTrigger>
          </TabsList>

          <TabsContent value="financeiro" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Receitas vs Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                      <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                      <Tooltip 
                        formatter={(value: number) => value.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="receitas" name="Receitas" fill="hsl(145 63% 32%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="despesas" name="Despesas" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Evolução do Lucro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip 
                        formatter={(value: number) => value.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Line type="monotone" dataKey="lucro" name="Lucro" stroke="hsl(200 80% 50%)" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="servicos" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Serviços por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.servicesPieData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.servicesPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {stats.servicesPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Sem serviços registados</p>
                )}
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Serviços por Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.servicesPieData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">{item.value} serviços</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="despesas" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Despesas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.purchasesPieData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.purchasesPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {stats.purchasesPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => value.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Sem despesas registadas</p>
                )}
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Top 5 Categorias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.purchasesPieData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">
                        {item.value.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
}
