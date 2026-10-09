import { Link } from "wouter";
import {
  Bell,
  Camera,
  ChevronDown,
  ClipboardList,
  CreditCard,
  Download,
  FileText,
  Map,
  Mic,
  Plus,
  ShoppingBag,
  Tag,
  TrendingUp,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type ActionItem = {
  href?: string;
  onClick?: () => void;
  Icon: LucideIcon;
  label: string;
  desc: string;
  iconBg: string;
};

type ActionGroup = {
  id: string;
  title: string;
  subtitle: string;
  Icon: LucideIcon;
  items: ActionItem[];
};

function actionTestId(label: string) {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

function ActionCard({ action }: { action: ActionItem }) {
  const inner = (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 hover:bg-slate-50 active:scale-[0.99] transition-all">
      <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center shrink-0", action.iconBg)}>
        <action.Icon className="w-5 h-5" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-slate-900 text-[14px]">{action.label}</h4>
        <p className="text-[12px] text-slate-500 leading-snug">{action.desc}</p>
      </div>
    </div>
  );

  if (action.href) {
    return (
      <Link href={action.href} className="block" data-testid={`link-submenu-${action.href.slice(1).replace(/\//g, "-")}`}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="block w-full text-left"
      onClick={action.onClick}
      data-testid={`button-submenu-${actionTestId(action.label)}`}
    >
      {inner}
    </button>
  );
}

function ActionGroupCard({ group, isOpen, onToggle }: { group: ActionGroup; isOpen: boolean; onToggle: () => void }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/70 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-3 text-left active:bg-slate-50 transition-colors"
        aria-expanded={isOpen}
        data-testid={`button-action-group-${group.id}`}
      >
        <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <group.Icon className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-extrabold text-slate-900 text-[15px]">{group.title}</h3>
          <p className="text-[12px] text-slate-500 truncate">{group.subtitle}</p>
        </div>
        <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="px-3 pb-3 space-y-2 bg-slate-50/70 border-t border-slate-100">
          {group.items.map((item) => (
            <ActionCard key={item.href ?? item.label} action={item} />
          ))}
        </div>
      )}
    </section>
  );
}

