import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BlockedDateInfo {
  date: string;
  reason: string | null;
}

interface ProfessionalSchedule {
  workingDays: number[] | null;
  blockedDates: string[];
  blockedDateInfos: BlockedDateInfo[];
}

export function useProfessionalSchedule(professionalId: string) {
  const [schedule, setSchedule] = useState<ProfessionalSchedule>({
    workingDays: null,
    blockedDates: [],
    blockedDateInfos: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchSchedule() {
      if (!professionalId) {
        setSchedule({ workingDays: null, blockedDates: [], blockedDateInfos: [] });
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
          .select("blocked_date, reason")
          .eq("professional_id", professionalId)
          .gte("blocked_date", new Date().toISOString().split("T")[0]),
      ]);

      const blockedInfos: BlockedDateInfo[] = (blockedResult.data || []).map((d) => ({
        date: d.blocked_date,
        reason: d.reason,
      }));

      setSchedule({
        workingDays: profResult.data?.working_days || null,
        blockedDates: blockedInfos.map((b) => b.date),
        blockedDateInfos: blockedInfos,
      });

      setLoading(false);
    }

    fetchSchedule();
  }, [professionalId]);

  return { schedule, loading };
}
