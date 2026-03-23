import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useTenant } from "@/contexts/TenantContext";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** Whether the current user has a profile in the active tenant */
  hasTenantProfile: boolean;
  /** True while we're checking tenant profile existence */
  checkingTenantProfile: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  hasTenantProfile: false,
  checkingTenantProfile: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasTenantProfile, setHasTenantProfile] = useState(false);
  const [checkingTenantProfile, setCheckingTenantProfile] = useState(true);
  const { tenantId, loading: tenantLoading } = useTenant();

  useEffect(() => {
    // First restore session from storage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Then subscribe to future changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check tenant profile whenever user or tenant changes
  useEffect(() => {
    if (tenantLoading || loading) {
      return;
    }

    if (!user || !tenantId) {
      setHasTenantProfile(false);
      setCheckingTenantProfile(false);
      return;
    }

    setCheckingTenantProfile(true);

    supabase
      .rpc("user_has_profile_in_tenant", {
        _user_id: user.id,
        _tenant_id: tenantId,
      })
      .then(({ data }) => {
        setHasTenantProfile(!!data);
        setCheckingTenantProfile(false);
      });
  }, [user, tenantId, loading, tenantLoading]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setHasTenantProfile(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, session, loading, hasTenantProfile, checkingTenantProfile, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
