import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Bell,
  Camera,
  ClipboardList,
  CreditCard,
  Download,
  FileText,
  Map,
  PackageSearch,
  Search,
  ShoppingBag,
  Tag,
  TrendingUp,
  User,
  Users,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";

type MoreItem = {
  href: string;
  label: string;
  desc: string;
  Icon: LucideIcon;
  iconBg: string;
  keywords?: string[];
};

type MoreSection = {
  title: string;
  desc: string;
  items: MoreItem[];
};

const sections: MoreSection[] = [
  {
    title: "Trabalho",
    desc: "Agenda, tarefas e operação diária",
    items: [
      { href: "/calendar", label: "Agenda", desc: "Ver e planear visitas", Icon: ClipboardList, iconBg: "bg-primary/10 text-primary", keywords: ["calendário", "visita", "trabalho", "marcar"] },
      { href: "/pending-tasks", label: "Tarefas pendentes", desc: "Trabalhos por concluir", Icon: ClipboardList, iconBg: "bg-primary/10 text-primary", keywords: ["tarefas", "pendente", "to do", "trabalhos"] },
      { href: "/reminders", label: "Lembretes", desc: "Alertas e manutenções periódicas", Icon: Bell, iconBg: "bg-yellow-100/70 text-yellow-700", keywords: ["alertas", "manutenção", "avisos"] },
      { href: "/weather", label: "Meteorologia", desc: "Previsão e condições atuais", Icon: Map, iconBg: "bg-blue-100/70 text-blue-700", keywords: ["tempo", "chuva", "vento", "ipma"] },
    ],
  },
  {
    title: "Clientes & Equipa",
    desc: "Clientes, mapa e funcionários",
    items: [
      { href: "/clients", label: "Clientes", desc: "Lista e detalhes de clientes", Icon: Users, iconBg: "bg-accent/10 text-accent", keywords: ["cliente", "morada", "contacto"] },
      { href: "/map", label: "Mapa", desc: "Clientes por localização", Icon: Map, iconBg: "bg-primary/10 text-primary", keywords: ["rota", "gps", "localização", "moradas"] },
      { href: "/employees", label: "Funcionários", desc: "Equipa e salários", Icon: Users, iconBg: "bg-muted text-muted-foreground", keywords: ["equipa", "salários", "staff"] },
    ],
  },
  {
    title: "Finanças",
    desc: "Pagamentos, compras e despesas",
    items: [
      { href: "/finances", label: "Resumo financeiro", desc: "Distribuição de rendimento", Icon: TrendingUp, iconBg: "bg-emerald-100/70 text-emerald-700", keywords: ["dinheiro", "rendimento", "lucro", "resumo"] },
      { href: "/billing", label: "Faturação", desc: "Serviços por cobrar", Icon: CreditCard, iconBg: "bg-purple-100/70 text-purple-700", keywords: ["fatura", "cobrar", "pagamento", "dívida"] },
      { href: "/payments", label: "Mensalidades", desc: "Pagamentos mensais", Icon: WalletCards, iconBg: "bg-purple-100/70 text-purple-700", keywords: ["mensalidade", "pagamento", "recorrente"] },
      { href: "/purchases", label: "Compras", desc: "Materiais e gastos", Icon: ShoppingBag, iconBg: "bg-green-100/70 text-green-700", keywords: ["compras", "materiais", "despesas", "gastos"] },
      { href: "/expense-notes", label: "Notas de despesa", desc: "Documentos de serviços prestados", Icon: FileText, iconBg: "bg-teal-100/70 text-teal-700", keywords: ["despesa", "nota", "documento"] },
      { href: "/product-prices", label: "Preços de produtos", desc: "Histórico e comparação", Icon: Tag, iconBg: "bg-cyan-100/70 text-cyan-700", keywords: ["preços", "produtos", "histórico", "comparar"] },
      { href: "/lista-compras", label: "Lista de compras", desc: "Materiais a comprar", Icon: PackageSearch, iconBg: "bg-green-100/70 text-green-700", keywords: ["lista", "comprar", "stock", "materiais"] },
    ],
  },
  {
    title: "Documentos",
    desc: "Relatórios, propostas e ficheiros",
    items: [
      { href: "/quotes", label: "Orçamentos", desc: "Criar e enviar propostas", Icon: ClipboardList, iconBg: "bg-indigo-100/70 text-indigo-700", keywords: ["proposta", "orçamento", "cotação"] },
      { href: "/reports", label: "Relatórios", desc: "Análises e estatísticas", Icon: FileText, iconBg: "bg-slate-100/70 text-slate-600", keywords: ["relatório", "estatísticas", "análise"] },
      { href: "/profitability", label: "Rentabilidade", desc: "Lucro por cliente", Icon: TrendingUp, iconBg: "bg-emerald-100/70 text-emerald-700", keywords: ["lucro", "cliente", "rentável"] },
      { href: "/exports", label: "Exportações", desc: "PDF e CSV", Icon: Download, iconBg: "bg-slate-100/70 text-slate-600", keywords: ["exportar", "pdf", "csv", "download"] },
      { href: "/gallery", label: "Galeria", desc: "Fotos e documentos", Icon: Camera, iconBg: "bg-rose-100/70 text-rose-700", keywords: ["foto", "imagem", "galeria"] },
      { href: "/logos", label: "Logos", desc: "Gestão de identidade visual", Icon: FileText, iconBg: "bg-slate-100/70 text-slate-600", keywords: ["logo", "marca", "imagem"] },
    ],
  },
  {
    title: "Conta",
    desc: "Perfil e definições pessoais",
    items: [
      { href: "/profile", label: "Perfil", desc: "Conta, preferências e sessão", Icon: User, iconBg: "bg-primary/10 text-primary", keywords: ["conta", "perfil", "sair", "definições"] },
    ],
  },
];

