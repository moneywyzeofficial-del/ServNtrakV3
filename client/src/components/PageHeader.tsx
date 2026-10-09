import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  backHref?: string;
  actionHref?: string;
  actionLabel?: string;
  ActionIcon?: LucideIcon;
  rightSlot?: ReactNode;
  sticky?: boolean;
  className?: string;
};

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  backHref,
  actionHref,
  actionLabel,
  ActionIcon,
  rightSlot,
  sticky = true,
  className,
}: PageHeaderProps) {
  const hasAction = Boolean(actionHref && actionLabel);

  return (
    <header
      className={cn(
        "bg-white border-b border-border px-4 pt-4 pb-3",
        sticky && "sticky top-0 z-30",
        className
      )}
      data-testid="page-header"
    >
      <div className="flex items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="h-10 w-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label="Voltar"
            data-testid="page-header-back"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </Link>
        )}

        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground truncate">
              {eyebrow}
            </p>
          )}
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 truncate" data-testid="page-header-title">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-0.5 line-clamp-2" data-testid="page-header-subtitle">
              {subtitle}
            </p>
          )}
        </div>

        {rightSlot}

        {hasAction && (
          <Link
            href={actionHref!}
            className="h-10 rounded-2xl bg-primary text-white px-3 flex items-center justify-center gap-2 shrink-0 text-sm font-bold active:scale-95 transition-transform shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
            data-testid="page-header-action"
          >
            {ActionIcon && <ActionIcon className="w-4 h-4" aria-hidden="true" />}
            <span>{actionLabel}</span>
          </Link>
        )}
      </div>
    </header>
  );
}
