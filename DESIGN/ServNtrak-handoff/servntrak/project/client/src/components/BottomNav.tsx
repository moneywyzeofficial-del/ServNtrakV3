import { Link, useLocation } from "wouter";
import { Home, Calendar, Users, User, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MORE_ROUTES = [
  "/finances", "/reports", "/exports", "/billing",
  "/payments", "/gallery", "/reminders", "/map", "/employees", "/pending-tasks",
  "/expense-notes", "/lista-compras",
];

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/",        icon: Home,     label: "Início"    },
    { href: "/clients", icon: Users,    label: "Clientes"  },
    { href: "/calendar",icon: Calendar, label: "Agenda"    },
    { href: "/reports", icon: BarChart2,label: "Relatórios"},
    { href: "/profile", icon: User,     label: "Perfil"    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 rounded-t-3xl shadow-[0_-10px_40px_hsl(var(--primary)/0.08)]"
      data-testid="bottom-navigation"
      aria-label="Navegação principal"
    >
      <div className="flex justify-around items-center mx-auto h-16 px-2">
        {navItems.map((item) => {
          const isActive =
            location === item.href ||
            (item.href === "/reports" && MORE_ROUTES.includes(location));

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center flex-1 h-full outline-none touch-manipulation"
              data-testid={`nav-${item.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
              aria-current={isActive ? "page" : undefined}
            >
              <div className={cn(
                "flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-colors",
                isActive ? "bg-primary/10" : "hover:bg-primary/5"
              )}>
                <item.icon
                  className={cn(
                    "w-5 h-5 mb-0.5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                  aria-label={item.label}
                  role="img"
                />
                <span className={cn(
                  "text-[10px] transition-colors",
                  isActive ? "font-bold text-primary" : "font-medium text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </div>
              {isActive && (
                <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
