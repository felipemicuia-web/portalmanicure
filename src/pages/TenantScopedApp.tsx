import { Routes, Route } from "react-router-dom";
import { TenantScopeProvider } from "@/contexts/TenantScopeProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemedBackground } from "@/components/backgrounds/ThemedBackground";
import BookingPage from "./BookingPage";
import Auth from "./Auth";
import AdminPage from "./AdminPage";
import ProfessionalProfilePage from "./ProfessionalProfilePage";

/**
 * All routes under /tenant/:slug/* are wrapped with TenantScopeProvider.
 * ThemeProvider is nested INSIDE TenantScopeProvider so it reads the
 * correct tenant's theme instead of the root/default tenant.
 */
export default function TenantScopedApp() {
  return (
    <TenantScopeProvider>
      <ThemeProvider>
        <ThemedBackground />
        <Routes>
          <Route index element={<BookingPage />} />
          <Route path="auth" element={<Auth />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="professional/:id" element={<ProfessionalProfilePage />} />
        </Routes>
      </ThemeProvider>
    </TenantScopeProvider>
  );
}
