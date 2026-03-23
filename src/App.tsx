import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemedBackground } from "@/components/backgrounds/ThemedBackground";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { RequireSuperAdmin } from "@/components/guards/RequireSuperAdmin";
import BookingPage from "./pages/BookingPage";
import Auth from "./pages/Auth";
import AdminPage from "./pages/AdminPage";
import PlatformPage from "./pages/PlatformPage";
import ProfessionalProfilePage from "./pages/ProfessionalProfilePage";
import TenantScopedApp from "./pages/TenantScopedApp";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TenantProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <div className="galaxy-bg" />
          <ErrorBoundary>
            <BrowserRouter>
              <Routes>
                {/* Root routes use ThemeProvider scoped to the root TenantContext (default tenant) */}
                <Route
                  path="/"
                  element={
                    <ThemeProvider>
                      <ThemedBackground />
                      <BookingPage />
                    </ThemeProvider>
                  }
                />
                <Route
                  path="/auth"
                  element={
                    <ThemeProvider>
                      <ThemedBackground />
                      <Auth />
                    </ThemeProvider>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ThemeProvider>
                      <ThemedBackground />
                      <AdminPage />
                    </ThemeProvider>
                  }
                />
                <Route
                  path="/platform"
                  element={
                    <RequireSuperAdmin>
                      <PlatformPage />
                    </RequireSuperAdmin>
                  }
                />
                <Route
                  path="/professional/:id"
                  element={
                    <ThemeProvider>
                      <ThemedBackground />
                      <ProfessionalProfilePage />
                    </ThemeProvider>
                  }
                />
                {/* Tenant-scoped routes: ThemeProvider is inside TenantScopedApp,
                    nested under TenantScopeProvider, so it reads the correct tenant's theme */}
                <Route path="/tenant/:slug/*" element={<TenantScopedApp />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ErrorBoundary>
        </AuthProvider>
      </TenantProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
