import { format } from "date-fns";
import { AddAppointmentDialog } from "@/components/client-detail/AddAppointmentDialog";
import { CompleteVisitDialog } from "@/components/client-detail/CompleteVisitDialog";
import { useAppointments } from "@/hooks/use-appointments";

interface ClientAgendaTabProps {
  clientId: number;
  estimatedDuration: number;
}

export function ClientAgendaTab({ clientId, estimatedDuration }: ClientAgendaTabProps) {
  const { data: appointments } = useAppointments({ clientId: clientId.toString() });

  return (
    <>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-lg">Agendamentos</h3>
        <AddAppointmentDialog clientId={clientId} />
      </div>

      {appointments?.filter(a => !a.isCompleted).length === 0 ? (
        <p className="text-muted-foreground text-center py-8 text-sm">Sem agendamentos futuros.</p>
      ) : (
        appointments?.filter(a => !a.isCompleted).map((apt) => (
          <div key={apt.id} className="bg-card border border-border/50 rounded-xl p-4 shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 bg-primary/10 rounded-xl flex flex-col items-center justify-center text-primary shrink-0">
              <span className="text-xs font-bold uppercase">{format(new Date(apt.date), "MMM")}</span>
              <span className="text-lg font-bold leading-none">{format(new Date(apt.date), "d")}</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground">Serviço de {apt.type === 'Garden' ? 'Jardim' : apt.type === 'Pool' ? 'Piscina' : apt.type}</h4>
              <p className="text-sm text-muted-foreground">{format(new Date(apt.date), "HH:mm")}</p>
            </div>
            <CompleteVisitDialog
              clientId={clientId}
              appointmentId={apt.id}
              appointmentType={apt.type}
              estimatedDuration={estimatedDuration}
            />
          </div>
        ))
      )}
    </>
  );
}