function normalise(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function itemTestId(label: string) {
  return normalise(label).replace(/\s+/g, "-");
}

function itemMatches(item: MoreItem, query: string) {
  const target = normalise([item.label, item.desc, ...(item.keywords ?? [])].join(" "));
  return target.includes(normalise(query));
}

export default function More() {
  const [search, setSearch] = useState("");

  const filteredSections = useMemo(() => {
    const query = search.trim();
    if (!query) return sections;

    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => itemMatches(item, query)),
      }))
      .filter((section) => section.items.length > 0);
  }, [search]);

  const resultCount = filteredSections.reduce((total, section) => total + section.items.length, 0);

  return (
    <div className="min-h-screen bg-background pb-24 page-transition">
      <header className="px-4 pt-5 pb-4 bg-white border-b border-border sticky top-0 z-20">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">ServNtrak</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mt-1">Mais ferramentas</h1>
        <p className="text-sm text-slate-500 mt-1">Tudo organizado por área para manter o início mais limpo.</p>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar ferramenta…"
            className="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            data-testid="input-more-search"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600"
              aria-label="Limpar pesquisa"
              data-testid="button-clear-more-search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      <main className="px-4 py-5 space-y-5">
        {search.trim() && (
          <p className="text-[12px] font-semibold text-slate-500 px-1" data-testid="text-more-results-count">
            {resultCount} resultado{resultCount !== 1 ? "s" : ""} para “{search.trim()}”
          </p>
        )}

        {filteredSections.length > 0 ? (
          filteredSections.map((section) => (
            <section key={section.title} className="space-y-3">
              <div className="px-1">
                <h2 className="text-[15px] font-extrabold text-slate-900">{section.title}</h2>
                <p className="text-[12px] text-slate-500 mt-0.5">{section.desc}</p>
              </div>

              <div className="grid gap-2">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block"
                    data-testid={`link-more-page-${itemTestId(item.label)}`}
                  >
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 active:scale-[0.99] transition-transform">
                      <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center shrink-0", item.iconBg)}>
                        <item.Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 text-[14px]">{item.label}</h3>
                        <p className="text-[12px] text-slate-500 leading-snug">{item.desc}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm" data-testid="empty-more-search">
            <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" aria-hidden="true" />
            <h2 className="font-bold text-slate-900">Sem resultados</h2>
            <p className="text-sm text-slate-500 mt-1">Tente pesquisar por cliente, fatura, relatório, mapa ou orçamento.</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
