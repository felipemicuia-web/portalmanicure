import { Routes, Route } from "react-router-dom";
import { TenantScopeProvider } from "@/contexts/TenantScopeProvider";
import BookingPage from "./BookingPage";
import Auth from "./Auth";
import AdminPage from "./AdminPage";
import ProfessionalProfilePage from "./ProfessionalProfilePage";

/**
 * All routes under /tenant/:slug/* are wrapped with TenantScopeProvider.
 * This overrides the global TenantContext with the tenant resolved from the slug.
 * All existing hooks (useBookingData, useBranding, useAdmin, etc.) work automatically
 * because they read from useTenant().
 */
export default function TenantScopedApp() {
  return (
    <TenantScopeProvider>
      <Routes>
        <Route index element={<BookingPage />} />
        <Route path="auth" element={<Auth />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="professional/:id" element={<ProfessionalProfilePage />} />
      </Routes>
    </TenantScopeProvider>
  );
}
