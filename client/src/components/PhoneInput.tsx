import { useState, useEffect } from "react";
import { Phone, Contact } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  "data-testid"?: string;
}

function checkApiAvailability(): boolean {
  try {
    const api = (navigator as any).contacts;
    return !!api && typeof api.select === "function";
  } catch {
    return false;
  }
}

export function PhoneInput({
  value,
  onChange,
  placeholder = "Número de telefone",
  className,
  disabled,
  "data-testid": testId,
}: PhoneInputProps) {
  const [canImport, setCanImport] = useState(false);

  useEffect(() => {
    setCanImport(checkApiAvailability());
  }, []);

  const handleImportContact = async () => {
    try {
      const api = (navigator as any).contacts;
      const contacts = await api.select(["tel"], { multiple: false });
      if (contacts?.length > 0 && contacts[0]?.tel?.length > 0) {
        onChange(contacts[0].tel[0]);
      }
    } catch {
      // User cancelled the picker
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <Input
          type="tel"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn("pl-9", className)}
          disabled={disabled}
          data-testid={testId}
        />
      </div>
      {canImport && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 h-10 w-10 rounded-xl"
          onClick={handleImportContact}
          disabled={disabled}
          aria-label="Importar da lista telefónica"
          title="Importar contacto"
        >
          <Contact className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
