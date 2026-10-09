import { useQuery, useMutation } from "@tanstack/react-query";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Settings, Calculator, Euro, Wallet, Building, TrendingUp, Lock, ChevronRight, RefreshCw } from "lucide-react";
import { useState, useMemo } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import type { FinancialConfig, MonthlyDistribution, ClientPaymentWithClient } from "@shared/schema";
import { PageHeader } from "@/components/PageHeader";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function Finances() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [configOpen, setConfigOpen] = useState(false);
  const [salaryPercentage, setSalaryPercentage] = useState("40");
  const { toast } = useToast();

  const years = useMemo(() => {
    const currentYear = currentDate.getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2].map(y => y.toString());
  }, []);

  const { data: config, isLoading: configLoading } = useQuery<FinancialConfig | null>({
    queryKey: ['/api/financial-config'],
  });

  const { data: distributions, isLoading: distributionsLoading } = useQuery<MonthlyDistribution[]>({
    queryKey: ['/api/monthly-distributions', selectedYear],
    queryFn: async () => {
      const res = await fetch(`/api/monthly-distributions?year=${selectedYear}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha ao carregar distribuições");
      return res.json();
    },
  });

  const { data: currentMonthPayments } = useQuery<ClientPaymentWithClient[]>({
    queryKey: ['/api/client-payments', currentDate.getFullYear().toString(), (currentDate.getMonth() + 1).toString()],
    queryFn: async () => {
      const res = await fetch(`/api/client-payments?year=${currentDate.getFullYear()}&month=${currentDate.getMonth() + 1}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha ao carregar pagamentos");
      return res.json();
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (data: { salaryPercentage: number; companyPercentage: number }) => {
      const res = await apiRequest('PUT', '/api/financial-config', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/financial-config'] });
      setConfigOpen(false);
      toast({ title: "Configuração atualizada", description: "As percentagens foram guardadas." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível guardar as configurações.", variant: "destructive" });
    },
  });

  const calculateDistributionMutation = useMutation({
    mutationFn: async ({ year, month }: { year: number; month: number }) => {
      const res = await apiRequest('POST', `/api/monthly-distributions/${year}/${month}/calculate`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/monthly-distributions'] });
      toast({ title: "Repartição calculada", description: "Os valores foram atualizados." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível calcular a repartição.", variant: "destructive" });
    },
  });

  const handleSaveConfig = () => {
    const salary = parseFloat(salaryPercentage);
    if (isNaN(salary) || salary < 0 || salary > 100) {
      toast({ title: "Erro", description: "A percentagem deve estar entre 0 e 100.", variant: "destructive" });
      return;
    }
    updateConfigMutation.mutate({
      salaryPercentage: salary,
      companyPercentage: 100 - salary,
    });
  };

  const currentSalaryPercentage = config?.salaryPercentage ?? 40;
  const currentCompanyPercentage = config?.companyPercentage ?? 60;

  const paidPayments = currentMonthPayments?.filter(p => p.isPaid) || [];
  const totalReceivedThisMonth = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const salaryThisMonth = Math.round((totalReceivedThisMonth * currentSalaryPercentage / 100) * 100) / 100;
  const companyThisMonth = Math.round((totalReceivedThisMonth * currentCompanyPercentage / 100) * 100) / 100;

  const yearTotals = useMemo(() => {
    if (!distributions) return { total: 0, salary: 0, company: 0 };
    return {
      total: distributions.reduce((sum, d) => sum + d.totalReceived, 0),
      salary: distributions.reduce((sum, d) => sum + d.salaryAmount, 0),
      company: distributions.reduce((sum, d) => sum + d.companyAmount, 0),
    };
  }, [distributions]);

  const isLoading = configLoading || distributionsLoading;

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Finanças"
        backHref="/more"
        rightSlot={
          <Dialog open={configOpen} onOpenChange={setConfigOpen}>
            <DialogTrigger asChild>
              <Button 
                size="icon" 
                variant="outline"
                onClick={() => setSalaryPercentage(currentSalaryPercentage.toString())}
                data-testid="button-open-config"
                aria-label="Configurar percentagem de salário"
              >
                <Settings className="w-4 h-4" aria-hidden="true" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configurar Repartição</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="salary-percentage">Percentagem para Ordenado (%)</Label>
                  <Input
                    id="salary-percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={salaryPercentage}
                    onChange={(e) => setSalaryPercentage(e.target.value)}
                    data-testid="input-salary-percentage"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Percentagem para Empresa (%)</Label>
                  <div className="text-2xl font-bold text-primary">
                    {100 - (parseFloat(salaryPercentage) || 0)}%
                  </div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Esta configuração será usada para calcular automaticamente a repartição do dinheiro que entra dos pagamentos de clientes.
                  </p>
                </div>
                <Button
                  onClick={handleSaveConfig}
                  disabled={updateConfigMutation.isPending}
                  className="w-full btn-primary"
                  data-testid="button-save-config"
                >
                  {updateConfigMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Guardar Configuração
                </Button>
              </div>
            </DialogContent>
            </Dialog>
          }
        />
        <div className="px-6 pt-3 pb-2 border-b border-border/50">
          <div className="flex gap-3">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[140px]" data-testid="select-year">
                <SelectValue placeholder="Ano" />
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
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Configuração Atual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Ordenado</span>
                      <Badge variant="secondary">{currentSalaryPercentage}%</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Empresa</span>
                      <Badge variant="secondary">{currentCompanyPercentage}%</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Recebido</p>
                    <p className="text-xl font-bold text-foreground">{totalReceivedThisMonth.toFixed(2)}€</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <Wallet className="w-3 h-3 text-green-600" />
                      Ordenado
                    </p>
                    <p className="text-xl font-bold text-green-600">{salaryThisMonth.toFixed(2)}€</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <Building className="w-3 h-3 text-blue-600" />
                      Empresa
                    </p>
                    <p className="text-xl font-bold text-blue-600">{companyThisMonth.toFixed(2)}€</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => calculateDistributionMutation.mutate({
                      year: currentDate.getFullYear(),
                      month: currentDate.getMonth() + 1,
                    })}
                    disabled={calculateDistributionMutation.isPending}
                    className="flex-1"
                    data-testid="button-calculate-current"
                  >
                    {calculateDistributionMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Calculator className="w-4 h-4 mr-2" />
                    )}
                    Guardar Repartição
                  </Button>
                  <Link href="/payments">
                    <Button variant="outline" size="sm" data-testid="button-view-payments">
                      <Euro className="w-4 h-4 mr-2" />
                      Ver Pagamentos
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span>Resumo Anual {selectedYear}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-xl font-bold text-foreground">{yearTotals.total.toFixed(2)}€</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Ordenado</p>
                    <p className="text-xl font-bold text-green-600">{yearTotals.salary.toFixed(2)}€</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Empresa</p>
                    <p className="text-xl font-bold text-blue-600">{yearTotals.company.toFixed(2)}€</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Histórico Mensal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {MONTHS.map((monthName, index) => {
                  const monthNum = index + 1;
                  const dist = distributions?.find(d => d.month === monthNum);
                  const isPast = parseInt(selectedYear) < currentDate.getFullYear() ||
                    (parseInt(selectedYear) === currentDate.getFullYear() && monthNum <= currentDate.getMonth() + 1);

                  return (
                    <div
                      key={monthNum}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        dist ? 'bg-card' : 'bg-muted/30'
                      }`}
                      data-testid={`distribution-${monthNum}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium w-24">{monthName}</span>
                        {dist?.isLocked && (
                          <Lock className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                      {dist ? (
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">{dist.totalReceived.toFixed(2)}€</span>
                          <span className="text-green-600 font-medium">{dist.salaryAmount.toFixed(2)}€</span>
                          <span className="text-blue-600 font-medium">{dist.companyAmount.toFixed(2)}€</span>
                        </div>
                      ) : isPast ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => calculateDistributionMutation.mutate({
                            year: parseInt(selectedYear),
                            month: monthNum,
                          })}
                          disabled={calculateDistributionMutation.isPending}
                          data-testid={`button-calculate-${monthNum}`}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Calcular
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
