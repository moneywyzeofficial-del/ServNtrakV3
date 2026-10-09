import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import type { ClientProfitabilityData } from "@shared/schema";

type SortKey = "grossMargin" | "totalReceived" | "totalWorkerHours" | "grossMarginPercent";

function MarginBadge({ percent }: { percent: number | null }) {
  if (percent === null) return <Badge variant="outline">Sem dados</Badge>;
  if (percent >= 60) return <Badge className="bg-green-100 text-green-800 border-green-200">{percent}%</Badge>;
  if (percent >= 30) return <Badge className="bg-muted text-muted-foreground border-border">{percent}%</Badge>;
  return <Badge className="bg-red-100 text-red-800 border-red-200">{percent}%</Badge>;
}

export default function ClientProfitability() {
  const [sortBy, setSortBy] = useState<SortKey>("grossMargin");

  const { data, isLoading } = useQuery<ClientProfitabilityData[]>({
    queryKey: ["/api/clients/profitability"],
    queryFn: async () => {
      const res = await fetch("/api/clients/profitability", { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao carregar dados");
      return res.json();
    },
  });

  const sorted = data
    ? [...data].sort((a, b) => {
        const av = a[sortBy] ?? -Infinity;
        const bv = b[sortBy] ?? -Infinity;
        return (bv as number) - (av as number);
      })
    : [];

  const totals = data
    ? {
        received: data.reduce((s, c) => s + c.totalReceived, 0),
        laborCost: data.reduce((s, c) => s + c.totalLaborCost, 0),
        margin: data.reduce((s, c) => s + c.grossMargin, 0),
        hours: data.reduce((s, c) => s + c.totalWorkerHours, 0),
      }
    : null;

  const chartData = sorted.slice(0, 10).map((c) => ({
    name: c.clientName.split(" ")[0],
    margem: c.grossMargin,
    receita: c.totalReceived,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Rentabilidade"
        subtitle="Lucro por cliente"
        backHref="/more"
      />
      <div className="px-4 pb-4 max-w-2xl mx-auto">

        {totals && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Receita total</p>
                <p className="text-lg font-bold text-foreground" data-testid="text-total-received">{totals.received.toFixed(2)}€</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Custo mão de obra</p>
                <p className="text-lg font-bold text-red-600" data-testid="text-total-labor-cost">{totals.laborCost.toFixed(2)}€</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Margem bruta</p>
                <p className={`text-lg font-bold ${totals.margin >= 0 ? "text-green-600" : "text-red-600"}`} data-testid="text-total-margin">
                  {totals.margin.toFixed(2)}€
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Horas totais</p>
                <p className="text-lg font-bold text-foreground" data-testid="text-total-hours">{totals.hours.toFixed(1)}h</p>
              </CardContent>
            </Card>
          </div>
        )}

        {chartData.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Margem bruta por cliente (top 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(2)}€`]}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  />
                  <Bar dataKey="margem" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.margem >= 0 ? "hsl(145 63% 32%)" : "hsl(0 72% 51%)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2 mb-4 flex-wrap">
          {(["grossMargin", "totalReceived", "grossMarginPercent", "totalWorkerHours"] as SortKey[]).map((key) => {
            const labels: Record<SortKey, string> = {
              grossMargin: "Margem €",
              totalReceived: "Receita",
              grossMarginPercent: "Margem %",
              totalWorkerHours: "Horas",
            };
            return (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  sortBy === key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border"
                }`}
                data-testid={`button-sort-${key}`}
              >
                {labels[key]}
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {sorted.map((client) => (
            <Card key={client.clientId} data-testid={`card-client-profitability-${client.clientId}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-foreground" data-testid={`text-client-name-${client.clientId}`}>{client.clientName}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {client.billingType === "monthly"
                        ? `Mensalidade ${client.monthlyRate?.toFixed(2)}€`
                        : client.billingType === "hourly"
                        ? "Por hora"
                        : "Por visita"}
                    </p>
                  </div>
                  <MarginBadge percent={client.grossMarginPercent} />
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Receita</p>
                    <p className="text-sm font-semibold text-foreground">{client.totalReceived.toFixed(2)}€</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Custo M.O.</p>
                    <p className="text-sm font-semibold text-red-600">{client.totalLaborCost.toFixed(2)}€</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Margem</p>
                    <p className={`text-sm font-semibold ${client.grossMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {client.grossMargin.toFixed(2)}€
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 mt-2 pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {client.totalWorkerHours.toFixed(1)}h
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {client.totalVisits} visitas
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}

          {sorted.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground text-sm">Sem dados de rentabilidade disponíveis.</p>
                <p className="text-xs text-muted-foreground mt-1">Regista visitas e pagamentos para ver análises.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
