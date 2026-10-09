import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAppointments, useCreateAppointment, useUpdateAppointment, useDeleteAppointment } from "@/hooks/use-appointments";
import { useClients } from "@/hooks/use-clients";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BottomNav } from "@/components/BottomNav";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, isSameDay, isAfter, startOfDay, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { getFreeHoursForDay, suggestNextDaySlots, suggestSameDayHours } from "@/lib/suggestSlots";
import { Loader2, MapPin, Clock, CheckCircle2, ChevronRight, CalendarDays, Plus, AlertTriangle, ClipboardList, Wand2, Trash2, CheckCheck, ChevronDown, Pencil, X, FileText } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useWorkingHours } from "@/hooks/use-working-hours";
import { computeWorkingHours } from "@/lib/working-hours";
import { SmartPicker } from "@/components/SmartPicker";
import { QuickAddForm } from "@/components/QuickAddForm";
import type { PendingTaskWithClient, AppointmentPreview } from "@shared/schema";

const appointmentFormSchema = z.object({
  clientId: z.number().min(1, "Selecione um cliente"),
  type: z.string(),
  serviceType: z.string().optional(),
  notes: z.string().optional(),
  date: z.coerce.date(),
});

const DEFAULT_ZONES = ["Garden", "Pool", "Jacuzzi", "General"] as const;
const DEFAULT_SERVICE_TYPES = ["Manutenção", "Limpeza", "Tratamento", "Reparação", "Instalação"];

