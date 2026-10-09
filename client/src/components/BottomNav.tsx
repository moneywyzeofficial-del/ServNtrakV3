import { Link, useLocation } from "wouter";
import {
  Calendar,
  CreditCard,
  Grid3X3,
  Home,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CLIENT_ROUTES = ["/clients", "/map", "/employees"];
const WORK_ROUTES = ["/calendar", "/reminders", "/pending-tasks"];
const FINANCE_ROUTES = [
  "/finances",
  "/billing",
  "/payments",
  "/purchases",
  "/expense-notes",
  "/quotes",
  "/product-prices",
  "/lista-compras",
];
const MORE_ROUTES = [
  "/more",
  "/reports",
  "/profitability",
  "/exports",
  "/gallery",
  "/logos",
  "/weather",
];

const routeStartsWith = (location: string, routes: string[]) =>
  routes.some((route) => location === route || location.startsWith(`${route}/`));

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    {
      href: "/",
      icon: Home,
      label: "Início",
      isActive: location === "/",
    },
    {
      href: "/clients",
      icon: Users,
      label: "Clientes",
      isActive: routeStartsWith(location, CLIENT_ROUTES),
    },
    {
      href: "/calendar",
      icon: Calendar,
      label: "Agenda",
      isActive: routeStartsWith(location, WORK_ROUTES),
    },
    {
      href: "/finances",
      icon: CreditCard,
      label: "Finanças",
      isActive: routeStartsWith(location, FINANCE_ROUTES),
    },
    {
      href: "/more",
      icon: Grid3X3,
      label: "Mais",
      isActive: routeStartsWith(location, MORE_ROUTES),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-border z-50 rounded-t-3xl shadow-[0_-10px_40px_hsl(var(--primary)/0.08)] safe-area-pb"
      data-testid="bottom-navigation"
      aria-label="Navegação principal"
    >
      <div className="grid grid-cols-5 items-center mx-auto h-[72px] px-1 max-w-2xl">
        {navItems.map((item) => {
          const isActive = item.isActive;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center h-full min-w-0 outline-none touch-manipulation rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/40"
              data-testid={`nav-${item.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
            >
              <div
                className={cn(
                  "flex flex-col items-center justify-center w-full max-w-[64px] h-14 rounded-2xl transition-colors",
                  isActive ? "bg-primary/10" : "hover:bg-primary/5 active:bg-primary/10"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 mb-0.5 shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "max-w-full truncate px-0.5 text-[9px] leading-tight transition-colors sm:text-[10px]",
                    isActive ? "font-bold text-primary" : "font-medium text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </div>
              {isActive && <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
