import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useState, lazy, Suspense } from "react";
import { SplashScreen } from "@/components/SplashScreen";
import AssistantChat from "@/components/AssistantChat";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { QuickCreateButton } from "@/components/QuickCreateButton";

// Eager load critical initial screen
import Home from "@/pages/Home";

// Lazy load secondary routes for fast initial bundle and optimal mobile performance
const Login = lazy(() => import("@/pages/Login"));
const Clients = lazy(() => import("@/pages/Clients"));
const ClientDetail = lazy(() => import("@/pages/ClientDetail"));
const ClientDocumentsPage = lazy(() => import("@/pages/ClientDocuments"));
const CalendarPage = lazy(() => import("@/pages/Calendar"));
const ClientsMap = lazy(() => import("@/pages/ClientsMap"));
const Weather = lazy(() => import("@/pages/Weather"));
const Reminders = lazy(() => import("@/pages/Reminders"));
const Billing = lazy(() => import("@/pages/Billing"));
const Profile = lazy(() => import("@/pages/Profile"));
const Purchases = lazy(() => import("@/pages/Purchases"));
const Reports = lazy(() => import("@/pages/Reports"));
const ClientProfitability = lazy(() => import("@/pages/ClientProfitability"));
const Payments = lazy(() => import("@/pages/Payments"));
const Logos = lazy(() => import("@/pages/Logos"));
const Gallery = lazy(() => import("@/pages/Gallery"));
const Finances = lazy(() => import("@/pages/Finances"));
const Exports = lazy(() => import("@/pages/Exports"));
const Employees = lazy(() => import("@/pages/Employees"));
const PendingTasks = lazy(() => import("@/pages/PendingTasks"));
const ExpenseNotes = lazy(() => import("@/pages/ExpenseNotes"));
const ExpenseNoteNew = lazy(() => import("@/pages/ExpenseNoteNew"));
const ExpenseNoteDetail = lazy(() => import("@/pages/ExpenseNoteDetail"));
const Quotes = lazy(() => import("@/pages/Quotes"));
const QuoteNew = lazy(() => import("@/pages/QuoteNew"));
const QuoteDetail = lazy(() => import("@/pages/QuoteDetail"));
const ProductPrices = lazy(() => import("@/pages/ProductPrices"));
const ShoppingList = lazy(() => import("@/pages/ShoppingList"));
const More = lazy(() => import("@/pages/More"));
const NotFound = lazy(() => import("@/pages/not-found"));

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
}

function Router() {
  const { user, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} userName={user?.firstName} />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Suspense fallback={<PageFallback />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/clients" component={Clients} />
          <Route path="/clients/:id/documents" component={ClientDocumentsPage} />
          <Route path="/clients/:id" component={ClientDetail} />
          <Route path="/map" component={ClientsMap} />
          <Route path="/weather" component={Weather} />
          <Route path="/calendar" component={CalendarPage} />
          <Route path="/reminders" component={Reminders} />
          <Route path="/billing" component={Billing} />
          <Route path="/purchases" component={Purchases} />
          <Route path="/reports" component={Reports} />
          <Route path="/profitability" component={ClientProfitability} />
          <Route path="/payments" component={Payments} />
          <Route path="/profile" component={Profile} />
          <Route path="/logos" component={Logos} />
          <Route path="/gallery" component={Gallery} />
          <Route path="/finances" component={Finances} />
          <Route path="/exports" component={Exports} />
          <Route path="/employees" component={Employees} />
          <Route path="/pending-tasks" component={PendingTasks} />
          <Route path="/expense-notes" component={ExpenseNotes} />
          <Route path="/expense-notes/new" component={ExpenseNoteNew} />
          <Route path="/expense-notes/:id" component={ExpenseNoteDetail} />
          <Route path="/quotes" component={Quotes} />
          <Route path="/quotes/new" component={QuoteNew} />
          <Route path="/quotes/:id" component={QuoteDetail} />
          <Route path="/product-prices" component={ProductPrices} />
          <Route path="/lista-compras" component={ShoppingList} />
          <Route path="/more" component={More} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
      <OfflineIndicator />
      <QuickCreateButton />
      <AssistantChat />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
