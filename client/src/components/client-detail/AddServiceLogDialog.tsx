import { useState, useRef } from "react";
import { useCreateServiceLog } from "@/hooks/use-service-logs";
import { useUpload } from "@/hooks/use-upload";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Calendar, Clock, FolderPlus, Camera, X, Image as ImageIcon, CalendarDays, Euro } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertServiceLogSchema, type Employee } from "@shared/schema";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";

type LaborEntry = { employeeId?: number; workerName: string; hours: number; hourlyRate: number; hourlyPayRate?: number; cost: number };
type MaterialEntry = { materialName: string; quantity: number; unitPrice: number; cost: number };

const serviceLogFormSchema = insertServiceLogSchema.extend({
  type: z.string().min(1, "Tipo obrigatório"),
  description: z.string().min(1, "Descrição obrigatória"),
  billingType: z.enum(["monthly", "extra"]).default("monthly"),
  date: z.union([z.date(), z.string().transform((s) => new Date(s))]),
});

export function AddServiceLogDialog({ clientId }: { clientId: number }) {
  const [open, setOpen] = useState(false);
  const [photosBefore, setPhotosBefore] = useState<string[]>([]);
  const [photosAfter, setPhotosAfter] = useState<string[]>([]);
  const [laborEntries, setLaborEntries] = useState<LaborEntry[]>([]);
  const [materialEntries, setMaterialEntries] = useState<MaterialEntry[]>([]);
  const [isIncludedInMonthly, setIsIncludedInMonthly] = useState(true);
  const [isCustomType, setIsCustomType] = useState(false);
  const [creatingEmployeeForIdx, setCreatingEmployeeForIdx] = useState<number | null>(null);
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpChargeRate, setNewEmpChargeRate] = useState("");
  const [newEmpPayRate, setNewEmpPayRate] = useState("");
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);
  const createLog = useCreateServiceLog();
  const { uploadFile, isUploading } = useUpload();
  const queryClient = useQueryClient();

  const createEmployee = useMutation({
    mutationFn: async (data: { name: string; hourlyChargeRate: number; hourlyPayRate: number }) => {
      const res = await apiRequest("POST", "/api/employees", data);
      return res.json() as Promise<Employee>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
    },
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  const form = useForm<z.infer<typeof serviceLogFormSchema>>({
    resolver: zodResolver(serviceLogFormSchema),
    defaultValues: {
      clientId,
      type: "Garden",
      description: "",
      date: new Date(),
      billingType: "monthly",
    }
  });

  const billingTypeWatch = form.watch("billingType");

  const laborSubtotal = laborEntries.reduce((sum, e) => sum + e.cost, 0);
  const materialsSubtotal = materialEntries.reduce((sum, e) => sum + e.cost, 0);
  const total = laborSubtotal + materialsSubtotal;

  const activeEmployees = employees?.filter(e => e.isActive) || [];

  const addLaborEntry = () => {
    setLaborEntries([...laborEntries, { employeeId: undefined, workerName: "", hours: 0, hourlyRate: 0, hourlyPayRate: 0, cost: 0 }]);
  };

  const selectEmployee = (index: number, employeeId: string) => {
    if (employeeId === "criar_novo") {
      setCreatingEmployeeForIdx(index);
      return;
    }
    const updated = [...laborEntries];
    if (employeeId === "manual") {
      updated[index].employeeId = undefined;
      updated[index].workerName = "";
      updated[index].hourlyRate = 0;
      updated[index].hourlyPayRate = 0;
    } else {
      const emp = employees?.find(e => e.id === parseInt(employeeId));
      if (emp) {
        updated[index].employeeId = emp.id;
        updated[index].workerName = emp.name;
        updated[index].hourlyRate = Number(emp.hourlyChargeRate) || 0;
        updated[index].hourlyPayRate = Number(emp.hourlyPayRate) || 0;
      }
    }
    updated[index].cost = updated[index].hours * updated[index].hourlyRate;
    setLaborEntries(updated);
  };

  const handleCreateEmployee = async (idx: number) => {
    if (!newEmpName.trim()) return;
    try {
      const emp = await createEmployee.mutateAsync({
        name: newEmpName.trim(),
        hourlyChargeRate: parseFloat(newEmpChargeRate) || 0,
        hourlyPayRate: parseFloat(newEmpPayRate) || 0,
      });
      const updated = [...laborEntries];
      updated[idx].employeeId = emp.id;
      updated[idx].workerName = emp.name;
      updated[idx].hourlyRate = Number(emp.hourlyChargeRate) || 0;
      updated[idx].hourlyPayRate = Number(emp.hourlyPayRate) || 0;
      updated[idx].cost = updated[idx].hours * updated[idx].hourlyRate;
      setLaborEntries(updated);
      setCreatingEmployeeForIdx(null);
      setNewEmpName("");
      setNewEmpChargeRate("");
      setNewEmpPayRate("");
    } catch (e) {}
  };

  const updateLaborEntry = (index: number, field: keyof LaborEntry, value: string | number) => {
    const updated = [...laborEntries];
    if (field === "workerName") {
      updated[index].workerName = value as string;
    } else if (field === "employeeId") {
      updated[index].employeeId = value ? Number(value) : undefined;
    } else {
      updated[index][field] = Number(value) || 0;
    }
    updated[index].cost = updated[index].hours * updated[index].hourlyRate;
    setLaborEntries(updated);
  };

  const removeLaborEntry = (index: number) => {
    setLaborEntries(laborEntries.filter((_, i) => i !== index));
  };

  const addMaterialEntry = () => {
    setMaterialEntries([...materialEntries, { materialName: "", quantity: 0, unitPrice: 0, cost: 0 }]);
  };

  const updateMaterialEntry = (index: number, field: keyof MaterialEntry, value: string | number) => {
    const updated = [...materialEntries];
    if (field === "materialName") {
      updated[index].materialName = value as string;
    } else {
      updated[index][field] = Number(value) || 0;
    }
    updated[index].cost = updated[index].quantity * updated[index].unitPrice;
    setMaterialEntries(updated);
  };

  const removeMaterialEntry = (index: number) => {
    setMaterialEntries(materialEntries.filter((_, i) => i !== index));
  };

  const handlePhotoUpload = async (file: File, type: "before" | "after") => {
    const result = await uploadFile(file);
    if (result) {
      if (type === "before") {
        setPhotosBefore(prev => [...prev, result.objectPath]);
      } else {
        setPhotosAfter(prev => [...prev, result.objectPath]);
      }
    }
  };

  const onSubmit = async (values: z.infer<typeof serviceLogFormSchema>) => {
    try {
      const included = values.billingType === "monthly" ? isIncludedInMonthly : false;
      await createLog.mutateAsync({
        ...values,
        isIncludedInMonthly: included,
        photosBefore,
        photosAfter,
        laborEntries: laborEntries.filter(e => e.workerName && e.hours > 0),
        materialEntries: materialEntries.filter(e => e.materialName && e.quantity > 0),
      });
      setOpen(false);
      form.reset();
      setPhotosBefore([]);
      setPhotosAfter([]);
      setLaborEntries([]);
      setMaterialEntries([]);
      setIsIncludedInMonthly(true);
      setIsCustomType(false);
      setCreatingEmployeeForIdx(null);
      setNewEmpName("");
      setNewEmpChargeRate("");
      setNewEmpPayRate("");
    } catch (e) {}
  };

  const removePhoto = (type: "before" | "after", index: number) => {
    if (type === "before") {
      setPhotosBefore(prev => prev.filter((_, i) => i !== index));
    } else {
      setPhotosAfter(prev => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1 rounded-lg" data-testid="button-add-service-log">
          <Plus className="w-3 h-3" /> Registar Trabalho
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registar Serviço</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data do Serviço</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      className="rounded-xl"
                      value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""}
                      onChange={(e) => field.onChange(new Date(e.target.value + "T12:00:00"))}
                      data-testid="input-service-date"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Serviço</FormLabel>
                  <Select
                    value={isCustomType ? "outro" : field.value}
                    onValueChange={(val) => {
                      if (val === "outro") {
                        setIsCustomType(true);
                        field.onChange("");
                      } else {
                        setIsCustomType(false);
                        field.onChange(val);
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="rounded-xl" data-testid="select-service-type">
                        <SelectValue placeholder="Selecione o tipo">
                          {isCustomType && field.value ? field.value : undefined}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Garden">Jardim</SelectItem>
                      <SelectItem value="Pool">Piscina</SelectItem>
                      <SelectItem value="Jacuzzi">Jacuzzi</SelectItem>
                      <SelectItem value="General">Geral</SelectItem>
                      <SelectItem value="outro">+ Outro tipo...</SelectItem>
                    </SelectContent>
                  </Select>
                  {isCustomType && (
                    <Input
                      placeholder="Escreva o tipo de serviço..."
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="mt-2 rounded-xl"
                      autoFocus
                    />
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn("w-full rounded-xl justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {field.value ? format(new Date(field.value), "dd/MM/yyyy", { locale: pt }) : "Selecionar data"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarPicker
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date ?? new Date())}
                        locale={pt}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                    <Textarea
                      placeholder="O que fez hoje?"
                      className="rounded-xl"
                      data-testid="input-service-description"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billingType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de Faturação</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid grid-cols-2 gap-3"
                    >
                      <div className={`flex items-center space-x-2 rounded-xl border p-3 cursor-pointer transition-colors ${field.value === 'monthly' ? 'border-primary bg-primary/5' : 'bg-background/50'}`}>
                        <RadioGroupItem value="monthly" id="billing-monthly" />
                        <Label htmlFor="billing-monthly" className="flex items-center gap-2 cursor-pointer">
                          <Calendar className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">Mensal</span>
                        </Label>
                      </div>
                      <div className={`flex items-center space-x-2 rounded-xl border p-3 cursor-pointer transition-colors ${field.value === 'extra' ? 'border-primary bg-primary/5' : 'bg-background/50'}`}>
                        <RadioGroupItem value="extra" id="billing-extra" />
                        <Label htmlFor="billing-extra" className="flex items-center gap-2 cursor-pointer">
                          <Euro className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">Extra</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />

            {billingTypeWatch === "monthly" && (
              <div className="flex items-start gap-3 p-3 rounded-xl border bg-green-50/50 border-green-200">
                <Checkbox
                  id="includedInMonthly"
                  checked={isIncludedInMonthly}
                  onCheckedChange={(v) => setIsIncludedInMonthly(v === true)}
                  className="mt-0.5"
                />
                <div>
                  <Label htmlFor="includedInMonthly" className="text-sm font-medium text-green-800 cursor-pointer">
                    Incluído no valor da mensalidade
                  </Label>
                  <p className="text-xs text-green-700 mt-0.5">
                    {isIncludedInMonthly
                      ? "Horas e valores são opcionais — ficam apenas para registo interno."
                      : "As horas e valores serão contabilizados para este cliente."}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3 p-3 rounded-xl border bg-blue-50/50">
              <div className="flex items-center justify-between">
                <FormLabel className="flex items-center gap-2 text-blue-700">
                  <Clock className="w-4 h-4" />
                  Mão de Obra
                  {billingTypeWatch === "monthly" && isIncludedInMonthly && (
                    <span className="text-[10px] font-normal text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">apenas registo</span>
                  )}
                </FormLabel>
                <Button type="button" size="sm" variant="outline" onClick={addLaborEntry} className="h-7 text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Adicionar
                </Button>
              </div>
              {laborEntries.length > 0 && (
                <div className="space-y-3">
                  {laborEntries.map((entry, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-white/50 border space-y-2">
                      <div className="flex items-center gap-2">
                        <Select
                          value={entry.employeeId?.toString() || "manual"}
                          onValueChange={(val) => selectEmployee(idx, val)}
                        >
                          <SelectTrigger className="flex-1 h-8 text-xs rounded-lg" data-testid={`select-employee-${idx}`}>
                            <SelectValue placeholder="Selecionar trabalhador" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">Outro (escrever nome)</SelectItem>
                            {activeEmployees.map((emp) => (
                              <SelectItem key={emp.id} value={emp.id.toString()}>
                                {emp.name} ({Number(emp.hourlyChargeRate).toFixed(0)}€/h)
                              </SelectItem>
                            ))}
                            <SelectItem value="criar_novo">+ Criar funcionário...</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeLaborEntry(idx)} className="h-6 w-6 shrink-0">
                          <X className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                      {creatingEmployeeForIdx === idx && (
                        <div className="p-2 rounded-lg bg-green-50 border border-green-200 space-y-2">
                          <p className="text-xs font-medium text-green-700">Novo Funcionário</p>
                          <Input
                            placeholder="Nome *"
                            value={newEmpName}
                            onChange={(e) => setNewEmpName(e.target.value)}
                            className="h-8 text-xs rounded-lg"
                            autoFocus
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-muted-foreground">€/hora cobrado</label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={newEmpChargeRate}
                                onChange={(e) => setNewEmpChargeRate(e.target.value)}
                                className="h-8 text-xs rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground">€/hora pago</label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={newEmpPayRate}
                                onChange={(e) => setNewEmpPayRate(e.target.value)}
                                className="h-8 text-xs rounded-lg"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              className="h-7 text-xs flex-1"
                              onClick={() => handleCreateEmployee(idx)}
                              disabled={!newEmpName.trim() || createEmployee.isPending}
                            >
                              {createEmployee.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Criar e Selecionar"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => setCreatingEmployeeForIdx(null)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                      {!entry.employeeId && creatingEmployeeForIdx !== idx && (
                        <Input
                          placeholder="Nome do trabalhador"
                          value={entry.workerName}
                          onChange={(e) => updateLaborEntry(idx, "workerName", e.target.value)}
                          className="h-8 text-xs rounded-lg"
                          data-testid={`input-worker-name-${idx}`}
                        />
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-muted-foreground">Horas</label>
                          <Input
                            type="number"
                            step="0.5"
                            placeholder="0"
                            value={entry.hours || ""}
                            onChange={(e) => updateLaborEntry(idx, "hours", e.target.value)}
                            className="h-8 text-xs rounded-lg"
                            data-testid={`input-hours-${idx}`}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">€/hora</label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={entry.hourlyRate || ""}
                            onChange={(e) => updateLaborEntry(idx, "hourlyRate", e.target.value)}
                            className="h-8 text-xs rounded-lg"
                            data-testid={`input-rate-${idx}`}
                            disabled={!!entry.employeeId}
                          />
                        </div>
                        <div className="flex flex-col justify-end">
                          <label className="text-[10px] text-muted-foreground">Total</label>
                          <div className="h-8 flex items-center justify-end text-sm font-semibold text-blue-700">
                            {entry.cost.toFixed(2)}€
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="text-right text-sm font-bold text-blue-700 pt-1 border-t">
                    Subtotal: {laborSubtotal.toFixed(2)}€
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 p-3 rounded-xl border bg-muted/30">
              <div className="flex items-center justify-between">
                <FormLabel className="flex items-center gap-2 text-muted-foreground">
                  <FolderPlus className="w-4 h-4" />
                  Materiais
                  {billingTypeWatch === "monthly" && isIncludedInMonthly && (
                    <span className="text-[10px] font-normal text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">apenas registo</span>
                  )}
                </FormLabel>
                <Button type="button" size="sm" variant="outline" onClick={addMaterialEntry} className="h-7 text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Adicionar
                </Button>
              </div>
              {materialEntries.length > 0 && (
                <div className="space-y-2">
                  {materialEntries.map((entry, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-1 items-center">
                      <Input
                        placeholder="Material"
                        value={entry.materialName}
                        onChange={(e) => updateMaterialEntry(idx, "materialName", e.target.value)}
                        className="col-span-4 h-8 text-xs rounded-lg"
                      />
                      <Input
                        type="number"
                        placeholder="Qtd"
                        value={entry.quantity || ""}
                        onChange={(e) => updateMaterialEntry(idx, "quantity", e.target.value)}
                        className="col-span-2 h-8 text-xs rounded-lg"
                      />
                      <Input
                        type="number"
                        placeholder="€/un"
                        value={entry.unitPrice || ""}
                        onChange={(e) => updateMaterialEntry(idx, "unitPrice", e.target.value)}
                        className="col-span-2 h-8 text-xs rounded-lg"
                      />
                      <div className="col-span-3 text-xs font-medium text-right">
                        {entry.cost.toFixed(2)}€
                      </div>
                      <Button type="button" size="icon" variant="ghost" onClick={() => removeMaterialEntry(idx)} className="col-span-1 h-6 w-6">
                        <X className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  <div className="text-right text-sm font-bold text-foreground pt-1 border-t">
                    Subtotal: {materialsSubtotal.toFixed(2)}€
                  </div>
                </div>
              )}
            </div>

            {(laborEntries.length > 0 || materialEntries.length > 0) && (
              <div className={`p-3 rounded-xl border ${billingTypeWatch === "monthly" && isIncludedInMonthly ? "bg-green-50 border-green-200" : "bg-primary/10 border-primary/20"}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <span className={`font-bold ${billingTypeWatch === "monthly" && isIncludedInMonthly ? "text-green-700" : "text-primary"}`}>TOTAL</span>
                    {billingTypeWatch === "monthly" && isIncludedInMonthly && (
                      <p className="text-[10px] text-green-600 mt-0.5">apenas registo — não contabilizado</p>
                    )}
                  </div>
                  <span className={`text-lg font-bold ${billingTypeWatch === "monthly" && isIncludedInMonthly ? "text-green-700" : "text-primary"}`}>{total.toFixed(2)}€</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <FormLabel>Fotos Antes</FormLabel>
              <div className="flex flex-wrap gap-2">
                {photosBefore.map((path, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    <button
                      type="button"
                      onClick={() => removePhoto("before", idx)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                      data-testid={`button-remove-before-photo-${idx}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => beforeInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-16 h-16 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary transition-colors disabled:opacity-50"
                  data-testid="button-upload-before-photo"
                >
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5 text-muted-foreground" />}
                </button>
                <input
                  ref={beforeInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0], "before")}
                />
              </div>
            </div>

            <div className="space-y-3">
              <FormLabel>Fotos Depois</FormLabel>
              <div className="flex flex-wrap gap-2">
                {photosAfter.map((path, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    <button
                      type="button"
                      onClick={() => removePhoto("after", idx)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                      data-testid={`button-remove-after-photo-${idx}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => afterInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-16 h-16 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary transition-colors disabled:opacity-50"
                  data-testid="button-upload-after-photo"
                >
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5 text-muted-foreground" />}
                </button>
                <input
                  ref={afterInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0], "after")}
                />
              </div>
            </div>

            <Button type="submit" className="w-full btn-primary" disabled={createLog.isPending || isUploading}>
              {createLog.isPending ? "A guardar..." : "Guardar Registo"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
