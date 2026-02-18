import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Professional, Service } from "@/types/booking";
import { useWorkSettings, WorkSettings } from "@/hooks/useWorkSettings";
import { useTenant } from "@/contexts/TenantContext";

export { useWorkSettings };

export function useBookingData() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { tenantId, loading: tenantLoading } = useTenant();

  useEffect(() => {
    async function fetchData() {
      if (tenantLoading || !tenantId) return;
      
      setLoading(true);
      
      let profsQuery = supabase.from("professionals").select("*").eq("active", true);
      let servicesQuery = supabase.from("services").select("*").eq("active", true);
      
      profsQuery = profsQuery.eq("tenant_id", tenantId);
      servicesQuery = servicesQuery.eq("tenant_id", tenantId);

      const [profsResult, servicesResult] = await Promise.all([
        profsQuery,
        servicesQuery,
      ]);

      if (profsResult.data) setProfessionals(profsResult.data);
      if (servicesResult.data) setServices(servicesResult.data);
      
      setLoading(false);
    }

    fetchData();
  }, [tenantId, tenantLoading]);

  return { professionals, services, loading: loading || tenantLoading };
}

export function useAvailableTimes(
  professionalId: string,
  date: string,
  totalMinutes: number
) {
  const [times, setTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { settings: workSettings, loading: settingsLoading } = useWorkSettings();
  const [refreshKey, setRefreshKey] = useState(0);

  // Realtime subscription: refresh slots when bookings change for this professional+date
  useEffect(() => {
    if (!professionalId || !date) return;

    const channel = supabase
      .channel(`bookings-slots-${professionalId}-${date}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `professional_id=eq.${professionalId}`,
        },
        (payload) => {
          // Only refresh if the change is for the same date
          const row = (payload.new as any) || (payload.old as any);
          if (row?.booking_date === date) {
            setRefreshKey((k) => k + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [professionalId, date]);

  useEffect(() => {
    async function fetchTimes() {
      if (!professionalId || !date || totalMinutes <= 0 || settingsLoading) {
        setTimes([]);
        return;
      }

      setLoading(true);

      const [bookingsResult, professionalResult, blockedResult] = await Promise.all([
        supabase
          .from("bookings")
          .select("booking_time, duration_minutes")
          .eq("professional_id", professionalId)
          .eq("booking_date", date)
          .neq("status", "cancelled"),
        supabase
          .from("professionals")
          .select("working_days")
          .eq("id", professionalId)
          .single(),
        supabase
          .from("professional_blocked_dates")
          .select("blocked_date")
          .eq("professional_id", professionalId)
          .eq("blocked_date", date),
      ]);

      if (blockedResult.data && blockedResult.data.length > 0) {
        setTimes([]);
        setLoading(false);
        return;
      }

      const effectiveWorkingDays = professionalResult.data?.working_days ?? workSettings.working_days;

      const busy = (bookingsResult.data || []).map((b) => ({
        start: toMinutes(b.booking_time),
        end: toMinutes(b.booking_time) + Number(b.duration_minutes || 0),
      }));

      const availableSlots = buildAvailableTimes(
        totalMinutes, 
        busy, 
        { ...workSettings, working_days: effectiveWorkingDays }, 
        date
      );
      setTimes(availableSlots);
      setLoading(false);
    }

    fetchTimes();
  }, [professionalId, date, totalMinutes, workSettings, settingsLoading, refreshKey]);

  return { times, loading: loading || settingsLoading };
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function buildAvailableTimes(
  totalServiceMinutes: number,
  bookings: { start: number; end: number }[],
  workSettings: WorkSettings,
  selectedDate?: string
): string[] {
  if (selectedDate) {
    const dateObj = new Date(selectedDate + "T12:00:00");
    const dayOfWeek = dateObj.getDay();
    
    if (!workSettings.working_days.includes(dayOfWeek)) {
      return [];
    }
  }

  const start = toMinutes(workSettings.start_time);
  const end = toMinutes(workSettings.end_time);
  const intervalMinutes = workSettings.interval_minutes;

  let lunchStart: number | null = null;
  let lunchEnd: number | null = null;
  if (workSettings.lunch_start && workSettings.lunch_end) {
    lunchStart = toMinutes(workSettings.lunch_start);
    lunchEnd = toMinutes(workSettings.lunch_end);
  }

  const serviceDuration = totalServiceMinutes;
  const slotStep = workSettings.slot_step_minutes || 30;

  const slots: string[] = [];
  
  for (let t = start; t + serviceDuration <= end; t += slotStep) {
    const slotStart = t;
    const slotEnd = t + serviceDuration;
    
    if (lunchStart !== null && lunchEnd !== null) {
      if (overlaps(slotStart, slotEnd, lunchStart, lunchEnd)) {
        continue;
      }
    }

    const blockedEnd = slotEnd + intervalMinutes;

    const conflict = bookings.some((b) => {
      const bookingBlockedEnd = b.end + intervalMinutes;
      return overlaps(slotStart, blockedEnd, b.start, bookingBlockedEnd);
    });
    
    if (!conflict) {
      slots.push(toHHMM(slotStart));
    }
  }

  return slots;
}
