import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export function useSuperAdmin(user: User | null) {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      if (!user) {
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc("is_superadmin", {
        _user_id: user.id,
      });

      setIsSuperAdmin(!error && !!data);
      setLoading(false);
    }

    check();
  }, [user]);

  return { isSuperAdmin, loading };
}
