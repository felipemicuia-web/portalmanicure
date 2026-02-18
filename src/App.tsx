import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemedBackground } from "@/components/backgrounds/ThemedBackground";
import { TenantProvider } from "@/contexts/TenantContext";
import { useTenantTheme } from "@/hooks/useTheme";
import BookingPage from "./pages/BookingPage";
import Auth from "./pages/Auth";
import AdminPage from "./pages/AdminPage";
import ProfessionalProfilePage from "./pages/ProfessionalProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Loads and subscribes to theme from DB per tenant
function ThemeLoader() {
  useTenantTheme();
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TenantProvider>
        <ThemeLoader />
        <Toaster />
        <Sonner />
        {/* Galaxy background base */}
        <div className="galaxy-bg" />
        {/* Themed animated particles */}
        <ThemedBackground />
        <ErrorBoundary>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<BookingPage />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/professional/:id" element={<ProfessionalProfilePage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </TenantProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
