import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Clock } from "lucide-react";

interface DurationInputProps {
  value: number; // Total minutes
  onChange: (minutes: number) => void;
  className?: string;
  "data-testid"?: string;
}

export function DurationInput({ value, onChange, className, "data-testid": testId }: DurationInputProps) {
  const [hours, setHours] = useState(Math.floor(value / 60));
  const [minutes, setMinutes] = useState(value % 60);

  useEffect(() => {
    setHours(Math.floor(value / 60));
    setMinutes(value % 60);
  }, [value]);

  const handleHoursChange = (newHours: number) => {
    const validHours = Math.max(0, Math.min(23, newHours || 0));
    setHours(validHours);
    onChange(validHours * 60 + minutes);
  };

  const handleMinutesChange = (newMinutes: number) => {
    const validMinutes = Math.max(0, Math.min(59, newMinutes || 0));
    setMinutes(validMinutes);
    onChange(hours * 60 + validMinutes);
  };

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          max={23}
          value={hours}
          onChange={(e) => handleHoursChange(parseInt(e.target.value))}
          className="w-16 rounded-xl text-center"
          data-testid={testId ? `${testId}-hours` : undefined}
        />
        <span className="text-sm font-medium text-muted-foreground">h</span>
      </div>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          max={59}
          step={5}
          value={minutes}
          onChange={(e) => handleMinutesChange(parseInt(e.target.value))}
          className="w-16 rounded-xl text-center"
          data-testid={testId ? `${testId}-minutes` : undefined}
        />
        <span className="text-sm font-medium text-muted-foreground">min</span>
      </div>
    </div>
  );
}
