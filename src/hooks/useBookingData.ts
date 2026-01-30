import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Professional, Service, Booking, WORK_HOURS } from "@/types/booking";

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

  useEffect(() => {
    async function fetchTimes() {
      if (!professionalId || !date || totalMinutes <= 0) {
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

      const availableSlots = buildAvailableTimes(totalMinutes, busy);
      setTimes(availableSlots);
      setLoading(false);
    }

    fetchTimes();
  }, [professionalId, date, totalMinutes]);

  return { times, loading };
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

function buildAvailableTimes(totalServiceMinutes: number, bookings: { start: number; end: number }[]): string[] {
  const start = toMinutes(WORK_HOURS.start);
  const end = toMinutes(WORK_HOURS.end);

  const blockMinutes = 60;
  const roundedService = Math.ceil(totalServiceMinutes / blockMinutes) * blockMinutes;
  const step = blockMinutes + WORK_HOURS.intervalMinutes;

  if (step <= 0) return [];

  const slots: string[] = [];
  for (let t = start; t + roundedService <= end; t += step) {
    const slotStart = t;
    const slotEnd = t + roundedService;
    const blockedEnd = slotEnd + WORK_HOURS.intervalMinutes;

    const conflict = bookings.some((b) => overlaps(slotStart, blockedEnd, b.start, b.end));
    if (!conflict) slots.push(toHHMM(slotStart));
  }

  return slots;
}
