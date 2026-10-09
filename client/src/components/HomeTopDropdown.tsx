import { useState } from "react";
import { Link } from "wouter";
import {
  Bell,
  CalendarPlus,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileText,
  Map,
  MoreHorizontal,
  Search,
  TrendingUp,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DropdownItem = {
  href: string;
  label: string;
  desc: string;
  Icon: LucideIcon;
  iconBg: string;
};

type DropdownGroup = {
  title: string;
  items: DropdownItem[];
};

const groups: DropdownGroup[] = [
  {
    title: "Criar rápido",
    items: [
      { href: "/calendar", label: "Nova visita", desc: "Agendar trabalho", Icon: CalendarPlus, iconBg: "bg-primary/10 text-primary" },
      { href: "/clients", label: "Novo cliente", desc: "Adicionar ou procurar", Icon: UserPlus, iconBg: "bg-accent/10 text-accent" },
      { href: "/quotes/new", label: "Novo orçamento", desc: "Criar proposta", Icon: FileText, iconBg: "bg-indigo-100/70 text-indigo-700" },
    ],
  },
  {
    title: "Trabalho",
    items: [
      { href: "/pending-tasks", label: "Tarefas", desc: "Pendentes", Icon: ClipboardList, iconBg: "bg-primary/10 text-primary" },
      { href: "/reminders", label: "Lembretes", desc: "Alertas", Icon: Bell, iconBg: "bg-yellow-100/70 text-yellow-700" },
      { href: "/map", label: "Mapa", desc: "Rotas e clientes", Icon: Map, iconBg: "bg-primary/10 text-primary" },
    ],
  },
  {
    title: "Gestão",
    items: [
      { href: "/billing", label: "Faturação", desc: "Por cobrar", Icon: CreditCard, iconBg: "bg-purple-100/70 text-purple-700" },
      { href: "/finances", label: "Finanças", desc: "Resumo", Icon: TrendingUp, iconBg: "bg-emerald-100/70 text-emerald-700" },
      { href: "/reports", label: "Relatórios", desc: "Análise", Icon: FileText, iconBg: "bg-slate-100/70 text-slate-600" },
    ],
  },
];

function itemTestId(label: string) {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

export function HomeTopDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative z-30 mb-4" data-testid="home-top-dropdown">
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="h-12 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm flex items-center justify-between gap-3 active:scale-[0.99] transition-transform text-left"
          aria-expanded={open}
          data-testid="button-home-tools-dropdown"
        >
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Menu rápido</p>
            <p className="text-sm font-extrabold text-slate-900 truncate">Criar, gerir e abrir ferramentas</p>
          </div>
          <ChevronDown className={cn("w-5 h-5 shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
        </button>

        <Link href="/more" className="h-12 w-12 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-center active:scale-95 transition-transform" data-testid="link-home-more-tools" aria-label="Abrir todas as ferramentas">
          <MoreHorizontal className="w-5 h-5 text-slate-600" aria-hidden="true" />
        </Link>
      </div>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[-1] cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu rápido"
          />

          <div className="absolute left-0 right-0 top-[56px] rounded-3xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur p-3 space-y-4 max-h-[70vh] overflow-y-auto">
            <Link
              href="/more"
              className="flex items-center gap-3 rounded-2xl bg-primary/10 border border-primary/20 p-3 active:scale-[0.99] transition-transform"
              onClick={() => setOpen(false)}
              data-testid="link-home-dropdown-search-all"
            >
              <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0">
                <Search className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-primary">Pesquisar todas as ferramentas</p>
                <p className="text-xs text-primary/75">Abrir página Mais com pesquisa</p>
              </div>
            </Link>

            {groups.map((group) => (
              <section key={group.title} className="space-y-2">
                <h3 className="px-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">{group.title}</h3>
                <div className="grid gap-2">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block"
                      onClick={() => setOpen(false)}
                      data-testid={`link-home-dropdown-${itemTestId(item.label)}`}
                    >
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 active:scale-[0.99] transition-transform">
                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", item.iconBg)}>
                          <item.Icon className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900">{item.label}</p>
                          <p className="text-xs text-slate-500">{item.desc}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full h-10 rounded-2xl bg-slate-100 text-slate-600 text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
              data-testid="button-close-home-dropdown"
            >
              <X className="w-4 h-4" aria-hidden="true" />
              Fechar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
