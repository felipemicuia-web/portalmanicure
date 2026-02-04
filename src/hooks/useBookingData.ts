import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Professional, Service } from "@/types/booking";
import { useWorkSettings, WorkSettings } from "@/hooks/useWorkSettings";

export function useBookingData() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      const [profsResult, servicesResult] = await Promise.all([
        supabase.from("professionals").select("*").eq("active", true),
        supabase.from("services").select("*").eq("active", true),
      ]);

      if (profsResult.data) setProfessionals(profsResult.data);
      if (servicesResult.data) setServices(servicesResult.data);
      
      setLoading(false);
    }

    fetchData();
  }, []);

  return { professionals, services, loading };
}

export function useAvailableTimes(
  professionalId: string,
  date: string,
  totalMinutes: number
) {
  const [times, setTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { settings: workSettings, loading: settingsLoading } = useWorkSettings();

  useEffect(() => {
    async function fetchTimes() {
      if (!professionalId || !date || totalMinutes <= 0 || settingsLoading) {
        setTimes([]);
        return;
      }

      setLoading(true);

      // Fetch existing bookings for that date and professional
      const { data: bookings } = await supabase
        .from("bookings")
        .select("booking_time, duration_minutes")
        .eq("professional_id", professionalId)
        .eq("booking_date", date)
        .neq("status", "cancelled");

      const busy = (bookings || []).map((b) => ({
        start: toMinutes(b.booking_time),
        end: toMinutes(b.booking_time) + Number(b.duration_minutes || 0),
      }));

      const availableSlots = buildAvailableTimes(totalMinutes, busy, workSettings);
      setTimes(availableSlots);
      setLoading(false);
    }

    fetchTimes();
  }, [professionalId, date, totalMinutes, workSettings, settingsLoading]);

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
  workSettings: WorkSettings
): string[] {
  const start = toMinutes(workSettings.start_time);
  const end = toMinutes(workSettings.end_time);
  const intervalMinutes = workSettings.interval_minutes;

  // Calcula o período de almoço se existir
  let lunchStart: number | null = null;
  let lunchEnd: number | null = null;
  if (workSettings.lunch_start && workSettings.lunch_end) {
    lunchStart = toMinutes(workSettings.lunch_start);
    lunchEnd = toMinutes(workSettings.lunch_end);
  }

  const blockMinutes = 60;
  const roundedService = Math.ceil(totalServiceMinutes / blockMinutes) * blockMinutes;
  const step = blockMinutes + intervalMinutes;

  if (step <= 0) return [];

  const slots: string[] = [];
  for (let t = start; t + roundedService <= end; t += step) {
    const slotStart = t;
    const slotEnd = t + roundedService;
    const blockedEnd = slotEnd + intervalMinutes;

    // Verifica se o slot conflita com o horário de almoço
    if (lunchStart !== null && lunchEnd !== null) {
      if (overlaps(slotStart, slotEnd, lunchStart, lunchEnd)) {
        continue; // Pula este horário pois está no almoço
      }
    }

    // Verifica conflito com outros agendamentos
    const conflict = bookings.some((b) => overlaps(slotStart, blockedEnd, b.start, b.end));
    if (!conflict) slots.push(toHHMM(slotStart));
  }

  return slots;
}
