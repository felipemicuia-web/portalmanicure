import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WorkSettings {
  start_time: string;
  end_time: string;
  interval_minutes: number;
  lunch_start: string | null;
  lunch_end: string | null;
}

const DEFAULT_SETTINGS: WorkSettings = {
  start_time: "09:00",
  end_time: "18:00",
  interval_minutes: 10,
  lunch_start: null,
  lunch_end: null,
};

export function useWorkSettings() {
  const [settings, setSettings] = useState<WorkSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      const { data, error } = await supabase
        .from("work_settings")
        .select("start_time, end_time, interval_minutes, lunch_start, lunch_end")
        .maybeSingle();

      if (!error && data) {
        setSettings({
          start_time: data.start_time,
          end_time: data.end_time,
          interval_minutes: data.interval_minutes,
          lunch_start: data.lunch_start,
          lunch_end: data.lunch_end,
        });
      }
      setLoading(false);
    }

    fetchSettings();
  }, []);

  return { settings, loading };
}
