import { useState } from "react";
import { Link, useLocation } from "wouter";
import { CalendarPlus, FileText, Plus, Receipt, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const quickActions = [
  {
    href: "/calendar",
    label: "Nova visita",
    desc: "Agendar trabalho",
    Icon: CalendarPlus,
    iconBg: "bg-primary/10 text-primary",
  },
  {
    href: "/clients",
    label: "Novo cliente",
    desc: "Criar ou procurar cliente",
    Icon: UserPlus,
    iconBg: "bg-accent/10 text-accent",
  },
  {
    href: "/expense-notes/new",
    label: "Nota de despesa",
    desc: "Registar serviço/despesa",
    Icon: Receipt,
    iconBg: "bg-teal-100/70 text-teal-700",
  },
  {
    href: "/quotes/new",
    label: "Novo orçamento",
    desc: "Criar proposta",
    Icon: FileText,
    iconBg: "bg-indigo-100/70 text-indigo-700",
  },
];

const HIDDEN_ROUTES = [
  "/",
  "/clients",
  "/reminders",
  "/quotes/new",
  "/expense-notes/new",
  "/profile",
];

function shouldHideQuickCreate(location: string) {
  if (HIDDEN_ROUTES.includes(location)) return true;
  if (/^\/quotes\/[^/]+$/.test(location)) return true;
  if (/^\/expense-notes\/[^/]+$/.test(location)) return true;
  if (/^\/clients\/[^/]+$/.test(location)) return true;
  return false;
}

export function QuickCreateButton() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();

  if (shouldHideQuickCreate(location)) {
    return null;
  }

  return (
    <div className="fixed bottom-[88px] right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[-1] bg-black/10"
            aria-label="Fechar ações rápidas"
            onClick={() => setOpen(false)}
          />

          <div
            id="quick-create-menu"
            role="menu"
            className="w-[min(320px,calc(100vw-32px))] rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur space-y-2"
          >
            <div className="px-2 pb-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Criar rápido</p>
              <h2 className="text-base font-extrabold text-slate-900">O que quer adicionar?</h2>
            </div>
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="block"
                role="menuitem"
                onClick={() => setOpen(false)}
                data-testid={`quick-create-${action.href.slice(1).replace(/\//g, "-")}`}
              >
                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 active:scale-[0.99] transition-transform">
                  <div className={cn("w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center", action.iconBg)}>
                    <action.Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">{action.label}</p>
                    <p className="text-xs text-slate-500">{action.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className={cn(
              "h-14 w-14 rounded-full bg-primary text-white shadow-xl shadow-primary/30 flex items-center justify-center active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
              open && "rotate-45"
            )}
            aria-label={open ? "Fechar ações rápidas" : "Abrir ações rápidas"}
            aria-expanded={open}
            aria-haspopup="true"
            aria-controls="quick-create-menu"
            data-testid="button-quick-create"
          >
            {open ? <X className="w-6 h-6" aria-hidden="true" /> : <Plus className="w-6 h-6" aria-hidden="true" />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={12} className="bg-slate-900 text-white border-slate-900 font-bold">
          Criar rápido
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
