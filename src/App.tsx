import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import BookingPage from "./pages/BookingPage";
import Auth from "./pages/Auth";
import AdminPage from "./pages/AdminPage";
import ProfessionalProfilePage from "./pages/ProfessionalProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Theme loader component
function ThemeLoader() {
  useEffect(() => {
    const stored = localStorage.getItem("site-theme-colors");
    if (stored) {
      try {
        const colors = JSON.parse(stored);
        const root = document.documentElement;
        root.style.setProperty("--primary", colors.primary);
        root.style.setProperty("--secondary", colors.secondary);
        root.style.setProperty("--accent", colors.accent);
        root.style.setProperty("--background", colors.background);
        root.style.setProperty("--card", colors.card);
        root.style.setProperty("--ring", colors.primary);
        root.style.setProperty("--sidebar-primary", colors.primary);
        root.style.setProperty("--sidebar-accent", colors.secondary);
      } catch {
        // Use default theme
      }
    }
  }, []);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeLoader />
      <Toaster />
      <Sonner />
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
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
