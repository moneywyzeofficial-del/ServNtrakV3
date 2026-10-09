import { useState } from "react";
import { useCreateServiceVisit } from "@/hooks/use-service-visits";
import { useUpdateAppointment } from "@/hooks/use-appointments";
import { useClient } from "@/hooks/use-clients";
import { Loader2, Timer, Users, Check, Leaf, Waves, ThermometerSun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";

const completeVisitFormSchema = z.object({
  durationHours: z.number().min(0, "Mínimo 0 horas").max(10, "Máximo 10 horas"),
  durationMinutes: z.number().min(0, "Mínimo 0 minutos").max(59, "Máximo 59 minutos"),
  workerCount: z.number().min(1, "Mínimo 1 trabalhador").max(10, "Máximo 10 trabalhadores"),
  notes: z.string().optional(),
  includeGarden: z.boolean().default(false),
  includePool: z.boolean().default(false),
  includeJacuzzi: z.boolean().default(false),
});

export function CompleteVisitDialog({
  clientId,
  appointmentId,
  appointmentType,
  estimatedDuration
}: {
  clientId: number;
  appointmentId: number;
  appointmentType: string;
  estimatedDuration: number;
}) {
  const [open, setOpen] = useState(false);
  const createServiceVisit = useCreateServiceVisit();
  const updateAppointment = useUpdateAppointment();
  const { data: client } = useClient(clientId);

  const form = useForm<z.infer<typeof completeVisitFormSchema>>({
    resolver: zodResolver(completeVisitFormSchema),
    defaultValues: {
      durationHours: Math.floor(estimatedDuration / 60),
      durationMinutes: estimatedDuration % 60,
      workerCount: 1,
      notes: "",
      includeGarden: appointmentType === "Garden",
      includePool: appointmentType === "Pool",
      includeJacuzzi: appointmentType === "Jacuzzi",
    },
  });

  async function onSubmit(values: z.infer<typeof completeVisitFormSchema>) {
    try {
      const services: { serviceType: string; wasPlanned: boolean }[] = [];
      if (values.includeGarden) services.push({ serviceType: "Garden", wasPlanned: appointmentType === "Garden" });
      if (values.includePool) services.push({ serviceType: "Pool", wasPlanned: appointmentType === "Pool" });
      if (values.includeJacuzzi) services.push({ serviceType: "Jacuzzi", wasPlanned: appointmentType === "Jacuzzi" });

      if (services.length === 0) {
        services.push({ serviceType: appointmentType, wasPlanned: true });
      }

      const totalMinutes = (values.durationHours * 60) + values.durationMinutes;

      await createServiceVisit.mutateAsync({
        visit: {
          clientId,
          visitDate: new Date(),
          actualDurationMinutes: totalMinutes,
          workerCount: values.workerCount,
          notes: values.notes,
        },
        services,
      });

      await updateAppointment.mutateAsync({
        id: appointmentId,
        isCompleted: true,
      });

      setOpen(false);
      form.reset();
    } catch (error) {
      // Error handled by hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="shrink-0" data-testid={`button-complete-visit-${appointmentId}`} aria-label="Concluir visita">
          <Check className="w-5 h-5 text-green-600" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-display text-primary">Confirmar Visita</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Timer className="w-4 h-4" /> Duração Real
              </FormLabel>
              <div className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name="durationHours"
                  render={({ field }) => (
                    <FormControl>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          className="rounded-xl w-16 text-center"
                          data-testid="input-duration-hours"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                        <span className="text-sm font-medium">h</span>
                      </div>
                    </FormControl>
                  )}
                />
                <FormField
                  control={form.control}
                  name="durationMinutes"
                  render={({ field }) => (
                    <FormControl>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          step="5"
                          className="rounded-xl w-16 text-center"
                          data-testid="input-duration-minutes"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                        <span className="text-sm font-medium">min</span>
                      </div>
                    </FormControl>
                  )}
                />
              </div>
            </FormItem>

            <FormField
              control={form.control}
              name="workerCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="w-4 h-4" /> Nº de Trabalhadores
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      className="rounded-xl w-24"
                      data-testid="input-worker-count"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Serviços Realizados</FormLabel>
              <div className="flex flex-wrap gap-3">
                {client?.hasGarden && (
                  <FormField
                    control={form.control}
                    name="includeGarden"
                    render={({ field }) => (
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-colors ${field.value ? 'bg-green-50 border-green-300' : 'bg-background'}`}>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-include-garden"
                        />
                        <Leaf className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Jardim</span>
                      </label>
                    )}
                  />
                )}
                {client?.hasPool && (
                  <FormField
                    control={form.control}
                    name="includePool"
                    render={({ field }) => (
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-colors ${field.value ? 'bg-blue-50 border-blue-300' : 'bg-background'}`}>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-include-pool"
                        />
                        <Waves className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">Piscina</span>
                      </label>
                    )}
                  />
                )}
                {client?.hasJacuzzi && (
                  <FormField
                    control={form.control}
                    name="includeJacuzzi"
                    render={({ field }) => (
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-colors ${field.value ? 'bg-muted/30 border-border' : 'bg-background'}`}>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-include-jacuzzi"
                        />
                        <ThermometerSun className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Jacuzzi</span>
                      </label>
                    )}
                  />
                )}
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações sobre a visita..."
                      className="rounded-xl resize-none"
                      data-testid="input-visit-notes"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full btn-primary"
              disabled={createServiceVisit.isPending}
              data-testid="button-submit-visit"
            >
              {createServiceVisit.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  A registar...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar Visita
                </>
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
