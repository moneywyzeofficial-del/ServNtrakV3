import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useClients, useDeleteClient } from "@/hooks/use-clients";
import { useAppointments } from "@/hooks/use-appointments";
import { BottomNav } from "@/components/BottomNav";
import { Link } from "wouter";
import { Search, Leaf, Waves, ThermometerSun, Loader2, Phone, Users, Euro, Clock, ChevronRight, ArrowUpDown, CheckCircle, AlertCircle, Calendar, CalendarDays, Trash2, MapPin, ChevronLeft, ChevronsLeft, ChevronsRight, UserPlus } from "lucide-react";
import type { Client, ClientPaymentWithClient } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CreateClientWizard } from "@/components/CreateClientWizard";
import { PageHeader } from "@/components/PageHeader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ServiceFilter = "all" | "garden" | "pool" | "jacuzzi";
type BillingFilter = "all" | "monthly" | "hourly" | "per_visit";
type SortOption = "name" | "value" | "recent";

const PAGE_SIZE = 15;

export default function Clients() {
  const { data: clients, isLoading } = useClients();
  const { data: appointments } = useAppointments();
  const deleteClient = useDeleteClient();
  const [deleteDialogClient, setDeleteDialogClient] = useState<Client | null>(null);
  const deleteTargetRef = useRef<number | null>(null);
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>("all");
  const [billingFilter, setBillingFilter] = useState<BillingFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [wizardOpen, setWizardOpen] = useState(false);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const { data: currentMonthPayments } = useQuery<ClientPaymentWithClient[]>({
    queryKey: ['/api/client-payments', currentYear.toString(), currentMonth.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/client-payments?year=${currentYear}&month=${currentMonth}`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const stats = useMemo(() => {
    if (!clients) return { total: 0, garden: 0, pool: 0, jacuzzi: 0, monthlyRevenue: 0 };
    return {
      total: clients.length,
      garden: clients.filter(c => c.hasGarden).length,
      pool: clients.filter(c => c.hasPool).length,
      jacuzzi: clients.filter(c => c.hasJacuzzi).length,
      monthlyRevenue: clients
        .filter(c => c.billingType === 'monthly')
        .reduce((sum, c) => sum + (c.monthlyRate || 0), 0),
    };
  }, [clients]);

  const paymentStatusMap = useMemo(() => {
    const map = new Map<number, 'paid' | 'pending' | 'none'>();
    if (!currentMonthPayments) return map;
    currentMonthPayments.forEach(payment => {
      map.set(payment.clientId, payment.isPaid ? 'paid' : 'pending');
    });
    return map;
  }, [currentMonthPayments]);

  const getPaymentStatus = (client: Client): 'paid' | 'pending' | 'none' => {
    if (client.billingType !== 'monthly') return 'none';
    return paymentStatusMap.get(client.id) || 'none';
  };

  const filteredAndSortedClients = useMemo(() => {
    let result = clients?.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.address?.toLowerCase().includes(search.toLowerCase())
    ) || [];

    if (serviceFilter !== "all") {
      result = result.filter(c => {
        if (serviceFilter === "garden") return c.hasGarden;
        if (serviceFilter === "pool") return c.hasPool;
        if (serviceFilter === "jacuzzi") return c.hasJacuzzi;
        return true;
      });
    }

    if (billingFilter !== "all") {
      result = result.filter(c => c.billingType === billingFilter);
    }

    const dirMult = sortDir === "asc" ? 1 : -1;
    result.sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === "name") return a.name.localeCompare(b.name) * dirMult;
      if (sortBy === "value") {
        const aValue = a.monthlyRate || a.hourlyRate || a.perVisitRate || 0;
        const bValue = b.monthlyRate || b.hourlyRate || b.perVisitRate || 0;
        return (aValue - bValue) * dirMult;
      }
      return 0;
    });

    return result;
  }, [clients, search, serviceFilter, billingFilter, sortBy, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [search, serviceFilter, billingFilter, sortBy, sortDir]);

  const nextVisits = useMemo(() => {
    const map = new Map<number, { date: Date; type: string; isCompleted: boolean }>();
    if (!appointments) return map;
    const now = Date.now();
    for (const apt of appointments) {
      const existing = map.get(apt.clientId);
      if (!existing || new Date(apt.date).getTime() < new Date(existing.date).getTime()) {
        map.set(apt.clientId, { date: new Date(apt.date), type: apt.type, isCompleted: apt.isCompleted ?? false });
      }
    }
    return map;
  }, [appointments]);

  const getClientThumbnail = (client: Client) => client.housePhotoUrl || client.profilePhotoUrl || null;
  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getClientValue = (client: Client) => {
    if (client.billingType === 'monthly' && client.monthlyRate) return `${client.monthlyRate}€/mês`;
    if (client.billingType === 'hourly' && client.hourlyRate) return `${client.hourlyRate}€/hora`;
    if (client.billingType === 'per_visit' && client.perVisitRate) return `${client.perVisitRate}€/visita`;
    return null;
  };

  const getClientStatus = (client: Client): { label: string; color: string } => {
    const nv = nextVisits.get(client.id);
    if (!nv) {
      const active = client.hasGarden || client.hasPool || client.hasJacuzzi;
      return active ? { label: "Ativo", color: "bg-green-100 text-green-700" } : { label: "Sem serviço", color: "bg-muted text-muted-foreground" };
    }
    if (nv.isCompleted) return { label: "Concluído", color: "bg-green-100 text-green-700" };
    const now = Date.now();
    const d = nv.date.getTime();
    const day = 24 * 60 * 60 * 1000;
    if (d < now - day) return { label: "Atrasado", color: "bg-red-100 text-red-700" };
    if (d < now + day) return { label: "Hoje", color: "bg-amber-100 text-amber-700" };
    if (d < now + 2 * day) return { label: "Amanhã", color: "bg-blue-100 text-blue-700" };
    if (d < now + 7 * day) return { label: "Em breve", color: "bg-blue-100 text-blue-700" };
    return { label: "Agendado", color: "bg-muted text-muted-foreground" };
  };

  const filterButtons: { key: ServiceFilter; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "garden", label: "Jardim" },
    { key: "pool", label: "Piscina" },
    { key: "jacuzzi", label: "Jacuzzi" },
  ];

  const handleDropdownSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortBy(option);
      setSortDir("asc");
    }
  };

  const paginatedClients = filteredAndSortedClients.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const totalPages = Math.ceil(filteredAndSortedClients.length / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background pb-24 page-transition">
      <PageHeader
        title="Clientes"
        subtitle="Lista, mapa e funcionários"
        backHref="/more"
      />

      {/* Content */}
      <div className="px-5 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Pesquisar clientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl bg-muted/50 border-none shadow-inner"
            data-testid="input-search-clients"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-card rounded-xl border border-border/30 p-3 text-center shadow-sm">
            <Users className="w-4 h-4 mx-auto mb-1.5 text-primary" aria-hidden="true" />
            <p className="text-lg font-bold text-foreground" data-testid="text-total-clients">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Total</p>
          </div>
          <div className="bg-card rounded-xl border border-border/30 p-3 text-center shadow-sm">
            <Leaf className="w-4 h-4 mx-auto mb-1.5 text-primary" aria-hidden="true" />
            <p className="text-lg font-bold text-foreground">{stats.garden}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Jardim</p>
          </div>
          <div className="bg-card rounded-xl border border-border/30 p-3 text-center shadow-sm">
            <Waves className="w-4 h-4 mx-auto mb-1.5 text-primary" aria-hidden="true" />
            <p className="text-lg font-bold text-foreground">{stats.pool}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Piscina</p>
          </div>
          <div className="bg-card rounded-xl border border-border/30 p-3 text-center shadow-sm">
            <Euro className="w-4 h-4 mx-auto mb-1.5 text-primary" aria-hidden="true" />
            <p className="text-lg font-bold text-foreground">{stats.monthlyRevenue}€</p>
            <p className="text-[10px] text-muted-foreground font-medium">Mensal</p>
          </div>
        </div>

        {/* Filters + Sort */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex gap-1 overflow-x-auto pb-0.5">
            {filterButtons.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setServiceFilter(key)}
                className={cn(
                  "shrink-0 h-8 px-3 rounded-full text-xs font-semibold transition-colors",
                  serviceFilter === key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                data-testid={`button-filter-${key}`}
              >
                {label}
              </button>
            ))}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 shrink-0" data-testid="button-sort" aria-label="Ordenar lista">
                <ArrowUpDown className="w-3.5 h-3.5" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Ordenar</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleDropdownSort("name")} data-testid="sort-name">
                <span className="flex-1">Por Nome</span>
                {sortBy === "name" && <span className="text-primary text-xs">{sortDir === "asc" ? "↑" : "↓"}</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDropdownSort("value")} data-testid="sort-value">
                <span className="flex-1">Por Valor</span>
                {sortBy === "value" && <span className="text-primary text-xs">{sortDir === "asc" ? "↑" : "↓"}</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDropdownSort("recent")} data-testid="sort-recent">
                <span className="flex-1">Mais Recentes</span>
                {sortBy === "recent" && <span className="text-primary text-xs">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Faturação</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setBillingFilter("all")} data-testid="billing-all">
                {billingFilter === "all" && <CheckCircle className="w-3 h-3 mr-2 text-primary" />}
                {billingFilter !== "all" && <div className="w-3 h-3 mr-2" />}
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBillingFilter("monthly")} data-testid="billing-monthly">
                {billingFilter === "monthly" && <CheckCircle className="w-3 h-3 mr-2 text-primary" />}
                {billingFilter !== "monthly" && <div className="w-3 h-3 mr-2" />}
                <Calendar className="w-3.5 h-3.5 mr-2 text-muted-foreground" aria-hidden="true" />
                Mensal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBillingFilter("hourly")} data-testid="billing-hourly">
                {billingFilter === "hourly" && <CheckCircle className="w-3 h-3 mr-2 text-primary" />}
                {billingFilter !== "hourly" && <div className="w-3 h-3 mr-2" />}
                <Clock className="w-3.5 h-3.5 mr-2 text-muted-foreground" aria-hidden="true" />
                Por Hora
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBillingFilter("per_visit")} data-testid="billing-per-visit">
                {billingFilter === "per_visit" && <CheckCircle className="w-3 h-3 mr-2 text-primary" />}
                {billingFilter !== "per_visit" && <div className="w-3 h-3 mr-2" />}
                <CalendarDays className="w-3.5 h-3.5 mr-2 text-muted-foreground" aria-hidden="true" />
                Por Visita
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Client list */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : paginatedClients.length > 0 ? (
          <>
            <div className="space-y-3">
              {paginatedClients.map((client, index) => {
                const value = getClientValue(client);
                const status = getClientStatus(client);
                const thumbnail = getClientThumbnail(client);
                const nv = nextVisits.get(client.id);
                return (
                  <Link
                    key={client.id}
                    href={`/clients/${client.id}`}
                    className="mobile-card flex items-center gap-3 p-3"
                    style={{ animationDelay: `${index * 0.05}s` }}
                    data-testid={`card-client-${client.id}`}
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden relative">
                      <span className="text-sm font-bold text-primary">{getInitials(client.name)}</span>
                      {thumbnail && (
                        <img
                          src={thumbnail}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground truncate text-sm" data-testid={`text-client-name-${client.id}`}>
                        {client.name}
                      </h3>
                      {(client.locality || client.address) && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {client.locality || client.address}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {client.hasGarden && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-green-700 bg-green-50 px-1.5 py-0 rounded-full">
                            <Leaf className="w-2.5 h-2.5" />Jardim
                          </span>
                        )}
                        {client.hasPool && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0 rounded-full">
                            <Waves className="w-2.5 h-2.5" />Piscina
                          </span>
                        )}
                        {client.hasJacuzzi && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0 rounded-full">
                            <ThermometerSun className="w-2.5 h-2.5" />Jacuzzi
                          </span>
                        )}
                      </div>
                      {nv && !nv.isCompleted && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                          <CalendarDays className="w-3 h-3 shrink-0" />
                          {new Date(nv.date).toLocaleDateString("pt-PT")}
                        </p>
                      )}
                    </div>

                    {/* Status + Value */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap", status.color)}>
                        {status.label}
                      </span>
                      {value && (
                        <span className="text-[10px] font-bold text-primary whitespace-nowrap">{value}</span>
                      )}
                      <div className="flex items-center gap-0.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-muted-foreground/40 hover:text-destructive"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteDialogClient(client); deleteTargetRef.current = client.id; }}
                          data-testid={`button-delete-${client.id}`}
                          aria-label="Eliminar cliente"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  disabled={page <= 1}
                  onClick={() => setPage(1)}
                  aria-label="Primeira página"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground font-medium px-2">
                  {page} / {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  aria-label="Página seguinte"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  disabled={page >= totalPages}
                  onClick={() => setPage(totalPages)}
                  aria-label="Última página"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state bg-card rounded-2xl border border-border/30">
            <div className="empty-state-icon bg-primary/5">
              {search || serviceFilter !== "all" ? (
                <Search className="w-7 h-7 text-primary/60" />
              ) : (
                <Users className="w-7 h-7 text-primary/60" />
              )}
            </div>
            <h3 className="font-semibold text-foreground">
              {search || serviceFilter !== "all" ? "Nenhum cliente encontrado" : "Sem clientes"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {search || serviceFilter !== "all"
                ? "Tente ajustar os filtros ou a pesquisa."
                : "Adicione o seu primeiro cliente para começar!"}
            </p>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteDialogClient} onOpenChange={(open) => { if (!open) { setDeleteDialogClient(null); deleteTargetRef.current = null; } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar <strong>{deleteDialogClient?.name}</strong>?
              Esta ação é irreversível e removerá todos os dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteClient.isPending}>Cancelar</AlertDialogCancel>
            <Button
              disabled={deleteClient.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                const id = deleteTargetRef.current;
                if (id !== null) {
                  deleteClient.mutate(id, {
                    onSuccess: () => setDeleteDialogClient(null),
                  });
                }
              }}
            >
              {deleteClient.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />A eliminar...</>
              ) : (
                "Eliminar"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="fixed bottom-[88px] right-4 z-50">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="h-14 w-14 rounded-full bg-primary text-white shadow-xl shadow-primary/30 flex items-center justify-center active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
              aria-label="Adicionar novo cliente"
              data-testid="button-create-client"
            >
              <UserPlus className="w-6 h-6" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={12} className="bg-slate-900 text-white border-slate-900 font-bold">
            Adicionar cliente
          </TooltipContent>
        </Tooltip>
      </div>

      <CreateClientWizard open={wizardOpen} onOpenChange={setWizardOpen} />

      <BottomNav />
    </div>
  );
}
