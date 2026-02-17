const DRAFT_KEY = "booking_draft";
const DRAFT_TTL_MS = 60 * 60 * 1000; // 60 minutes

export interface BookingDraft {
  professionalId: string;
  selectedServiceIds: string[];
  selectedDate: string;
  selectedTime: string;
  clientName: string;
  clientPhone: string;
  notes: string;
  currentStep: number;
  tenantId: string;
  couponCode?: string;
  savedAt: number;
}

function getKey(tenantId: string) {
  return `${DRAFT_KEY}_${tenantId}`;
}

export function saveBookingDraft(draft: Omit<BookingDraft, "savedAt">) {
  try {
    const data: BookingDraft = { ...draft, savedAt: Date.now() };
    localStorage.setItem(getKey(draft.tenantId), JSON.stringify(data));
  } catch {
    // localStorage unavailable
  }
}

export function loadBookingDraft(tenantId: string): BookingDraft | null {
  try {
    const raw = localStorage.getItem(getKey(tenantId));
    if (!raw) return null;
    const draft: BookingDraft = JSON.parse(raw);
    if (Date.now() - draft.savedAt > DRAFT_TTL_MS) {
      clearBookingDraft(tenantId);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export function clearBookingDraft(tenantId: string) {
  try {
    localStorage.removeItem(getKey(tenantId));
  } catch {
    // ignore
  }
}
