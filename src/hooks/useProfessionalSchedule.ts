import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProfessionalSchedule {
  workingDays: number[] | null; // null = usa config global
  blockedDates: string[]; // Array de datas no formato YYYY-MM-DD
}

export function useProfessionalSchedule(professionalId: string) {
  const [schedule, setSchedule] = useState<ProfessionalSchedule>({
    workingDays: null,
    blockedDates: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchSchedule() {
      if (!professionalId) {
        setSchedule({ workingDays: null, blockedDates: [] });
        return;
      }

      setLoading(true);

      const [profResult, blockedResult] = await Promise.all([
        supabase
          .from("professionals")
          .select("working_days")
          .eq("id", professionalId)
          .single(),
        supabase
          .from("professional_blocked_dates")
          .select("blocked_date")
          .eq("professional_id", professionalId)
          .gte("blocked_date", new Date().toISOString().split("T")[0]),
      ]);

      setSchedule({
        workingDays: profResult.data?.working_days || null,
        blockedDates: (blockedResult.data || []).map((d) => d.blocked_date),
      });

      setLoading(false);
    }

    fetchSchedule();
  }, [professionalId]);

  return { schedule, loading };
}
