import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Plus, Users, Phone, Mail, Euro, Loader2, ChevronRight, 
  UserX, UserCheck, Edit2, Trash2, User, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Employee } from "@shared/schema";
import { PhoneInput } from "@/components/PhoneInput";
import { PageHeader } from "@/components/PageHeader";

const employeeFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  hourlyPayRate: z.coerce.number().positive("Valor/hora pago é obrigatório"),
  hourlyChargeRate: z.coerce.number().positive("Valor/hora cobrado é obrigatório"),
  notes: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

export default function EmployeesPage() {
  const [showInactive, setShowInactive] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ['/api/employees', showInactive ? 'all' : 'active'],
    queryFn: () => fetch(`/api/employees${showInactive ? '?includeInactive=true' : ''}`).then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: EmployeeFormData) => apiRequest('POST', '/api/employees', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      setIsAddOpen(false);
      toast({ title: "Funcionário adicionado", description: "O funcionário foi criado com sucesso." });
    },
    onError: () => toast({ title: "Erro", description: "Não foi possível criar o funcionário.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EmployeeFormData> }) =>
      apiRequest('PUT', `/api/employees/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      setEditingEmployee(null);
      toast({ title: "Funcionário atualizado", description: "Os dados foram guardados." });
    },
    onError: () => toast({ title: "Erro", description: "Não foi possível atualizar.", variant: "destructive" }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: number) => apiRequest('PUT', `/api/employees/${id}/toggle-active`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      const emp = employees?.find(e => e.id === id);
      toast({ 
        title: emp?.isActive ? "Funcionário desativado" : "Funcionário ativado",
        description: emp?.isActive ? "O funcionário foi desativado." : "O funcionário foi reativado."
      });
    },
    onError: () => toast({ title: "Erro", description: "Não foi possível alterar o estado.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      setSelectedEmployee(null);
      toast({ title: "Funcionário eliminado", description: "O funcionário foi removido." });
    },
    onError: () => toast({ title: "Erro", description: "Não foi possível eliminar.", variant: "destructive" }),
  });

  const activeEmployees = employees?.filter(e => e.isActive) || [];
  const avgChargeRate = employees && employees.length > 0
    ? employees.reduce((s, e) => s + e.hourlyChargeRate, 0) / employees.length
    : 0;

  return (
    <div className="min-h-screen bg-background pb-24 page-transition">
      <PageHeader
        title="Funcionários"
        subtitle="Equipa e salários"
        backHref="/more"
        rightSlot={
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm" data-testid="button-add-employee" aria-label="Adicionar funcionário">
                <Plus className="w-5 h-5 text-white" aria-hidden="true" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Funcionário</DialogTitle>
              </DialogHeader>
              <EmployeeForm 
                onSubmit={(data) => createMutation.mutate(data)} 
                isPending={createMutation.isPending} 
              />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="px-5 py-4">
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-card rounded-xl border border-border/40 shadow-sm shadow-black/5 p-3">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-bold text-foreground mt-1">{employees?.length || 0}</p>
          </div>
          <div className="bg-card rounded-xl border border-border/40 shadow-sm shadow-black/5 p-3">
            <p className="text-xs text-muted-foreground">Ativos</p>
            <p className="text-xl font-bold text-primary mt-1">{activeEmployees.length}</p>
          </div>
          <div className="bg-card rounded-xl border border-border/40 shadow-sm shadow-black/5 p-3">
            <p className="text-xs text-muted-foreground">Méd. €/h</p>
            <p className="text-xl font-bold text-foreground mt-1">{avgChargeRate.toFixed(1)}€</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">
            {employees?.length || 0} funcionário{employees?.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <Label htmlFor="show-inactive" className="text-sm text-muted-foreground">Mostrar inativos</Label>
            <Switch 
              id="show-inactive" 
              checked={showInactive} 
              onCheckedChange={setShowInactive}
              data-testid="switch-show-inactive"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : employees && employees.length > 0 ? (
          <div className="space-y-3">
            {employees.map((employee, index) => (
              <div
                key={employee.id}
                className={cn(
                  "mobile-card flex items-center gap-4 cursor-pointer",
                  !employee.isActive && "opacity-60"
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => setSelectedEmployee(employee)}
                data-testid={`employee-card-${employee.id}`}
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg",
                  employee.isActive 
                    ? "bg-gradient-to-br from-primary/20 to-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}>
                  {employee.name.charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground truncate">{employee.name}</h3>
                    {!employee.isActive && (
                      <span className="badge-pill bg-muted text-muted-foreground text-[10px]">Inativo</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Euro className="w-3.5 h-3.5" />
                      {employee.hourlyChargeRate.toFixed(2)}€/h
                    </span>
                    {employee.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {employee.phone}
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
              <Users className="w-7 h-7 text-primary/60" />
            </div>
            <h3 className="font-semibold text-foreground">Sem funcionários</h3>
            <p className="text-sm text-muted-foreground mt-1">Adicione o primeiro funcionário da equipa</p>
          </div>
        )}
      </div>

      <Dialog open={!!editingEmployee} onOpenChange={(open) => !open && setEditingEmployee(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Funcionário</DialogTitle>
          </DialogHeader>
          {editingEmployee && (
            <EmployeeForm 
              defaultValues={{
                name: editingEmployee.name,
                phone: editingEmployee.phone || "",
                email: editingEmployee.email || "",
                hourlyPayRate: editingEmployee.hourlyPayRate,
                hourlyChargeRate: editingEmployee.hourlyChargeRate,
                notes: editingEmployee.notes || "",
              }}
              onSubmit={(data) => updateMutation.mutate({ id: editingEmployee.id, data })}
              isPending={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedEmployee} onOpenChange={(open) => !open && setSelectedEmployee(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {selectedEmployee?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-muted/30">
                  <p className="text-xs text-muted-foreground">Valor/hora (pago)</p>
                  <p className="font-bold text-lg">{selectedEmployee.hourlyPayRate.toFixed(2)}€</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30">
                  <p className="text-xs text-muted-foreground">Valor/hora (cobrado)</p>
                  <p className="font-bold text-lg">{selectedEmployee.hourlyChargeRate.toFixed(2)}€</p>
                </div>
              </div>
              
              {selectedEmployee.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedEmployee.phone}</span>
                </div>
              )}
              
              {selectedEmployee.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedEmployee.email}</span>
                </div>
              )}
              
              {selectedEmployee.notes && (
                <div className="p-3 rounded-xl bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Notas</p>
                  <p className="text-sm">{selectedEmployee.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedEmployee(null);
                    setEditingEmployee(selectedEmployee);
                  }}
                  data-testid="button-edit-employee"
                >
                  <Edit2 className="w-4 h-4 mr-2" /> Editar
                </Button>
                <Button
                  variant={selectedEmployee.isActive ? "secondary" : "default"}
                  className="flex-1"
                  onClick={() => {
                    toggleActiveMutation.mutate(selectedEmployee.id);
                    setSelectedEmployee(null);
                  }}
                  disabled={toggleActiveMutation.isPending}
                  data-testid="button-toggle-active"
                >
                  {selectedEmployee.isActive ? (
                    <><UserX className="w-4 h-4 mr-2" /> Desativar</>
                  ) : (
                    <><UserCheck className="w-4 h-4 mr-2" /> Ativar</>
                  )}
                </Button>
              </div>
              
              <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => { if (!open) setDeleteDialogOpen(false); }}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full" data-testid="button-delete-employee" onClick={() => setDeleteDialogOpen(true)}>
                    <Trash2 className="w-4 h-4 mr-2" /> Eliminar Funcionário
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar Funcionário</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem a certeza que quer eliminar {selectedEmployee.name}? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <Button variant="destructive"
                      onClick={async () => {
                        await deleteMutation.mutateAsync(selectedEmployee.id);
                        setDeleteDialogOpen(false);
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Eliminar
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}

function EmployeeForm({ 
  defaultValues, 
  onSubmit, 
  isPending 
}: { 
  defaultValues?: Partial<EmployeeFormData>; 
  onSubmit: (data: EmployeeFormData) => void; 
  isPending: boolean;
}) {
  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      phone: defaultValues?.phone || "",
      email: defaultValues?.email || "",
      hourlyPayRate: defaultValues?.hourlyPayRate || 0,
      hourlyChargeRate: defaultValues?.hourlyChargeRate || 0,
      notes: defaultValues?.notes || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Nome do funcionário" data-testid="input-employee-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="hourlyPayRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor/hora (pago) *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input {...field} type="number" step="0.01" className="pl-9" placeholder="0.00" data-testid="input-hourly-pay-rate" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hourlyChargeRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor/hora (cobrado) *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input {...field} type="number" step="0.01" className="pl-9" placeholder="0.00" data-testid="input-hourly-charge-rate" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <PhoneInput value={field.value} onChange={(v) => field.onChange(v)} data-testid="input-employee-phone" placeholder="Telefone" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input {...field} type="email" className="pl-9" placeholder="Email" data-testid="input-employee-email" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Notas adicionais..." rows={2} data-testid="input-employee-notes" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit-employee">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {defaultValues ? "Guardar Alterações" : "Adicionar Funcionário"}
        </Button>
      </form>
    </Form>
  );
}
