import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock } from "lucide-react";
import { useWorkingHours } from "@/hooks/use-working-hours";
import { computeWorkingHours, formatHourLabel } from "@/lib/working-hours";

const HOURS_0_TO_23 = Array.from({ length: 24 }, (_, i) => i);
const HOURS_1_TO_24 = Array.from({ length: 24 }, (_, i) => i + 1);

export function WorkingHoursSection() {
  const [settings, setSettings] = useWorkingHours();
  const preview = computeWorkingHours(settings);

  return (
    <Card data-testid="card-working-hours">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" aria-hidden="true" />
          Horário de Trabalho
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Usado para sugerir horas livres ao criar agendamentos na Agenda.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="working-hours-start">Início</Label>
            <Select
              value={String(settings.start)}
              onValueChange={(v) => setSettings({ ...settings, start: Number(v) })}
            >
              <SelectTrigger
                id="working-hours-start"
                className="rounded-xl"
                data-testid="select-working-hours-start"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOURS_0_TO_23.map((h) => (
                  <SelectItem key={h} value={String(h)} data-testid={`option-start-${h}`}>
                    {formatHourLabel(h)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="working-hours-end">Fim</Label>
            <Select
              value={String(settings.end)}
              onValueChange={(v) => setSettings({ ...settings, end: Number(v) })}
            >
              <SelectTrigger
                id="working-hours-end"
                className="rounded-xl"
                data-testid="select-working-hours-end"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOURS_0_TO_23.map((h) => (
                  <SelectItem
                    key={h}
                    value={String(h)}
                    disabled={h < settings.start}
                    data-testid={`option-end-${h}`}
                  >
                    {formatHourLabel(h)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/40">
          <div className="space-y-0.5">
            <Label htmlFor="working-hours-lunch" className="cursor-pointer">
              Excluir pausa de almoço
            </Label>
            <p className="text-xs text-muted-foreground">
              As horas neste intervalo não serão sugeridas.
            </p>
          </div>
          <Switch
            id="working-hours-lunch"
            checked={settings.lunchEnabled}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, lunchEnabled: checked })
            }
            data-testid="switch-working-hours-lunch"
          />
        </div>

        {settings.lunchEnabled && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lunch-start">Pausa início</Label>
              <Select
                value={String(settings.lunchStart)}
                onValueChange={(v) => setSettings({ ...settings, lunchStart: Number(v) })}
              >
                <SelectTrigger
                  id="lunch-start"
                  className="rounded-xl"
                  data-testid="select-lunch-start"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOURS_0_TO_23.map((h) => (
                    <SelectItem
                      key={h}
                      value={String(h)}
                      disabled={h < settings.start || h > settings.end}
                      data-testid={`option-lunch-start-${h}`}
                    >
                      {formatHourLabel(h)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lunch-end">Pausa fim</Label>
              <Select
                value={String(settings.lunchEnd)}
                onValueChange={(v) => setSettings({ ...settings, lunchEnd: Number(v) })}
              >
                <SelectTrigger
                  id="lunch-end"
                  className="rounded-xl"
                  data-testid="select-lunch-end"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOURS_1_TO_24.map((h) => (
                    <SelectItem
                      key={h}
                      value={String(h)}
                      disabled={h <= settings.lunchStart || h > settings.end + 1}
                      data-testid={`option-lunch-end-${h}`}
                    >
                      {formatHourLabel(h)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div
          className="rounded-lg bg-muted/50 p-3 text-xs"
          data-testid="text-working-hours-preview"
        >
          <p className="font-medium text-foreground mb-1">Horas que serão sugeridas</p>
          {preview.length > 0 ? (
            <p className="text-muted-foreground">
              {preview.map(formatHourLabel).join(", ")}
            </p>
          ) : (
            <p className="text-destructive">
              Nenhuma hora disponível com a configuração atual.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
