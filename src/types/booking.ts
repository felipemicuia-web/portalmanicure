export interface Professional {
  id: string;
  name: string;
  photo_url: string | null;
  active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  image_url: string | null;
  active: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string | null;
  professional_id: string;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  total_price: number;
  client_name: string;
  client_phone: string;
  notes: string | null;
  status: 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
}

export interface BookingService {
  id: string;
  booking_id: string;
  service_id: string;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  phone: string | null;
  notes: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingFormData {
  professionalId: string;
  selectedServices: string[];
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
  notes: string;
}

export const WORK_HOURS = {
  start: "09:00",
  end: "18:00",
  intervalMinutes: 10,
};