function loadFromStorage<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
}

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: appointments, isLoading } = useAppointments();
  const { data: clients } = useClients();
  const createApt = useCreateAppointment();
  const updateApt = useUpdateAppointment();
  const deleteApt = useDeleteAppointment();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  type AptWithClient = NonNullable<typeof appointments>[number];
  const [selectedApt, setSelectedApt] = useState<AptWithClient | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [customZones, setCustomZones] = useState<string[]>(() => loadFromStorage("apt_customZones", []));
  const [customServiceTypes, setCustomServiceTypes] = useState<string[]>(() => loadFromStorage("apt_customServiceTypes", DEFAULT_SERVICE_TYPES));
  const [addingZone, setAddingZone] = useState(false);
  const [newZoneInput, setNewZoneInput] = useState("");
  const [addingServiceType, setAddingServiceType] = useState(false);
  const [newServiceTypeInput, setNewServiceTypeInput] = useState("");
  const queryClient = useQueryClient();
  const [workingHoursSettings] = useWorkingHours();
  const workingHourSlots = computeWorkingHours(workingHoursSettings);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [previewMonth, setPreviewMonth] = useState(new Date().getMonth() + 1);
  const [previewYear, setPreviewYear] = useState(new Date().getFullYear());
  const [previewList, setPreviewList] = useState<AppointmentPreview[]>([]);
  const [removedIndexes, setRemovedIndexes] = useState<Set<number>>(new Set());
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const generatePreviewMutation = useMutation({
    mutationFn: async ({ year, month }: { year: number; month: number }) => {
      const res = await fetch("/api/appointments/generate-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ year, month }),
      });
      if (!res.ok) throw new Error("Erro ao gerar preview");
      return res.json() as Promise<AppointmentPreview[]>;
    },
    onSuccess: (data) => {
      if (workingHourSlots.length === 0) {
        setPreviewList([]);
        setRemovedIndexes(new Set());
        toast({
          title: "Horário de trabalho inválido",
          description:
            "O teu horário não permite nenhuma hora. Ajusta-o no Perfil para gerar agendamentos.",
          variant: "destructive",
        });
        return;
      }

      const occupied = new Map<string, Set<number>>();
      appointments?.forEach((a) => {
        const d = new Date(a.date);
        const key = format(d, "yyyy-MM-dd");
        if (!occupied.has(key)) occupied.set(key, new Set());
        occupied.get(key)!.add(d.getHours());
      });

      const enriched = data.map((p) => {
        const used = occupied.get(p.date) ?? new Set<number>();
        const free = workingHourSlots.find((h) => !used.has(h));
        const chosenHour = free ?? workingHourSlots[0];
        used.add(chosenHour);
        occupied.set(p.date, used);
        const isoDate = `${p.date}T${String(chosenHour).padStart(2, "0")}:00:00`;
        return { ...p, date: isoDate };
      });

      setPreviewList(enriched);
      setRemovedIndexes(new Set());
    },
    onError: () => toast({ title: "Erro", description: "Não foi possível gerar o preview.", variant: "destructive" }),
  });

  const confirmGenerateMutation = useMutation({
    mutationFn: async (appts: AppointmentPreview[]) => {
      const res = await fetch("/api/appointments/generate-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ appointments: appts }),
      });
      if (!res.ok) throw new Error("Erro ao confirmar");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setGenerateOpen(false);
      setPreviewList([]);
      toast({ title: "Agendamentos criados", description: `${data.created} agendamento(s) adicionados.` });
    },
    onError: () => toast({ title: "Erro", description: "Não foi possível criar os agendamentos.", variant: "destructive" }),
  });

  const { data: allPendingTasks } = useQuery<PendingTaskWithClient[]>({
    queryKey: ["/api/pending-tasks"],
    queryFn: async () => {
      const response = await fetch("/api/pending-tasks", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch pending tasks");
      return response.json();
    },
  });

  const selectedDateAppointments = appointments?.filter(apt => 
    date && isSameDay(new Date(apt.date), date)
  ) || [];

  const daysWithAppointments = appointments?.map(a => new Date(a.date)) || [];

  const fullDays = (() => {
    if (!appointments || workingHourSlots.length === 0) return [] as Date[];
    const workingSet = new Set(workingHourSlots);
    const occupied = new Map<string, Set<number>>();
    for (const apt of appointments) {
      const d = new Date(apt.date);
      const hour = d.getHours();
      if (!workingSet.has(hour)) continue;
      const key = format(d, "yyyy-MM-dd");
      if (!occupied.has(key)) occupied.set(key, new Set());
      occupied.get(key)!.add(hour);
    }
    const out: Date[] = [];
    occupied.forEach((hours, key) => {
      if (hours.size >= workingHourSlots.length) {
        out.push(parseISO(key));
      }
    });
    return out;
  })();

  const isFutureOrTodayDate = (d: Date) =>
    isAfter(startOfDay(d), startOfDay(new Date())) || isSameDay(d, new Date());

  const isFutureOrToday = date && isFutureOrTodayDate(date);

  const lastTapRef = useRef<{ time: number; day: Date } | null>(null);

  const form = useForm<z.infer<typeof appointmentFormSchema>>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      clientId: 0,
      type: "Garden",
      serviceType: "",
      notes: "",
      date: date || new Date(),
    }
  });

  const handleOpenDialog = (target?: Date) => {
    const baseDate = target ?? date;
    if (baseDate) {
      const dateWithTime = new Date(baseDate);
      dateWithTime.setHours(9, 0, 0, 0);
      form.reset({
        clientId: 0,
        type: "Garden",
        serviceType: "",
        notes: "",
        date: dateWithTime,
      });
    }
    setAddingZone(false);
    setAddingServiceType(false);
    setEditMode(false);
    setDialogOpen(true);
  };

  const handleOpenDetail = (apt: AptWithClient) => {
    setSelectedApt(apt);
    setEditMode(false);
    setDetailOpen(true);
  };

  const handleEditMode = () => {
    if (!selectedApt) return;
    form.reset({
      clientId: selectedApt.clientId,
      type: selectedApt.type,
      serviceType: (selectedApt as any).serviceType ?? "",
      notes: selectedApt.notes ?? "",
      date: new Date(selectedApt.date),
    });
    setAddingZone(false);
    setAddingServiceType(false);
    setEditMode(true);
  };

  const addCustomZone = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || customZones.includes(trimmed)) return;
    const updated = [...customZones, trimmed];
    setCustomZones(updated);
    localStorage.setItem("apt_customZones", JSON.stringify(updated));
    form.setValue("type", trimmed);
    setAddingZone(false);
    setNewZoneInput("");
  };

  const addCustomServiceType = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || customServiceTypes.includes(trimmed)) return;
    const updated = [...customServiceTypes, trimmed];
    setCustomServiceTypes(updated);
    localStorage.setItem("apt_customServiceTypes", JSON.stringify(updated));
    form.setValue("serviceType", trimmed);
    setAddingServiceType(false);
    setNewServiceTypeInput("");
  };

  const handleDayClick = (day: Date) => {
    const now = Date.now();
    const last = lastTapRef.current;
    if (last && isSameDay(last.day, day) && now - last.time < 500) {
      lastTapRef.current = null;
      setDate(day);
      handleOpenDialog(day);
      return;
    }
    lastTapRef.current = { time: now, day };
  };

  const onSubmit = async (values: z.infer<typeof appointmentFormSchema>) => {
    try {
      if (editMode && selectedApt) {
        await updateApt.mutateAsync({ id: selectedApt.id, ...values });
        setDetailOpen(false);
      } else {
        await createApt.mutateAsync(values);
        setDialogOpen(false);
      }
      form.reset();
    } catch (e) {}
  };

  const onDelete = async () => {
    if (!selectedApt) return;
    try {
      await deleteApt.mutateAsync(selectedApt.id);
      setDetailOpen(false);
      setSelectedApt(null);
    } catch (e) {}
  };

  const zoneLabel = (z: string) =>
    z === "Garden" ? "Jardim" : z === "Pool" ? "Piscina" : z === "Jacuzzi" ? "Jacuzzi" : z === "General" ? "Outro" : z;

  const zoneColor = (z: string) =>
    z === "Garden" ? "bg-green-100 text-green-700" :
    z === "Pool" ? "bg-blue-100 text-blue-700" :
    z === "Jacuzzi" ? "bg-cyan-100 text-cyan-700" :
    "bg-muted text-muted-foreground";

  const zoneGradient = (z: string) =>
    z === "Garden" ? "bg-gradient-to-br from-green-100 to-green-50 text-green-700" :
    z === "Pool" ? "bg-gradient-to-br from-blue-100 to-blue-50 text-blue-700" :
    z === "Jacuzzi" ? "bg-gradient-to-br from-cyan-100 to-cyan-50 text-cyan-700" :
    "bg-gradient-to-br from-muted to-muted/50 text-muted-foreground";

  const sortedClients = [...(clients ?? [])].sort((a, b) => a.name.localeCompare(b.name, "pt"));

  const renderFormFields = () => (
    <>
      {/* Client */}
      <FormField
        control={form.control}
        name="clientId"
        render={({ field }) => {
          const clientPendingTasks = field.value ? allPendingTasks?.filter(t => t.clientId === field.value) : [];
          return (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <FormControl>
                <SmartPicker
                  options={sortedClients.map(c => ({ label: c.name, value: c.id.toString() }))}
                  value={field.value ? field.value.toString() : ""}
                  onChange={(v) => field.onChange(Number(v))}
                  onAddNew={() => setShowQuickAdd(true)}
                  placeholder="Selecione um cliente"
                  searchPlaceholder="Pesquisar cliente..."
                  emptyText="Nenhum cliente encontrado."
                />
              </FormControl>
              {clientPendingTasks && clientPendingTasks.length > 0 && (
                <div className="mt-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-destructive">
                        {clientPendingTasks.length} tarefa{clientPendingTasks.length !== 1 ? "s" : ""} pendente{clientPendingTasks.length !== 1 ? "s" : ""}
                      </p>
                      <ul className="mt-1 space-y-1">
                        {clientPendingTasks.slice(0, 3).map(task => (
                          <li key={task.id} className="text-xs text-destructive flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-destructive" />
                            <span className="truncate">{task.description}</span>
                            {(task.priority === "urgent" || task.priority === "high") && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-red-100 text-red-600">
                                {task.priority === "urgent" ? "Urgente" : "Alta"}
                              </Badge>
                            )}
                          </li>
                        ))}
                        {clientPendingTasks.length > 3 && (
                          <li className="text-xs text-destructive">+{clientPendingTasks.length - 3} mais...</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </FormItem>
          );
        }}
      />

      {/* Zone */}
      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Zona</FormLabel>
            <Select
              onValueChange={(v) => {
                if (v === "__add_zone__") { setAddingZone(true); }
                else { field.onChange(v); setAddingZone(false); }
              }}
              value={addingZone ? "__add_zone__" : field.value}
            >
              <FormControl>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecione a zona" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Garden">Jardim</SelectItem>
                <SelectItem value="Pool">Piscina</SelectItem>
                <SelectItem value="Jacuzzi">Jacuzzi</SelectItem>
                <SelectItem value="General">Outro</SelectItem>
                {customZones.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                <SelectItem value="__add_zone__" className="text-primary font-medium">＋ Adicionar zona</SelectItem>
              </SelectContent>
            </Select>
            {addingZone && (
              <div className="flex gap-2 mt-1">
                <Input
                  value={newZoneInput}
                  onChange={e => setNewZoneInput(e.target.value)}
                  placeholder="Nome da zona..."
                  className="rounded-xl"
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomZone(newZoneInput))}
                  autoFocus
                />
                <Button type="button" size="sm" onClick={() => addCustomZone(newZoneInput)}>Adicionar</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => { setAddingZone(false); setNewZoneInput(""); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </FormItem>
        )}
      />

      {/* Service Type */}
      <FormField
        control={form.control}
        name="serviceType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo de Serviço</FormLabel>
            <Select
              onValueChange={(v) => {
                if (v === "__add_st__") { setAddingServiceType(true); }
                else { field.onChange(v); setAddingServiceType(false); }
              }}
              value={addingServiceType ? "__add_st__" : (field.value || "")}
            >
              <FormControl>
                <SelectTrigger className="rounded-xl" data-testid="select-appointment-type">
                  <SelectValue placeholder="Selecione o tipo de serviço" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {customServiceTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                <SelectItem value="__add_st__" className="text-primary font-medium">＋ Adicionar tipo</SelectItem>
              </SelectContent>
            </Select>
            {addingServiceType && (
              <div className="flex gap-2 mt-1">
                <Input
                  value={newServiceTypeInput}
                  onChange={e => setNewServiceTypeInput(e.target.value)}
                  placeholder="Nome do serviço..."
                  className="rounded-xl"
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomServiceType(newServiceTypeInput))}
                  autoFocus
                />
                <Button type="button" size="sm" onClick={() => addCustomServiceType(newServiceTypeInput)}>Adicionar</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => { setAddingServiceType(false); setNewServiceTypeInput(""); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </FormItem>
        )}
      />
    </>
  );

  return (
    <div className="min-h-screen bg-background pb-24 page-transition">
      <div className="gradient-primary pt-10 pb-6 px-5">
        <div className="flex items-center gap-2 mb-2">
          <BackButton />
          <h1 className="text-2xl font-extrabold text-white">Agenda</h1>
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => setGenerateOpen(true)}
              data-testid="button-generate-appointments"
            >
              <Wand2 className="w-4 h-4" />
              Gerar Mês
            </Button>
          </div>
        </div>
        <p className="text-white/70 text-sm">Gerir agendamentos e visitas</p>
      </div>

      <div className="px-5 -mt-4 relative z-10">
        <div className="glass-card p-4 mb-6">
          <DayPicker
            mode="single"
            required
            selected={date}
            onSelect={setDate}
            onDayClick={handleDayClick}
            locale={pt}
            modifiers={{ hasAppointment: daysWithAppointments, fullDay: fullDays }}
            modifiersClassNames={{
              hasAppointment: 'has-appointment',
              fullDay: 'full-day'
            }}
            className="mx-auto calendar-modern"
          />
          <p
            className="text-center text-xs text-muted-foreground mt-2"
            data-testid="text-calendar-quick-create-hint"
          >
            Toca duas vezes numa data para agendar rapidamente
          </p>
        </div>
      </div>

      <style>{`
        .calendar-modern .rdp-day_selected {
          background: hsl(var(--primary)) !important;
          color: white !important;
          border-radius: 50% !important;
          font-weight: bold;
        }
        .calendar-modern .rdp-day_today {
          border: 2px solid hsl(var(--primary));
          border-radius: 50%;
        }
        .calendar-modern .has-appointment {
          font-weight: 700;
          color: hsl(var(--primary));
        }
        .calendar-modern .has-appointment::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          background: hsl(var(--primary));
          border-radius: 50%;
        }
        .calendar-modern .full-day:not(.rdp-day_selected) {
          background: hsl(var(--muted));
          color: hsl(var(--muted-foreground));
          border-radius: 50%;
        }
        .calendar-modern .full-day::after {
          background: hsl(var(--destructive));
        }
        .calendar-modern .rdp-caption_label {
          font-weight: 700;
          color: hsl(var(--foreground));
          text-transform: capitalize;
        }
        .calendar-modern .rdp-head_cell {
          color: hsl(var(--muted-foreground));
          font-size: 0.75rem;
          font-weight: 500;
        }
        .calendar-modern .rdp-button:hover:not(.rdp-day_selected) {
          background: hsl(var(--muted));
          border-radius: 50%;
        }
        .calendar-modern .rdp-nav_button {
          color: hsl(var(--primary));
        }
      `}</style>

      <div className="px-5 space-y-4">
        <div className="section-header flex items-center justify-between">
          <h2 className="section-title">
            {date ? format(date, "EEEE, d 'de' MMMM", { locale: pt }) : "Selecione uma data"}
          </h2>
          <Button
              size="sm"
              className="rounded-full h-9 px-3 shadow-lg gap-1.5"
              onClick={() => handleOpenDialog()}
              data-testid="button-add-appointment"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs font-medium">Adicionar</span>
            </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : selectedDateAppointments.length > 0 ? (
          <div className="space-y-3">
            {selectedDateAppointments.map((apt, index) => (
              <div
                key={apt.id}
                className="mobile-card flex items-center gap-4 cursor-pointer"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => handleOpenDetail(apt)}
                data-testid={`card-calendar-appointment-${apt.id}`}
              >
                <div className={cn("w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 font-bold", zoneGradient(apt.type))}>
                  <span className="text-lg leading-none">{format(new Date(apt.date), "HH")}</span>
                  <span className="text-[10px] leading-none mt-0.5">{format(new Date(apt.date), "mm")}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate">{apt.client.name}</h3>
                  {apt.client.address && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1 truncate">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{apt.client.address}</span>
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={cn("badge-pill", zoneColor(apt.type))}>{zoneLabel(apt.type)}</span>
                    {(apt as any).serviceType && (
                      <span className="badge-pill bg-primary/10 text-primary">{(apt as any).serviceType}</span>
                    )}
                    {apt.isCompleted && (
                      <span className="badge-pill bg-green-100 text-green-700">
                        <CheckCircle2 className="w-3 h-3" /> Feito
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground/50 shrink-0" />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state bg-card rounded-2xl border border-border/30">
            <div className="empty-state-icon bg-primary/5">
              <CalendarDays className="w-7 h-7 text-primary/60" />
            </div>
            <h3 className="font-semibold text-foreground">Sem agendamentos</h3>
            <p className="text-sm text-muted-foreground mt-1">Nenhuma visita marcada para este dia</p>
            <Button
                className="mt-4"
                onClick={() => handleOpenDialog()}
                data-testid="button-add-appointment-empty"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agendar Serviço
              </Button>
          </div>
        )}
      </div>

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Gerar Agendamentos</DialogTitle>
          </DialogHeader>

          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium">Mês</label>
              <Select
                value={previewMonth.toString()}
                onValueChange={(v) => setPreviewMonth(Number(v))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"].map((m, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-24 space-y-1.5">
              <label className="text-sm font-medium">Ano</label>
              <Select
                value={previewYear.toString()}
                onValueChange={(v) => setPreviewYear(Number(v))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[new Date().getFullYear(), new Date().getFullYear() + 1].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => generatePreviewMutation.mutate({ year: previewYear, month: previewMonth })}
              disabled={generatePreviewMutation.isPending}
              className="shrink-0"
              data-testid="button-preview-generate"
            >
              {generatePreviewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pré-visualizar"}
            </Button>
          </div>

          {previewList.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground mt-1">
                {previewList.length - removedIndexes.size} agendamento(s) para criar.
                Clica em <Trash2 className="w-3 h-3 inline" /> para remover um agendamento da lista.
              </p>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {previewList.map((appt, idx) => {
                  const removed = removedIndexes.has(idx);
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-opacity ${
                        removed ? "opacity-30 line-through" : ""
                      } ${
                        appt.type === "Garden" ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950" :
                        appt.type === "Pool" ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950" :
                        "border-cyan-200 bg-cyan-50 dark:border-cyan-800 dark:bg-cyan-950"
                      }`}
                      data-testid={`preview-appointment-${idx}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{appt.clientName}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(appt.date), "d 'de' MMMM 'às' HH:mm", { locale: pt })} — {
                            appt.type === 'Garden' ? 'Jardim' :
                            appt.type === 'Pool' ? 'Piscina' : 'Jacuzzi'
                          }
                        </p>
                        <p className="text-xs text-muted-foreground/70 truncate">{appt.reason}</p>
                      </div>
                      <button
                        onClick={() => {
                          const next = new Set(removedIndexes);
                          next.has(idx) ? next.delete(idx) : next.add(idx);
                          setRemovedIndexes(next);
                        }}
                        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        data-testid={`button-remove-preview-${idx}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <Button
                className="w-full gap-2 mt-2"
                disabled={confirmGenerateMutation.isPending || previewList.length === removedIndexes.size}
                onClick={() => {
                  const toCreate = previewList.filter((_, i) => !removedIndexes.has(i));
                  confirmGenerateMutation.mutate(toCreate);
                }}
                data-testid="button-confirm-generate"
              >
                {confirmGenerateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCheck className="w-4 h-4" />
                )}
                Confirmar {previewList.length - removedIndexes.size} agendamento(s)
              </Button>
            </>
          )}

          {previewList.length === 0 && !generatePreviewMutation.isPending && generatePreviewMutation.isSuccess && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Todos os clientes já têm agendamentos para este mês.
            </p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {renderFormFields()}

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => {
                  const selectedDate = field.value ? new Date(field.value) : null;
                  const sameDayAppointments = selectedDate && !isNaN(selectedDate.getTime())
                    ? (appointments?.filter(apt => isSameDay(new Date(apt.date), selectedDate)) ?? [])
                    : [];
                  const overlappingAppointments = selectedDate && !isNaN(selectedDate.getTime())
                    ? sameDayAppointments.filter(apt => new Date(apt.date).getHours() === selectedDate.getHours())
                    : [];
                  const occupiedHours = new Set(sameDayAppointments.map(apt => new Date(apt.date).getHours()));
                  const pivotHour = selectedDate ? selectedDate.getHours() : 9;
                  const suggestedFreeHours = overlappingAppointments.length > 0 && selectedDate
                    ? suggestSameDayHours(selectedDate, occupiedHours, pivotHour, workingHourSlots)
                    : [];
                  const suggestedNextDaySlots = overlappingAppointments.length > 0 && suggestedFreeHours.length === 0 && selectedDate
                    ? suggestNextDaySlots(selectedDate, (appointments ?? []).map(apt => new Date(apt.date)), { workingHours: workingHourSlots })
                    : [];

                  return (
                    <FormItem>
                      <FormLabel>Data e Hora</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          className="rounded-xl"
                          value={field.value ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm") : ""}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                          data-testid="input-appointment-datetime"
                        />
                      </FormControl>
                      {overlappingAppointments.length > 0 && (
                        <div className="mt-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800" data-testid="alert-overlapping-appointment">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-700 dark:text-yellow-400 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                                {overlappingAppointments.length === 1 ? "Já existe um agendamento nesta hora" : `Já existem ${overlappingAppointments.length} agendamentos nesta hora`}
                              </p>
                              <ul className="mt-1 space-y-0.5">
                                {overlappingAppointments.slice(0, 3).map(apt => (
                                  <li key={apt.id} className="text-xs text-yellow-700 dark:text-yellow-400 truncate">
                                    {format(new Date(apt.date), "HH:mm")} — {apt.client.name}
                                  </li>
                                ))}
                                {overlappingAppointments.length > 3 && <li className="text-xs text-yellow-700 dark:text-yellow-400">+{overlappingAppointments.length - 3} mais...</li>}
                              </ul>
                              {suggestedFreeHours.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-yellow-200 dark:border-yellow-800">
                                  <p className="text-xs text-yellow-800 dark:text-yellow-300 mb-1.5">Horas livres neste dia:</p>
                                  <div className="flex flex-wrap gap-1.5" data-testid="suggested-free-hours">
                                    {suggestedFreeHours.map(h => (
                                      <button key={h} type="button" onClick={() => { if (!selectedDate) return; const d = new Date(selectedDate); d.setHours(h,0,0,0); field.onChange(d); }} className="px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-200 text-yellow-900 hover:bg-yellow-300 dark:bg-yellow-900 dark:text-yellow-100 dark:hover:bg-yellow-800 transition-colors" data-testid={`button-suggest-hour-${h}`}>{`${String(h).padStart(2,"0")}:00`}</button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {suggestedFreeHours.length === 0 && suggestedNextDaySlots.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-yellow-200 dark:border-yellow-800">
                                  <p className="text-xs text-yellow-800 dark:text-yellow-300 mb-1.5">Sem horas livres neste dia. Tenta:</p>
                                  <div className="flex flex-wrap gap-1.5" data-testid="suggested-next-day-slots">
                                    {suggestedNextDaySlots.map(slot => {
                                      const dayKey = format(slot.date, "yyyy-MM-dd");
                                      const dayFreeHours = getFreeHoursForDay(slot.date, (appointments ?? []).map(apt => new Date(apt.date)), workingHourSlots);
                                      const otherFreeHours = dayFreeHours.filter(h => h !== slot.date.getHours());
                                      return (
                                        <div key={slot.key} className="inline-flex rounded-md overflow-hidden">
                                          <button type="button" onClick={() => field.onChange(new Date(slot.date))} className="px-2.5 py-1 text-xs font-medium bg-yellow-200 text-yellow-900 hover:bg-yellow-300 dark:bg-yellow-900 dark:text-yellow-100 dark:hover:bg-yellow-800 transition-colors capitalize" data-testid={`button-suggest-next-day-${slot.key}`}>{slot.label}</button>
                                          {otherFreeHours.length > 0 && (
                                            <Popover>
                                              <PopoverTrigger asChild>
                                                <button type="button" aria-label={`Ver mais horas livres em ${slot.label}`} className="px-2 py-1 text-xs font-medium bg-yellow-300 text-yellow-900 hover:bg-yellow-400 dark:bg-yellow-800 dark:text-yellow-100 dark:hover:bg-yellow-700 transition-colors border-l border-yellow-400 dark:border-yellow-700 inline-flex items-center gap-0.5" data-testid={`button-more-hours-${dayKey}`}><span>ver mais (+{otherFreeHours.length})</span><ChevronDown className="w-3 h-3" /></button>
                                              </PopoverTrigger>
                                              <PopoverContent align="start" className="w-auto p-2" data-testid={`popover-more-hours-${dayKey}`}>
                                                <p className="text-xs text-muted-foreground mb-1.5 capitalize">{format(slot.date, "EEEE, d 'de' MMMM", { locale: pt })}</p>
                                                <div className="flex flex-wrap gap-1 max-w-[16rem]">
                                                  {otherFreeHours.map(h => (
                                                    <button key={h} type="button" onClick={() => { const d = new Date(slot.date); d.setHours(h,0,0,0); field.onChange(d); }} className="px-2 py-1 rounded text-xs font-medium bg-muted hover:bg-accent hover-elevate active-elevate-2 transition-colors" data-testid={`button-more-hour-${dayKey}-${h}`}>{`${String(h).padStart(2,"0")}:00`}</button>
                                                  ))}
                                                </div>
                                              </PopoverContent>
                                            </Popover>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Instruções especiais..." className="rounded-xl" {...field} value={field.value || ""} data-testid="textarea-appointment-notes" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full btn-primary" disabled={createApt.isPending || !form.watch("clientId")} data-testid="button-submit-appointment">
                {createApt.isPending ? "A agendar..." : "Agendar"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Appointment Detail / Edit Dialog */}
      <Dialog open={detailOpen} onOpenChange={(open) => { setDetailOpen(open); if (!open) setEditMode(false); }}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editMode ? "Editar Agendamento" : "Agendamento"}</DialogTitle>
          </DialogHeader>

          {!editMode && selectedApt ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={cn("w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 font-bold", zoneGradient(selectedApt.type))}>
                  <span className="text-base leading-none">{format(new Date(selectedApt.date), "HH")}</span>
                  <span className="text-[10px] leading-none mt-0.5">{format(new Date(selectedApt.date), "mm")}</span>
                </div>
                <div>
                  <p className="font-bold text-foreground">{selectedApt.client.name}</p>
                  <p className="text-sm text-muted-foreground">{format(new Date(selectedApt.date), "d 'de' MMMM yyyy, HH:mm", { locale: pt })}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={cn("badge-pill", zoneColor(selectedApt.type))}>{zoneLabel(selectedApt.type)}</span>
                {(selectedApt as any).serviceType && (
                  <span className="badge-pill bg-primary/10 text-primary">{(selectedApt as any).serviceType}</span>
                )}
                {selectedApt.isCompleted && (
                  <span className="badge-pill bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3" /> Feito</span>
                )}
              </div>

              {selectedApt.notes && (
                <div className="rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">{selectedApt.notes}</div>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => navigate(`/expense-notes/new?clientId=${selectedApt.clientId}`)}
                >
                  <FileText className="w-4 h-4 mr-2" /> Nota de Despesa
                </Button>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" variant="outline" onClick={handleEditMode}>
                  <Pencil className="w-4 h-4 mr-2" /> Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="flex-1">
                      <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminar agendamento?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. O agendamento de {selectedApt.client.name} será removido.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ) : editMode ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {renderFormFields()}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data e Hora</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" className="rounded-xl" value={field.value ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm") : ""} onChange={(e) => field.onChange(new Date(e.target.value))} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Instruções especiais..." className="rounded-xl" {...field} value={field.value || ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setEditMode(false)}>Cancelar</Button>
                  <Button type="submit" className="flex-1 btn-primary" disabled={updateApt.isPending}>
                    {updateApt.isPending ? "A guardar..." : "Guardar"}
                  </Button>
                </div>
              </form>
            </Form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={showQuickAdd} onOpenChange={setShowQuickAdd}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          <QuickAddForm
            onSuccess={(client) => {
              form.setValue("clientId", client.id);
              setShowQuickAdd(false);
            }}
            onCancel={() => setShowQuickAdd(false)}
          />
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
