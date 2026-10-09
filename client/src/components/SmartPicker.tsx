import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface SmartPickerOption {
  label: string
  value: string
}

interface SmartPickerProps {
  options: SmartPickerOption[]
  value: string
  onChange: (value: string) => void
  onAddNew: () => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
}

function OptionList({
  options,
  value,
  onSelect,
  onAddNew,
  searchPlaceholder = "Pesquisar...",
  emptyText = "Sem resultados.",
}: {
  options: SmartPickerOption[]
  value: string
  onSelect: (v: string) => void
  onAddNew: () => void
  searchPlaceholder?: string
  emptyText?: string
}) {
  return (
    <Command>
      <CommandInput placeholder={searchPlaceholder} />
      <CommandList>
        <CommandEmpty>{emptyText}</CommandEmpty>
        <CommandGroup>
          {options.map((opt) => (
            <CommandItem
              key={opt.value}
              value={opt.label}
              onSelect={() => onSelect(opt.value)}
            >
              <Check
                className={cn("mr-2 h-4 w-4", value === opt.value ? "opacity-100" : "opacity-0")}
              />
              {opt.label}
            </CommandItem>
          ))}
          <CommandItem
            onSelect={onAddNew}
            className="text-primary font-medium"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Novo
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

export function SmartPicker({
  options,
  value,
  onChange,
  onAddNew,
  placeholder = "Selecionar...",
  searchPlaceholder,
  emptyText,
  className,
}: SmartPickerProps) {
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()

  const selected = options.find((o) => o.value === value)

  const handleSelect = (v: string) => {
    onChange(v)
    setOpen(false)
  }

  const handleAddNew = () => {
    setOpen(false)
    onAddNew()
  }

  const trigger = (
    <Button
      type="button"
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className={cn("w-full justify-between", className)}
      onClick={() => setOpen((prev) => !prev)}
    >
      {selected ? selected.label : <span className="text-muted-foreground">{placeholder}</span>}
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  )

  if (isMobile) {
    return (
      <>
        {trigger}
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{placeholder}</DrawerTitle>
            </DrawerHeader>
            <div className="p-2 pb-safe">
              <OptionList
                options={options}
                value={value}
                onSelect={handleSelect}
                onAddNew={handleAddNew}
                searchPlaceholder={searchPlaceholder}
                emptyText={emptyText}
              />
            </div>
          </DrawerContent>
        </Drawer>
      </>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <OptionList
          options={options}
          value={value}
          onSelect={handleSelect}
          onAddNew={handleAddNew}
          searchPlaceholder={searchPlaceholder}
          emptyText={emptyText}
        />
      </PopoverContent>
    </Popover>
  )
}
