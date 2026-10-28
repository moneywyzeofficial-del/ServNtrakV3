import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useClients, useDeleteClient } from "@/hooks/use-clients";
import { useAppointments } from "@/hooks/use-appointments";
import { BottomNav } from "@/components/BottomNav";
import { Link } from "wouter";
import {
  Search,
  Leaf,
  Waves,
  ThermometerSun,
  Loader2,
  Phone,
  Users,
  Euro,
  Clock,
  ChevronRight,
  ArrowUpDown,
  CheckCircle,
  Calendar,
  CalendarDays,
  Trash2,
  MapPin,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  UserPlus,
  Navigation,
  Map as MapIcon,
  List as ListIcon,
  X,
  User,
  Sparkles,
} from "lucide-react";
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

const PAGE_SIZE = 12;

export default function Clients() {
  const { data: clients, isLoading } = useClients();
  const { data: appointments } = useAppointments();
  const deleteClient = useDeleteClient();
  const [deleteDialogClient, setDeleteDialogClient] = useState<Client | null>(null);
  const deleteTargetRef = useRef<number | null>(null);
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>("all");
  const [localityFilter, setLocalityFilter] = useState<string | null>(null);
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
      garden: clients.filter((c) => c.hasGarden).length,
      pool: clients.filter((c) => c.hasPool).length,
      jacuzzi: clients.filter((c) => c.hasJacuzzi).length,
      monthlyRevenue: clients
        .filter((c) => c.billingType === 'monthly')
        .reduce((sum, c) => sum + (c.monthlyRate || 0), 0),
    };
  }, [clients]);

  const uniqueLocalities = useMemo(() => {
    if (!clients) return [];
    const set = new Set<string>();
    clients.forEach((c) => {
      if (c.locality && c.locality.trim().length > 1) {
        set.add(c.locality.trim());
      }
    });
    return Array.from(set).slice(0, 4);
  }, [clients]);

  const paymentStatusMap = useMemo(() => {
    const map = new Map<number, 'paid' | 'pending' | 'none'>();
    if (!currentMonthPayments) return map;
    currentMonthPayments.forEach((payment) => {
      map.set(payment.clientId, payment.isPaid ? 'paid' : 'pending');
    });
    return map;
  }, [currentMonthPayments]);

  const filteredAndSortedClients = useMemo(() => {
    let result = clients?.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.address?.toLowerCase().includes(search.toLowerCase()) ||
      c.locality?.toLowerCase().includes(search.toLowerCase()) ||
      `#c-${c.id}`.includes(search.toLowerCase())
    ) || [];

    if (serviceFilter !== "all") {
      result = result.filter((c) => {
        if (serviceFilter === "garden") return c.hasGarden;
        if (serviceFilter === "pool") return c.hasPool;
        if (serviceFilter === "jacuzzi") return c.hasJacuzzi;
        return true;
      });
    }

    if (localityFilter) {
      result = result.filter((c) => c.locality?.toLowerCase() === localityFilter.toLowerCase());
    }

    if (billingFilter !== "all") {
      result = result.filter((c) => c.billingType === billingFilter);
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
  }, [clients, search, serviceFilter, localityFilter, billingFilter, sortBy, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [search, serviceFilter, localityFilter, billingFilter, sortBy, sortDir]);

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
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

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
      return active ? { label: "Ativo", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" } : { label: "Sem serviço", color: "bg-muted text-muted-foreground" };
    }
    if (nv.isCompleted) return { label: "Concluído", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" };
    const now = Date.now();
    const d = nv.date.getTime();
    const day = 24 * 60 * 60 * 1000;
    if (d < now - day) return { label: "Atrasado", color: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300" };
    if (d < now + day) return { label: "Hoje", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" };
    if (d < now + 2 * day) return { label: "Amanhã", color: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300" };
    if (d < now + 7 * day) return { label: "Em breve", color: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300" };
    return { label: "Agendado", color: "bg-muted text-muted-foreground" };
  };

  const getMapsUrl = (c: Client) => {
    if (c.latitude && c.longitude) {
      return `https://www.google.com/maps?q=${c.latitude},${c.longitude}`;
    }
    return `https://www.google.com/maps/search/${encodeURIComponent(c.address || c.locality || c.name)}`;
  };

  const handleDropdownSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
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
    <div className="min-h-screen bg-background pb-28 page-transition">
      <PageHeader
        title="Clientes"
        subtitle="Gestão e lista de campo"
        backHref="/more"
      />

      <div className="max-w-4xl mx-auto px-4 py-3 space-y-4">
        {/* Pesquisa & Filtros Rápidos (Inspirado no Google Stitch) */}
        <div className="space-y-2.5">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Pesquisar por nome, morada ou código (#C-...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 pl-10 pr-10 rounded-2xl bg-card border-border/50 text-foreground placeholder:text-muted-foreground shadow-xs text-sm"
              data-testid="input-search-clients"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90 transition-transform"
                aria-label="Limpar pesquisa"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Pills com Contadores */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5" role="tablist">
            <button
              type="button"
              onClick={() => { setServiceFilter("all"); setLocalityFilter(null); }}
              className={cn(
                "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold active:scale-95 transition-all shadow-2xs",
                serviceFilter === "all" && !localityFilter
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted border border-border/40"
              )}
              data-testid="button-filter-all"
            >
              Todos <span className="ml-1 opacity-80 text-[11px] font-mono">({stats.total})</span>
            </button>
            <button
              type="button"
              onClick={() => { setServiceFilter("pool"); setLocalityFilter(null); }}
              className={cn(
                "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold active:scale-95 transition-all shadow-2xs inline-flex items-center gap-1.5",
                serviceFilter === "pool"
                  ? "bg-blue-600 text-white"
                  : "bg-card text-muted-foreground hover:bg-muted border border-border/40"
              )}
              data-testid="button-filter-pool"
            >
              <Waves className="w-3.5 h-3.5" />
              <span>Piscinas</span>
              <span className="opacity-80 text-[11px] font-mono">({stats.pool})</span>
            </button>
            <button
              type="button"
              onClick={() => { setServiceFilter("garden"); setLocalityFilter(null); }}
              className={cn(
                "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold active:scale-95 transition-all shadow-2xs inline-flex items-center gap-1.5",
                serviceFilter === "garden"
                  ? "bg-emerald-600 text-white"
                  : "bg-card text-muted-foreground hover:bg-muted border border-border/40"
              )}
              data-testid="button-filter-garden"
            >
              <Leaf className="w-3.5 h-3.5" />
              <span>Jardins</span>
              <span className="opacity-80 text-[11px] font-mono">({stats.garden})</span>
            </button>
            {uniqueLocalities.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setLocalityFilter(localityFilter === loc ? null : loc)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold active:scale-95 transition-all shadow-2xs",
                  localityFilter === loc
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-card text-muted-foreground hover:bg-muted border border-border/40"
                )}
              >
                {loc}
              </button>
            ))}
          </div>

          {/* Barra de Ordenação e Seletor de Modo (Lista vs Mapa) */}
          <div className="flex items-center justify-between pt-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs font-bold text-foreground bg-card border border-border/40 px-3 py-1.5 rounded-xl active:scale-95 transition-transform shadow-2xs"
                  data-testid="button-sort"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
                  <span>{sortBy === "name" ? "Por Nome" : sortBy === "value" ? "Por Valor" : "Mais Recentes"}</span>
                  <span className="text-[10px] text-muted-foreground ml-0.5">{sortDir === "asc" ? "↑" : "↓"}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Ordenar Lista</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleDropdownSort("name")} data-testid="sort-name">
                  <span className="flex-1">Por Nome</span>
                  {sortBy === "name" && <span className="text-primary text-xs">{sortDir === "asc" ? "A-Z" : "Z-A"}</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDropdownSort("value")} data-testid="sort-value">
                  <span className="flex-1">Por Valor</span>
                  {sortBy === "value" && <span className="text-primary text-xs">{sortDir === "asc" ? "Menor" : "Maior"}</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDropdownSort("recent")} data-testid="sort-recent">
                  <span className="flex-1">Mais Recentes</span>
                  {sortBy === "recent" && <span className="text-primary text-xs">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Tipo de Faturação</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setBillingFilter("all")} data-testid="billing-all">
                  {billingFilter === "all" && <CheckCircle className="w-3 h-3 mr-2 text-primary" />}
                  {billingFilter !== "all" && <div className="w-3 h-3 mr-2" />}
                  Todos os planos
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

            {/* Alternador Lista / Mapa */}
            <div className="inline-flex p-1 bg-muted/60 rounded-xl border border-border/40">
              <span className="px-3 py-1 rounded-lg bg-card text-primary shadow-xs flex items-center gap-1.5 text-xs font-bold">
                <ListIcon className="w-3.5 h-3.5" />
                <span>Lista</span>
              </span>
              <Link
                href="/clients/map"
                className="px-3 py-1 rounded-lg text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs font-bold active:scale-95 transition-all"
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Mapa</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-card rounded-2xl border border-border/40 p-2.5 sm:p-3 text-center shadow-xs">
            <Users className="w-4 h-4 mx-auto mb-1 text-primary" aria-hidden="true" />
            <p className="text-base sm:text-lg font-bold text-foreground" data-testid="text-total-clients">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Total</p>
          </div>
          <div className="bg-card rounded-2xl border border-border/40 p-2.5 sm:p-3 text-center shadow-xs">
            <Leaf className="w-4 h-4 mx-auto mb-1 text-emerald-600" aria-hidden="true" />
            <p className="text-base sm:text-lg font-bold text-foreground">{stats.garden}</p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Jardim</p>
          </div>
          <div className="bg-card rounded-2xl border border-border/40 p-2.5 sm:p-3 text-center shadow-xs">
            <Waves className="w-4 h-4 mx-auto mb-1 text-blue-500" aria-hidden="true" />
            <p className="text-base sm:text-lg font-bold text-foreground">{stats.pool}</p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Piscina</p>
          </div>
          <div className="bg-card rounded-2xl border border-border/40 p-2.5 sm:p-3 text-center shadow-xs">
            <Euro className="w-4 h-4 mx-auto mb-1 text-primary" aria-hidden="true" />
            <p className="text-base sm:text-lg font-bold text-foreground">{stats.monthlyRevenue}€</p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Mensal</p>
          </div>
        </div>

        {/* Lista de Cartões de Clientes (Design Stitch) */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : paginatedClients.length > 0 ? (
          <>
            <div className="space-y-3.5">
              {paginatedClients.map((client) => {
                const value = getClientValue(client);
                const status = getClientStatus(client);
                const thumbnail = getClientThumbnail(client);
                const nv = nextVisits.get(client.id);
                const mapsUrl = getMapsUrl(client);

                return (
                  <article
                    key={client.id}
                    className="bg-card rounded-2xl border border-border/40 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col"
                    data-testid={`card-client-${client.id}`}
                  >
                    {/* Banner do Cartão com Imagem ou Gradiente Estilizado */}
                    <div className="w-full h-32 sm:h-36 relative bg-muted overflow-hidden">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-muted to-muted/80 flex items-center justify-center">
                          <span className="text-3xl font-black text-primary/20 tracking-wider">
                            {getInitials(client.name)}
                          </span>
                        </div>
                      )}

                      {/* Gradiente escuro de legibilidade */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

                      {/* Badges de topo: Ref e Plano */}
                      <div className="absolute top-2.5 left-3 flex items-center gap-1.5 z-10">
                        <span className="font-mono text-[11px] font-bold bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-full shadow-xs">
                          #C-{client.id}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white shadow-xs">
                          {client.billingType === "monthly" ? "Mensal" : client.billingType === "hourly" ? "Horário" : "Por Visita"}
                        </span>
                      </div>

                      {/* Badge de estado no topo direito */}
                      <div className="absolute top-2.5 right-3 z-10">
                        <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-xs", status.color)}>
                          {status.label}
                        </span>
                      </div>

                      {/* Badge de tipologia no canto inferior esquerdo */}
                      <div className="absolute bottom-2.5 left-3 z-10 flex items-center gap-1">
                        {client.hasPool && (
                          <span className="inline-flex items-center gap-1 bg-card/90 backdrop-blur-md text-blue-700 dark:text-blue-300 text-[11px] font-bold px-2 py-0.5 rounded-lg shadow-xs">
                            <Waves className="w-3 h-3" /> Piscina
                          </span>
                        )}
                        {client.hasGarden && (
                          <span className="inline-flex items-center gap-1 bg-card/90 backdrop-blur-md text-emerald-700 dark:text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded-lg shadow-xs">
                            <Leaf className="w-3 h-3" /> Jardim
                          </span>
                        )}
                      </div>

                      {/* Valor no canto inferior direito */}
                      {value && (
                        <div className="absolute bottom-2.5 right-3 z-10">
                          <span className="font-mono font-bold text-xs text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg shadow-xs">
                            {value}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Conteúdo do Cartão */}
                    <div className="p-3.5 sm:p-4 flex flex-col gap-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <Link href={`/clients/${client.id}`}>
                            <h3
                              className="font-bold text-foreground text-base truncate hover:text-primary transition-colors cursor-pointer"
                              data-testid={`text-client-name-${client.id}`}
                            >
                              {client.name}
                            </h3>
                          </Link>
                          {(client.locality || client.address) && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate">
                              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="truncate">{client.locality || client.address}</span>
                            </p>
                          )}
                        </div>

                        {/* Botão de eliminar subtil */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground/40 hover:text-destructive active:scale-90"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteDialogClient(client);
                            deleteTargetRef.current = client.id;
                          }}
                          data-testid={`button-delete-${client.id}`}
                          aria-label="Eliminar cliente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {/* Informação da próxima visita se existir */}
                      {nv && !nv.isCompleted && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 p-2 rounded-xl border border-border/30">
                          <CalendarDays className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>Próxima visita: <strong>{new Date(nv.date).toLocaleDateString("pt-PT")}</strong></span>
                          <span className="text-[10px] text-muted-foreground ml-auto">({nv.type})</span>
                        </div>
                      )}

                      {/* Ações Ergonómicas de Campo (44px min-height) */}
                      <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                        {client.phone ? (
                          <a
                            href={`tel:${client.phone}`}
                            className="flex-1 min-h-[44px] px-3 rounded-xl bg-muted/60 hover:bg-muted text-foreground flex items-center justify-center gap-1.5 text-xs font-semibold active:scale-95 transition-transform border border-border/40"
                            aria-label={`Ligar para ${client.name}`}
                          >
                            <Phone className="w-3.5 h-3.5 text-primary" />
                            <span>Ligar</span>
                          </a>
                        ) : null}

                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-h-[44px] px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 flex items-center justify-center gap-1.5 text-xs font-semibold active:scale-95 transition-transform border border-blue-200/50"
                          aria-label={`GPS para ${client.name}`}
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>GPS</span>
                        </a>

                        <Link
                          href={`/clients/${client.id}`}
                          className="flex-1 min-h-[44px] px-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center gap-1.5 text-xs font-semibold active:scale-95 transition-transform shadow-2xs"
                        >
                          <span>Ficha</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4 pb-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 rounded-lg"
                  disabled={page <= 1}
                  onClick={() => setPage(1)}
                  aria-label="Primeira página"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 rounded-lg"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
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
                  className="h-8 rounded-lg"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Página seguinte"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 rounded-lg"
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
          <div className="empty-state bg-card rounded-2xl border border-border/40 p-8 text-center">
            <div className="empty-state-icon bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3">
              {search || serviceFilter !== "all" || localityFilter ? (
                <Search className="w-6 h-6 text-primary" />
              ) : (
                <Users className="w-6 h-6 text-primary" />
              )}
            </div>
            <h3 className="font-bold text-foreground text-base">
              {search || serviceFilter !== "all" || localityFilter ? "Nenhum cliente encontrado" : "Sem clientes registados"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {search || serviceFilter !== "all" || localityFilter
                ? "Tente ajustar os filtros ou pesquisar por outro termo."
                : "Adicione o primeiro cliente com o botão abaixo para começar a rota e agendamentos!"}
            </p>
          </div>
        )}
      </div>

      {/* Confirmação de Eliminação */}
      <AlertDialog open={!!deleteDialogClient} onOpenChange={(open) => { if (!open) { setDeleteDialogClient(null); deleteTargetRef.current = null; } }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar <strong>{deleteDialogClient?.name}</strong>?
              Esta ação é irreversível e removerá todos os dados e serviços associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteClient.isPending} className="rounded-xl">Cancelar</AlertDialogCancel>
            <Button
              disabled={deleteClient.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
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

      {/* Botão Flutuante (FAB) para Adicionar Cliente */}
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
