import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList, ChevronRight, AlertTriangle, ChevronUp, Leaf, Waves,
  ThermometerSun, Wrench, Check, Trash2, Loader2
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { PageHeader } from "@/components/PageHeader";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { usePendingTasks, useCompletePendingTask, useDeletePendingTask } from "@/hooks/use-pending-tasks";

export default function PendingTasks() {
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

  const { data: pendingTasks, isLoading } = usePendingTasks();
  const completePendingTask = useCompletePendingTask();
  const deletePendingTask = useDeletePendingTask();

  const priorityLabels = { low: "Baixa", normal: "Normal", high: "Alta", urgent: "Urgente" };
  const priorityColors = {
    low: "bg-muted text-muted-foreground",
    normal: "bg-primary/10 text-primary",
    high: "bg-destructive/10 text-destructive",
    urgent: "bg-destructive/20 text-destructive",
  };

  const filteredTasks = pendingTasks?.filter(task => {
    if (priorityFilter && task.priority !== priorityFilter) return false;
    return true;
  }) || [];

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
  });

  const urgentCount = pendingTasks?.filter(t => t.priority === "urgent").length || 0;
  const highCount = pendingTasks?.filter(t => t.priority === "high").length || 0;

  return (
    <div className="min-h-screen bg-background pb-24 page-transition">
      <PageHeader
        title="Tarefas Pendentes"
        subtitle={`${pendingTasks?.length || 0} tarefa${pendingTasks?.length !== 1 ? "s" : ""} por completar`}
        backHref="/more"
      />

      {!isLoading && (
        <div className="px-5 mt-6 mb-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-red-50/50 border border-red-200/50 rounded-2xl p-4">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700">{urgentCount}</p>
                  <p className="text-xs text-red-600 font-medium">Urgentes</p>
                </div>
              </div>
            </div>
            <div className="bg-orange-50/50 border border-orange-200/50 rounded-2xl p-4">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <ChevronUp className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-700">{highCount}</p>
                  <p className="text-xs text-orange-600 font-medium">Prioritárias</p>
                </div>
              </div>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{pendingTasks?.length || 0}</p>
                  <p className="text-xs text-primary font-medium">Total</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-5 mb-4 flex gap-2 overflow-x-auto pb-2">
        <Button
          size="sm"
          variant={!priorityFilter ? "default" : "outline"}
          onClick={() => setPriorityFilter(null)}
          data-testid="filter-all-priorities"
        >
          Todas
        </Button>
        {Object.entries(priorityLabels).map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={priorityFilter === key ? "default" : "outline"}
            onClick={() => setPriorityFilter(priorityFilter === key ? null : key)}
            data-testid={`filter-priority-${key}`}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="px-5 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : sortedTasks.length > 0 ? (
          sortedTasks.map((task) => {
            const ServiceIcon = task.serviceType === "Jardim" ? Leaf :
                                task.serviceType === "Piscina" ? Waves :
                                task.serviceType === "Jacuzzi" ? ThermometerSun : Wrench;

            return (
              <div key={task.id} className="bg-card border border-border/50 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <Link href={`/clients/${task.clientId}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity" data-testid={`link-task-client-${task.id}`}>
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ServiceIcon className={`w-4 h-4 ${
                        task.serviceType === "Jardim" ? "text-green-600" :
                        task.serviceType === "Piscina" ? "text-blue-600" :
                        task.serviceType === "Jacuzzi" ? "text-muted-foreground" : "text-gray-600"
                      }`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{task.client.name}</p>
                      <p className="text-xs text-muted-foreground">{task.serviceType}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-1" />
                  </Link>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`text-xs ${priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.normal}`}>
                      {task.priority === "urgent" && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {task.priority === "high" && <ChevronUp className="w-3 h-3 mr-1" />}
                      {priorityLabels[task.priority as keyof typeof priorityLabels] || "Normal"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(task.createdAt!), "d MMM", { locale: pt })}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-foreground mb-3">{task.description}</p>

                {task.photos && task.photos.length > 0 && (
                  <div className="flex gap-2 mb-3 overflow-x-auto">
                    {task.photos.map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt={`Foto ${idx + 1}`}
                        className="w-16 h-16 object-cover rounded-lg border flex-shrink-0"
                      />
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" data-testid={`button-delete-task-${task.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Tarefa</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem a certeza que deseja eliminar esta tarefa pendente? Esta ação não pode ser revertida.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deletePendingTask.mutate(task.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" className="gap-1 btn-primary" data-testid={`button-complete-task-${task.id}`}>
                        <Check className="w-4 h-4" />
                        Concluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Concluir Tarefa</AlertDialogTitle>
                        <AlertDialogDescription>
                          Confirma que esta tarefa foi concluída?
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">{task.client.name}</p>
                            <p className="text-sm font-medium text-foreground">{task.description}</p>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => completePendingTask.mutate(task.id)}
                          className="btn-primary"
                        >
                          Confirmar Conclusão
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state bg-card rounded-2xl border border-border/30 py-10">
            <div className="empty-state-icon bg-primary/5">
              <ClipboardList className="w-7 h-7 text-primary/60" />
            </div>
            <h3 className="font-semibold text-foreground">Sem tarefas pendentes</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {priorityFilter ? "Nenhuma tarefa com este filtro" : "Todas as tarefas foram concluídas!"}
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
