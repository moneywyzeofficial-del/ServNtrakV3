import { useState, useCallback, Suspense } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import { scheduleViews, loadPersistedView, persistView } from "@/components/schedule/views";

export default function SchedulePage() {
  const [currentView, setCurrentView] = useState<string>(() => loadPersistedView("lista"));

  const handleViewChange = useCallback((key: string) => {
    setCurrentView(key);
    persistView(key);
  }, []);

  const activeView = scheduleViews.find((v) => v.key === currentView) ?? scheduleViews[0];
  const ViewComponent = activeView.Component;

  return (
    <div className="min-h-screen bg-background pb-24 page-transition">
      <PageHeader
        title="Agenda"
        subtitle="Visitas e trabalhos agendados"
        backHref="/more"
      />

      {/* View Selector — mobile-first horizontal scroll on very small screens */}
      <div className="px-5 pt-4 pb-2 overflow-x-auto">
        <div
          className="flex gap-1 bg-muted/30 p-1 rounded-xl min-w-fit"
          data-testid="schedule-view-tabs"
          role="tablist"
        >
          {scheduleViews.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={currentView === key}
              onClick={() => handleViewChange(key)}
              className={cn(
                "flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap",
                currentView === key
                  ? "bg-card text-foreground shadow-sm border border-border/30"
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid={`schedule-tab-${key}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* View Content */}
      <div className={currentView !== "calendario" ? "px-5" : undefined}>
        <Suspense
          fallback={
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          }
        >
          <ViewComponent />
        </Suspense>
      </div>

      <BottomNav />
    </div>
  );
}
