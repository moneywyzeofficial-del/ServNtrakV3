import { useClients } from "@/hooks/use-clients";
import { BottomNav } from "@/components/BottomNav";
import { Loader2, Euro, Clock, Users, CalendarDays, FileText } from "lucide-react";
import { Link } from "wouter";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type ColumnDef, type SortDir } from "@/components/ui/data-table";

export default function Billing() {
  const { data: clients, isLoading } = useClients();

  const monthlyClients = clients?.filter(c => c.billingType === "monthly" && c.monthlyRate) || [];
  const hourlyClients = clients?.filter(c => c.billingType === "hourly" && c.hourlyRate) || [];
  const perVisitClients = clients?.filter(c => c.billingType === "per_visit" && c.perVisitRate) || [];
  
  const totalMonthly = monthlyClients.reduce((sum, c) => sum + (c.monthlyRate || 0), 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Faturação"
        subtitle="Gestão de valores de clientes"
        backHref="/more"
        rightSlot={
          <Link
            href="/expense-notes"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" /> Notas de Despesa
          </Link>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="px-6 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Euro className="w-4 h-4 text-green-700 dark:text-green-400" />
                </div>
                <h2 className="font-bold text-lg text-foreground">Mensalidades Fixas</h2>
              </div>
              <span className="text-sm font-semibold text-green-700 dark:text-green-400">{monthlyClients.length} clientes</span>
            </div>

            {monthlyClients.length > 0 ? (
              <>
                <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm p-4">
                  <DataTable
                    columns={[
                      { key: 'name', header: 'Cliente', cell: (c) => <Link href={`/clients/${c.id}`} className="font-medium truncate">{c.name}</Link>, sortable: true },
                      { key: 'monthlyRate', header: '€/Mês', cell: (c) => c.monthlyRate ? `${c.monthlyRate.toFixed(2)} €` : '—', className: 'text-right', sortable: true },
                      { key: 'actions', header: 'Ações', isAction: true, cell: (c) => <Link href={`/clients/${c.id}`} className="text-sm text-muted-foreground hover:text-foreground">Ver</Link> }
                    ] as ColumnDef<any>[]}
                    data={monthlyClients}
                    pageSize={20}
                  />
                </div>
                <div className="mt-4 bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800 dark:text-green-300">Total Mensal</span>
                    <span className="text-xl font-bold text-green-700 dark:text-green-400">{totalMonthly.toFixed(2)} €</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-card rounded-2xl p-6 text-center border border-border/50">
                <p className="text-muted-foreground">Sem clientes com mensalidade fixa</p>
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                </div>
                <h2 className="font-bold text-lg text-foreground">Valor à Hora</h2>
              </div>
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">{hourlyClients.length} clientes</span>
            </div>

            {hourlyClients.length > 0 ? (
              <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm p-4">
                <DataTable
                  columns={[
                    { key: 'name', header: 'Cliente', cell: (c) => <Link href={`/clients/${c.id}`} className="font-medium truncate">{c.name}</Link>, sortable: true },
                    { key: 'hourlyRate', header: '€/Hora', cell: (c) => c.hourlyRate ? `${c.hourlyRate.toFixed(2)} €` : '—', className: 'text-right', sortable: true },
                    { key: 'actions', header: 'Ações', isAction: true, cell: (c) => <Link href={`/clients/${c.id}`} className="text-sm text-muted-foreground hover:text-foreground">Ver</Link> }
                  ] as ColumnDef<any>[]}
                  data={hourlyClients}
                  pageSize={20}
                />
              </div>
            ) : (
              <div className="bg-card rounded-2xl p-6 text-center border border-border/50">
                <p className="text-muted-foreground">Sem clientes a cobrar por hora</p>
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                </div>
                <h2 className="font-bold text-lg text-foreground">Valor por Visita</h2>
              </div>
              <span className="text-sm font-semibold text-muted-foreground">{perVisitClients.length} clientes</span>
            </div>

            {perVisitClients.length > 0 ? (
              <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm p-4">
                <DataTable
                  columns={[
                    { key: 'name', header: 'Cliente', cell: (c) => <Link href={`/clients/${c.id}`} className="font-medium truncate">{c.name}</Link>, sortable: true },
                    { key: 'perVisitRate', header: '€/Visita', cell: (c) => c.perVisitRate ? `${c.perVisitRate.toFixed(2)} €` : '—', className: 'text-right', sortable: true },
                    { key: 'actions', header: 'Ações', isAction: true, cell: (c) => <Link href={`/clients/${c.id}`} className="text-sm text-muted-foreground hover:text-foreground">Ver</Link> }
                  ] as ColumnDef<any>[]}
                  data={perVisitClients}
                  pageSize={20}
                />
              </div>
            ) : (
              <div className="bg-card rounded-2xl p-6 text-center border border-border/50">
                <p className="text-muted-foreground">Sem clientes a cobrar por visita</p>
              </div>
            )}
          </section>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
