import { useState } from "react";
import { useReminders, useCreateReminder, useUpdateReminder, useDeleteReminder } from "@/hooks/use-reminders";
import { useClients } from "@/hooks/use-clients";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, isPast, isToday, addWeeks, addMonths, addYears } from "date-fns";
import { pt } from "date-fns/locale";
import { Loader2, Plus, Bell, Clock, Trash2, CheckCircle2, AlertCircle, Leaf, Waves, ThermometerSun, Phone, Eye, Search, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { useLocation } from "wouter";
import { DataTable, ColumnDef, SortDir } from "@/components/ui/data-table";

const frequencyLabels: Record<string, string> = {
  weekly: "Semanal",
  biweekly: "Quinzenal",
  monthly: "Mensal",
  quarterly: "Trimestral",
  yearly: "Anual",
};

const categoryColors: Record<string, string> = {
  Geral: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  Cliente: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  Compra: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  Pagamento: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  Manutenção: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  Orçamento: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
  Pessoal: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800",
};

const priorityColors: Record<string, string> = {
  Normal: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  Alta: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  Urgente: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
};

function getNextDueDate(frequency: string, fromDate: Date = new Date()): Date {
  switch (frequency) {
    case "weekly": return addWeeks(fromDate, 1);
    case "biweekly": return addWeeks(fromDate, 2);
    case "monthly": return addMonths(fromDate, 1);
    case "quarterly": return addMonths(fromDate, 3);
    case "yearly": return addYears(fromDate, 1);
    default: return addMonths(fromDate, 1);
  }
}

export default function Reminders() {
  const [activeTab, setActiveTab] = useState("todos");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string>("nextDue");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { data: reminders, isLoading } = useReminders();
  const { data: clients } = useClients();
  const deleteReminder = useDeleteReminder();
  const updateReminder = useUpdateReminder();
  const [, navigate] = useLocation();

  const overdueReminders = reminders?.filter(r => r.isActive && !r.isCompleted && isPast(new Date(r.nextDue)) && !isToday(new Date(r.nextDue))) || [];
  const todayReminders = reminders?.filter(r => r.isActive && !r.isCompleted && isToday(new Date(r.nextDue))) || [];
  const upcomingReminders = reminders?.filter(r => r.isActive && !r.isCompleted && !isPast(new Date(r.nextDue)) && !isToday(new Date(r.nextDue))) || [];

  // Filter reminders for DataTable
  const completedCount = reminders?.filter(r => r.isCompleted).length ?? 0;

  const filteredReminders = reminders?.filter(reminder => {
    const matchesTab = activeTab === "todos" || 
      (activeTab === "ativos" && reminder.isActive && !reminder.isCompleted) || 
      (activeTab === "inativos" && !reminder.isActive) ||
      (activeTab === "concluidos" && reminder.isCompleted);
    const matchesSearch = !search.trim() || 
      reminder.client?.name.toLowerCase().includes(search.toLowerCase()) ||
      (reminder.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (reminder.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (reminder.category || "").toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  }) || [];

  const sortedReminders = [...filteredReminders].sort((a, b) => {
    let aVal: any, bVal: any;
    if (sortKey === "nextDue") {
      aVal = new Date(a.nextDue).getTime();
      bVal = new Date(b.nextDue).getTime();
    } else if (sortKey === "client") {
      aVal = a.client?.name || "";
      bVal = b.client?.name || "";
    } else {
      return 0;
    }
    if (sortDir === "asc") {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const paginatedReminders = sortedReminders.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key: string, dir: SortDir) => {
    setSortKey(key);
    setSortDir(dir);
    setPage(1); // Reset to first page on sort
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const columns: ColumnDef<any>[] = [
    {
      key: "client",
      header: "Cliente",
      sortable: true,
      cell: (reminder) => reminder.client?.name || "Sem cliente associado",
      mobileLabel: "Cliente",
      className: "font-medium md:font-normal",
    },
    {
      key: "title",
      header: "Descrição",
      sortable: false,
      cell: (reminder) => (
        <div>
          <span>{reminder.title}</span>
          {reminder.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{reminder.description}</p>
          )}
        </div>
      ),
      mobileLabel: "Descrição",
    },
    {
      key: "category",
      header: "Categoria",
      sortable: false,
      cell: (reminder) => (
        <Badge variant="outline" className={cn("text-xs font-normal", categoryColors[reminder.category || "Geral"])}>
          {reminder.category || "Geral"}
        </Badge>
      ),
      mobileLabel: "Categoria",
    },
    {
      key: "priority",
      header: "Prioridade",
      sortable: false,
      cell: (reminder) => (
        <Badge variant="outline" className={cn("text-xs font-normal", priorityColors[reminder.priority || "Normal"])}>
          {reminder.priority || "Normal"}
        </Badge>
      ),
      mobileLabel: "Prioridade",
    },
    {
      key: "frequency",
      header: "Frequência",
      sortable: false,
      cell: (reminder) => reminder.frequency ? (frequencyLabels[reminder.frequency] || reminder.frequency) : "—",
      mobileLabel: "Frequência",
      className: "text-muted-foreground text-sm md:text-foreground md:text-sm",
    },
    {
      key: "nextDue",
      header: "Próximo Aviso",
      sortable: true,
      cell: (reminder) => format(new Date(reminder.nextDue), "dd/MM/yyyy", { locale: pt }),
      mobileLabel: "Próximo Aviso",
      className: "text-muted-foreground text-sm md:text-foreground md:text-sm",
    },
    {
      key: "status",
      header: "Estado",
      sortable: false,
      cell: (reminder) => (
        reminder.isCompleted ? (
          <Badge variant="secondary">Concluído</Badge>
        ) : (
          <Badge variant={reminder.isActive ? "default" : "secondary"}>
            {reminder.isActive ? "Ativo" : "Inativo"}
          </Badge>
        )
      ),
    },
    {
      key: "actions",
      header: "Ações",
      sortable: false,
      isAction: true,
      cell: (reminder) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleComplete(reminder)}
            disabled={reminder.isCompleted || !reminder.isActive}
          >
            <CheckCircle2 className="w-4 h-4" />
            Feito
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteReminder.mutate(reminder.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const onDemandClients = clients?.filter(c => 
    c.gardenVisitFrequency === "on_demand" || 
    c.poolVisitFrequency === "on_demand" || 
    c.jacuzziVisitFrequency === "on_demand"
  ) || [];

  const getOnDemandServices = (client: typeof clients extends (infer T)[] | undefined ? T : never) => {
    const services: { type: string; icon: typeof Leaf; color: string }[] = [];
    if (client.hasGarden && client.gardenVisitFrequency === "on_demand") {
      services.push({ type: "Jardim", icon: Leaf, color: "text-green-600" });
    }
    if (client.hasPool && client.poolVisitFrequency === "on_demand") {
      services.push({ type: "Piscina", icon: Waves, color: "text-blue-600" });
    }
    if (client.hasJacuzzi && client.jacuzziVisitFrequency === "on_demand") {
      services.push({ type: "Jacuzzi", icon: ThermometerSun, color: "text-muted-foreground" });
    }
    return services;
  };

  const handleComplete = async (reminder: typeof reminders extends (infer T)[] | undefined ? T : never) => {
    if (reminder.frequency) {
      const nextDue = getNextDueDate(reminder.frequency, new Date());
      await updateReminder.mutateAsync({ id: reminder.id, data: { nextDue } });
    } else {
      await updateReminder.mutateAsync({
        id: reminder.id,
        data: { isCompleted: true, completedAt: new Date(), isActive: false },
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Lembretes"
        subtitle="Notas, tarefas e avisos importantes"
        backHref="/more"
        rightSlot={<AddReminderDialog />}
      />

      {!isLoading && (
        <div className="px-6 mt-6 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-50/50 border border-red-200/50 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700">{overdueReminders.length}</p>
                  <p className="text-xs text-red-600 font-medium">Em atraso</p>
                </div>
              </div>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{todayReminders.length}</p>
                  <p className="text-xs text-primary font-medium">Hoje</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-700">{upcomingReminders.length}</p>
                  <p className="text-xs text-slate-500 font-medium">Próximos</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50/50 border border-green-200/50 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                  <ListChecks className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{reminders?.filter(r => r.isActive && !r.isCompleted).length ?? 0}</p>
                  <p className="text-xs text-green-600 font-medium">Ativos</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="bg-teal-50/50 border border-teal-200/50 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-teal-700">{completedCount}</p>
                  <p className="text-xs text-teal-600 font-medium">Concluídos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <>
            {onDemandClients.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="w-4 h-4 text-purple-500" />
                  <h2 className="text-sm font-semibold text-purple-600 uppercase tracking-wider">Clientes a verificar</h2>
                  <Badge variant="outline" className="text-xs border-purple-300 text-purple-600">{onDemandClients.length}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Clientes sem acordo fixo — confirmar se precisam de serviço</p>
                <div className="space-y-2">
                  {onDemandClients.map((client) => {
                    const services = getOnDemandServices(client);
                    return (
                      <div 
                        key={client.id}
                        className="bg-purple-50/50 border border-purple-200/50 rounded-xl p-3 cursor-pointer hover-elevate"
                        onClick={() => navigate(`/clients/${client.id}`)}
                        data-testid={`on-demand-client-${client.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <Eye className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{client.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {services.map((service, idx) => {
                                  const ServiceIcon = service.icon;
                                  return (
                                    <span key={idx} className={`flex items-center gap-1 text-xs ${service.color}`}>
                                      <ServiceIcon className="w-3 h-3" />
                                      {service.type}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs border-purple-300 text-purple-600">
                            Quando necessário
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Todos os lembretes</h2>
              </div>

              <div className="relative mb-3">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  inputMode="search"
                  placeholder="Procurar por cliente ou descrição…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-10"
                  aria-label="Pesquisar lembretes"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
                    aria-label="Limpar pesquisa"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                <button
                  onClick={() => setActiveTab("todos")}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                    activeTab === "todos"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setActiveTab("ativos")}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                    activeTab === "ativos"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  Ativos
                </button>
                <button
                  onClick={() => setActiveTab("inativos")}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                    activeTab === "inativos"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  Inativos
                </button>
                <button
                  onClick={() => setActiveTab("concluidos")}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                    activeTab === "concluidos"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  Concluídos
                </button>
              </div>

              {paginatedReminders.length === 0 ? (
                <div className="bg-card rounded-2xl p-8 text-center border border-border/50">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-foreground font-medium">Sem lembretes</p>
                  <p className="text-sm text-muted-foreground mt-1">Adicione lembretes para tarefas, compras, clientes ou manutenções</p>
                </div>
              ) : (
                <DataTable
                  data={paginatedReminders}
                  columns={columns}
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                  page={page}
                  pageSize={pageSize}
                  totalCount={sortedReminders.length}
                  onPageChange={handlePageChange}
                />
              )}
            </section>

          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function AddReminderDialog() {
  const [open, setOpen] = useState(false);
  const { data: clients } = useClients();
  const createReminder = useCreateReminder();

  const formSchema = z.object({
    title: z.string().min(1, "Título é obrigatório"),
    type: z.string(),
    clientId: z.string().optional(),
    frequency: z.string().optional(),
    category: z.string().optional(),
    priority: z.string().optional(),
    description: z.string().optional(),
    nextDue: z.date(),
    isActive: z.boolean().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: "General",
      clientId: "__none__",
      frequency: "__none__",
      category: "Geral",
      priority: "Normal",
      description: "",
      nextDue: new Date(),
      isActive: true,
    }
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const payload = {
        ...values,
        clientId: values.clientId === "__none__" ? undefined : Number(values.clientId),
        frequency: values.frequency === "__none__" ? undefined : values.frequency,
        description: values.description?.trim() || undefined,
      };
      await createReminder.mutateAsync(payload as any);
      setOpen(false);
      form.reset();
    } catch (e) {}
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1" data-testid="button-add-reminder">
          <Plus className="w-4 h-4" /> Novo
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Lembrete</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Reunião com cliente" className="rounded-xl" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalhes do lembrete..." className="rounded-xl resize-none" rows={3} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Geral">Geral</SelectItem>
                        <SelectItem value="Cliente">Cliente</SelectItem>
                        <SelectItem value="Compra">Compra</SelectItem>
                        <SelectItem value="Pagamento">Pagamento</SelectItem>
                        <SelectItem value="Manutenção">Manutenção</SelectItem>
                        <SelectItem value="Orçamento">Orçamento</SelectItem>
                        <SelectItem value="Pessoal">Pessoal</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Serviço</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Garden">Jardim</SelectItem>
                      <SelectItem value="Pool">Piscina</SelectItem>
                      <SelectItem value="Jacuzzi">Jacuzzi</SelectItem>
                      <SelectItem value="General">Geral</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? "__none__"}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Sem cliente associado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">Sem cliente associado</SelectItem>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={String(client.id)}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequência</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? "__none__"}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Sem recorrência" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">Sem recorrência</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="biweekly">Quinzenal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nextDue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Próxima Data</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      className="rounded-xl"
                      {...field}
                      value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full btn-primary" disabled={createReminder.isPending}>
              {createReminder.isPending ? "A criar..." : "Criar Lembrete"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