export function HomeActionMenus({
  onScanInvoice,
  onVoiceReport,
}: {
  onScanInvoice: () => void;
  onVoiceReport: () => void;
}) {
  const [openGroup, setOpenGroup] = useState("work");

  const primaryActions: ActionItem[] = [
    { href: "/calendar", Icon: Plus, label: "Nova visita", desc: "Agendar trabalho", iconBg: "bg-primary text-white" },
    { href: "/clients", Icon: UserPlus, label: "Cliente", desc: "Lista e novo cliente", iconBg: "bg-accent text-white" },
    { onClick: onVoiceReport, Icon: Mic, label: "Voz", desc: "Relatório rápido", iconBg: "bg-green-100/80 text-green-700" },
    { href: "/map", Icon: Map, label: "Mapa", desc: "Rotas e clientes", iconBg: "bg-primary-strong text-white" },
  ];

  const groups: ActionGroup[] = [
    {
      id: "work",
      title: "Agenda & Tarefas",
      subtitle: "visitas, lembretes e trabalhos pendentes",
      Icon: ClipboardList,
      items: [
        { href: "/calendar", Icon: Plus, label: "Agendar visita", desc: "Criar novo trabalho no calendário", iconBg: "bg-primary/10 text-primary" },
        { href: "/pending-tasks", Icon: ClipboardList, label: "Tarefas pendentes", desc: "Ver trabalhos por concluir", iconBg: "bg-primary/10 text-primary" },
        { href: "/reminders", Icon: Bell, label: "Lembretes", desc: "Manutenções e alertas periódicos", iconBg: "bg-yellow-100/70 text-yellow-700" },
      ],
    },
    {
      id: "clients",
      title: "Clientes & Equipa",
      subtitle: "clientes, mapa e funcionários",
      Icon: Users,
      items: [
        { href: "/clients", Icon: Users, label: "Clientes", desc: "Consultar e gerir clientes", iconBg: "bg-accent/10 text-accent" },
        { href: "/map", Icon: Map, label: "Mapa de clientes", desc: "Ver localizações e rotas", iconBg: "bg-primary/10 text-primary" },
        { href: "/employees", Icon: Users, label: "Funcionários", desc: "Gerir equipa e salários", iconBg: "bg-muted text-muted-foreground" },
      ],
    },
    {
      id: "finance",
      title: "Finanças",
      subtitle: "pagamentos, compras, despesas e preços",
      Icon: CreditCard,
      items: [
        { href: "/billing", Icon: CreditCard, label: "Faturação", desc: "Serviços por cobrar", iconBg: "bg-purple-100/70 text-purple-700" },
        { href: "/payments", Icon: CreditCard, label: "Mensalidades", desc: "Pagamentos mensais dos clientes", iconBg: "bg-purple-100/70 text-purple-700" },
        { href: "/purchases", Icon: ShoppingBag, label: "Compras", desc: "Materiais e gastos", iconBg: "bg-green-100/70 text-green-700" },
        { href: "/expense-notes", Icon: FileText, label: "Notas de despesa", desc: "Documentos de serviços prestados", iconBg: "bg-teal-100/70 text-teal-700" },
        { href: "/finances", Icon: TrendingUp, label: "Resumo financeiro", desc: "Distribuição de rendimento mensal", iconBg: "bg-emerald-100/70 text-emerald-700" },
        { href: "/product-prices", Icon: Tag, label: "Preços de produtos", desc: "Histórico e comparação de preços", iconBg: "bg-cyan-100/70 text-cyan-700" },
        { onClick: onScanInvoice, Icon: Camera, label: "Digitalizar fatura", desc: "Tirar foto e registar compra", iconBg: "bg-rose-100/70 text-rose-700" },
      ],
    },
    {
      id: "docs",
      title: "Documentos & Relatórios",
      subtitle: "orçamentos, exportações e galeria",
      Icon: FileText,
      items: [
        { href: "/quotes", Icon: ClipboardList, label: "Orçamentos", desc: "Criar e enviar propostas", iconBg: "bg-indigo-100/70 text-indigo-700" },
        { href: "/reports", Icon: FileText, label: "Relatórios", desc: "Análise de serviços", iconBg: "bg-slate-100/70 text-slate-600" },
        { href: "/exports", Icon: Download, label: "Exportações", desc: "Exportar dados em PDF e CSV", iconBg: "bg-slate-100/70 text-slate-600" },
        { href: "/gallery", Icon: Camera, label: "Galeria", desc: "Fotos e documentos", iconBg: "bg-rose-100/70 text-rose-700" },
      ],
    },
  ];

  return (
    <div className="mb-4 space-y-4" data-testid="home-action-menus">
      <div>
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-[15px] font-bold text-slate-900">Acções principais</span>
          <span className="text-[11px] font-semibold text-slate-400">4 atalhos</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {primaryActions.map((action) => {
            const inner = (
              <div className="bg-muted rounded-2xl border border-border py-3 px-1.5 flex flex-col items-center gap-1.5 active:scale-[0.97] transition-transform min-h-[82px]">
                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", action.iconBg)}>
                  <action.Icon className="w-[18px] h-[18px]" strokeWidth={2} aria-hidden="true" />
                </div>
                <span className="text-[10px] font-semibold text-slate-700 text-center leading-tight">{action.label}</span>
              </div>
            );

            if (action.href) {
              return (
                <Link key={action.href} href={action.href} className="block" data-testid={`link-primary-${actionTestId(action.label)}`}>
                  {inner}
                </Link>
              );
            }

            return (
              <button key={action.label} type="button" onClick={action.onClick} className="block text-left" data-testid={`button-primary-${actionTestId(action.label)}`}>
                {inner}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Submenus</h3>
        {groups.map((group) => (
          <ActionGroupCard
            key={group.id}
            group={group}
            isOpen={openGroup === group.id}
            onToggle={() => setOpenGroup(openGroup === group.id ? "" : group.id)}
          />
        ))}
      </div>
    </div>
  );
}
