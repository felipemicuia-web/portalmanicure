import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { useBookingData, useAvailableTimes } from "@/hooks/useBookingData";
import { useTenant } from "@/contexts/TenantContext";
import { BookingTopbar } from "@/components/booking/BookingTopbar";
import { HeroHeader } from "@/components/booking/HeroHeader";
import { BookingStepper } from "@/components/booking/BookingStepper";
import { ProfessionalSelect } from "@/components/booking/ProfessionalSelect";
import { ServiceList } from "@/components/booking/ServiceList";
import { DateTimeSelect } from "@/components/booking/DateTimeSelect";
import { BookingConfirm, AppliedCoupon } from "@/components/booking/BookingConfirm";
import { ProfilePage } from "@/components/profile/ProfilePage";
import { MyBookings } from "@/components/booking/MyBookings";
import { logger } from "@/lib/logger";
import { normalizePhone, isValidBrazilianPhone, isValidName } from "@/lib/validation";
import { saveBookingDraft, loadBookingDraft, clearBookingDraft } from "@/lib/bookingDraft";

function getTodayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function BookingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState<"booking" | "profile" | "my-bookings">("booking");
  
  // Booking state
  const [currentStep, setCurrentStep] = useState(1);
  const [professionalId, setProfessionalId] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [selectedTime, setSelectedTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalMessage, setGlobalMessage] = useState<{ text: string; type: "ok" | "bad" } | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const { professionals, services, loading: dataLoading } = useBookingData();
  const [draftRestored, setDraftRestored] = useState(false);
  const [professionalServiceIds, setProfessionalServiceIds] = useState<string[]>([]);

  // Fetch services linked to selected professional
  useEffect(() => {
    async function fetchProfessionalServices() {
      if (!professionalId) {
        setProfessionalServiceIds([]);
        return;
      }
      const { data } = await supabase
        .from("professional_services")
        .select("service_id")
        .eq("professional_id", professionalId);
      
      if (data && data.length > 0) {
        setProfessionalServiceIds(data.map(d => d.service_id));
      } else {
        // If no services linked, show all (backwards compatibility)
        setProfessionalServiceIds(services.map(s => s.id));
      }
    }
    fetchProfessionalServices();
  }, [professionalId, services]);

  // Filter services by professional
  const filteredServices = useMemo(
    () => services.filter(s => professionalServiceIds.includes(s.id)),
    [services, professionalServiceIds]
  );

  // Calculate totals
  const selectedServices = useMemo(
    () => filteredServices.filter((s) => selectedServiceIds.includes(s.id)),
    [filteredServices, selectedServiceIds]
  );

  const totalMinutes = useMemo(
    () => selectedServices.reduce((acc, s) => acc + s.duration_minutes, 0),
    [selectedServices]
  );

  const totalPrice = useMemo(
    () => selectedServices.reduce((acc, s) => acc + Number(s.price), 0),
    [selectedServices]
  );

  // Available times
  const { times: availableTimes, loading: timesLoading } = useAvailableTimes(
    professionalId,
    selectedDate,
    totalMinutes
  );

  // Auth - onAuthStateChange already fires INITIAL_SESSION
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Restore booking draft after login
  useEffect(() => {
    if (!tenantId || draftRestored || dataLoading) return;
    const draft = loadBookingDraft(tenantId);
    if (draft) {
      setProfessionalId(draft.professionalId);
      setSelectedServiceIds(draft.selectedServiceIds);
      setSelectedDate(draft.selectedDate);
      setSelectedTime(draft.selectedTime);
      if (draft.clientName) setClientName(draft.clientName);
      if (draft.clientPhone) setClientPhone(draft.clientPhone);
      if (draft.notes) setNotes(draft.notes);
      setCurrentStep(draft.currentStep);
      setActivePage("booking");
    }
    setDraftRestored(true);
  }, [tenantId, draftRestored, dataLoading]);

  // Load profile data when user is logged in
  useEffect(() => {
    async function loadProfile() {
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        if (data.name && !clientName) setClientName(data.name);
        if (data.phone && !clientPhone) {
          const { formatPhone } = await import("@/lib/validation");
          setClientPhone(formatPhone(data.phone));
        }
        if (data.notes && !notes) setNotes(data.notes);
      }
    }

    loadProfile();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Até logo!",
      description: "Você saiu da sua conta",
    });
  };

  // Validation
  const validateStep = (fromStep: number, toStep: number): boolean => {
    setGlobalMessage(null);

    if (fromStep === 1 && toStep > 1) {
      if (!professionalId) {
        setGlobalMessage({ text: "Selecione um profissional para continuar.", type: "bad" });
        return false;
      }
    }

    if (fromStep === 2 && toStep > 2) {
      if (selectedServiceIds.length === 0) {
        setGlobalMessage({ text: "Selecione pelo menos 1 serviço para continuar.", type: "bad" });
        return false;
      }
    }

    if (fromStep === 3 && toStep > 3) {
      if (!selectedDate) {
        setGlobalMessage({ text: "Selecione uma data para continuar.", type: "bad" });
        return false;
      }
      if (!selectedTime) {
        setGlobalMessage({ text: "Selecione um horário para continuar.", type: "bad" });
        return false;
      }
    }

    return true;
  };

  const goToStep = (step: number) => {
    if (step < currentStep || validateStep(currentStep, step)) {
      setCurrentStep(step);
      setGlobalMessage(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    // Reset time and coupon when services change
    setSelectedTime("");
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const handleApplyCoupon = async (code: string): Promise<AppliedCoupon | null> => {
    setCouponLoading(true);
    setCouponError(null);
    try {
      const { data, error } = await supabase.functions.invoke("validate-coupon", {
        body: { code, tenant_id: tenantId, total_price: totalPrice, action: "validate" },
      });
      if (error) throw error;
      if (!data.valid) {
        setCouponError(data.error || "Cupom inválido");
        setCouponLoading(false);
        return null;
      }
      const coupon: AppliedCoupon = {
        coupon_id: data.coupon_id,
        code: data.code,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        discount_amount: data.discount_amount,
        final_total: data.final_total,
      };
      setAppliedCoupon(coupon);
      setCouponLoading(false);
      return coupon;
    } catch (err) {
      logger.error("Coupon validation error:", err);
      setCouponError("Erro ao validar cupom");
      setCouponLoading(false);
      return null;
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const handleSubmit = async () => {
    if (!user) {
      // Save draft before redirecting to auth
      if (tenantId) {
        saveBookingDraft({
          professionalId,
          selectedServiceIds,
          selectedDate,
          selectedTime,
          clientName,
          clientPhone,
          notes,
          currentStep: 4,
          tenantId,
        });
      }
      toast({
        title: "Login necessário",
        description: "Faça login para confirmar o agendamento. Seus dados serão preservados.",
      });
      navigate("/auth?redirect=/");
      return;
    }

    // Check if user is blocked
    const { data: profile } = await supabase
      .from("profiles")
      .select("blocked")
      .eq("user_id", user.id)
      .single();

    if (profile?.blocked) {
      toast({
        title: "Conta bloqueada",
        description: "Sua conta está bloqueada. Entre em contato com o estabelecimento.",
        variant: "destructive",
      });
      return;
    }

    // Validate form
    const name = clientName.trim();
    const phoneDigits = normalizePhone(clientPhone);

    if (!isValidName(name)) {
      setGlobalMessage({ text: "Informe um nome válido (mínimo 2 caracteres, sem números).", type: "bad" });
      return;
    }

    if (!isValidBrazilianPhone(phoneDigits)) {
      setGlobalMessage({ text: "WhatsApp inválido. Use formato: (11) 98765-4321", type: "bad" });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Server-side slot validation: check if the time is still available
      const { data: existingBookings } = await supabase
        .from("bookings")
        .select("booking_time, duration_minutes")
        .eq("professional_id", professionalId)
        .eq("booking_date", selectedDate)
        .neq("status", "cancelled");

      const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
      const newStart = toMin(selectedTime);
      const newEnd = newStart + totalMinutes;
      const hasConflict = (existingBookings || []).some((b) => {
        const bStart = toMin(b.booking_time);
        const bEnd = bStart + Number(b.duration_minutes || 0);
        return newStart < bEnd && bStart < newEnd;
      });

      if (hasConflict) {
        toast({
          title: "Horário indisponível",
          description: "Este horário já foi reservado. Escolha outro horário.",
          variant: "destructive",
        });
        setCurrentStep(3);
        setSelectedTime("");
        setIsSubmitting(false);
        return;
      }

      // 2. Revalidate and apply coupon server-side if one is applied
      let couponData: AppliedCoupon | null = null;
      if (appliedCoupon) {
        const { data, error: fnError } = await supabase.functions.invoke("validate-coupon", {
          body: { code: appliedCoupon.code, tenant_id: tenantId, total_price: totalPrice, action: "apply" },
        });
        if (fnError || !data?.valid) {
          setAppliedCoupon(null);
          setCouponError(data?.error || "Cupom inválido ao confirmar. Tente novamente.");
          setIsSubmitting(false);
          return;
        }
        couponData = {
          coupon_id: data.coupon_id,
          code: data.code,
          discount_type: data.discount_type,
          discount_value: data.discount_value,
          discount_amount: data.discount_amount,
          final_total: data.final_total,
        };
      }

      const finalPrice = couponData ? couponData.final_total : totalPrice;

      // 3. Create booking (unique index prevents duplicates at DB level)
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          professional_id: professionalId,
          booking_date: selectedDate,
          booking_time: selectedTime,
          duration_minutes: totalMinutes,
          total_price: finalPrice,
          client_name: name,
          client_phone: phoneDigits,
          notes: notes.trim() || null,
          tenant_id: tenantId,
          coupon_id: couponData?.coupon_id || null,
          coupon_code: couponData?.code || null,
          discount_type: couponData?.discount_type || null,
          discount_value: couponData?.discount_value || 0,
          discount_amount: couponData?.discount_amount || 0,
        })
        .select()
        .single();

      if (bookingError) {
        // Handle unique constraint violation (race condition)
        if (bookingError.code === "23505") {
          toast({
            title: "Horário indisponível",
            description: "Este horário acabou de ser reservado por outro cliente. Escolha outro.",
            variant: "destructive",
          });
          setCurrentStep(3);
          setSelectedTime("");
          setIsSubmitting(false);
          return;
        }
        throw bookingError;
      }

      // Record coupon usage
      if (couponData) {
        await supabase.from("coupon_usage").insert({
          coupon_id: couponData.coupon_id,
          booking_id: booking.id,
          user_id: user.id,
          tenant_id: tenantId,
        });
      }

      // Create booking services
      const bookingServices = selectedServiceIds.map((serviceId) => ({
        booking_id: booking.id,
        service_id: serviceId,
        tenant_id: tenantId,
      }));

      const { error: servicesError } = await supabase
        .from("booking_services")
        .insert(bookingServices);

      if (servicesError) throw servicesError;

      // Update profile name and phone only (not notes - those are booking-specific)
      await supabase
        .from("profiles")
        .upsert({ user_id: user.id, name, phone: phoneDigits, tenant_id: tenantId }, { onConflict: "user_id" });

      toast({
        title: "Agendamento confirmado!",
        description: `${selectedDate} às ${selectedTime}`,
      });

      // Clear draft and reset form
      if (tenantId) clearBookingDraft(tenantId);
      setCurrentStep(1);
      setProfessionalId("");
      setSelectedServiceIds([]);
      setSelectedTime("");
      setNotes("");
      setAppliedCoupon(null);
      setCouponError(null);
      setGlobalMessage({ text: "Agendamento confirmado com sucesso!", type: "ok" });
    } catch (error) {
      logger.error("Booking error:", error);
      toast({
        title: "Erro",
        description: "Não foi possível confirmar o agendamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProfessional = professionals.find((p) => p.id === professionalId);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="galaxy-bg" />
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin relative z-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="galaxy-bg" />
      
      <div className="relative z-10">
        <HeroHeader
          user={user}
          activePage={activePage}
          onPageChange={setActivePage}
          onLogout={handleLogout}
        />

        <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {activePage === "booking" && (
            <>
              <BookingStepper currentStep={currentStep} onStepClick={goToStep} />

              {globalMessage && (
                <div
                  className={`mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm ${
                    globalMessage.type === "ok"
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-destructive/20 text-destructive border border-destructive/30"
                  }`}
                >
                  {globalMessage.text}
                </div>
              )}

              <div className="mt-3 sm:mt-4">
                {currentStep === 1 && (
                  <ProfessionalSelect
                    professionals={professionals}
                    selectedId={professionalId}
                    onSelect={(id) => {
                      if (id !== professionalId) {
                        setProfessionalId(id);
                        setSelectedServiceIds([]);
                        setSelectedTime("");
                        setAppliedCoupon(null);
                      }
                    }}
                    onNext={() => goToStep(2)}
                  />
                )}

                {currentStep === 2 && (
                  <ServiceList
                    services={filteredServices}
                    selectedIds={selectedServiceIds}
                    onToggle={toggleService}
                    onPrev={() => goToStep(1)}
                    onNext={() => goToStep(3)}
                  />
                )}

                {currentStep === 3 && (
                  <DateTimeSelect
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    availableTimes={availableTimes}
                    timesLoading={timesLoading}
                    professionalId={professionalId}
                    onDateChange={(d) => {
                      setSelectedDate(d);
                      setSelectedTime("");
                    }}
                    onTimeChange={setSelectedTime}
                    onPrev={() => goToStep(2)}
                    onNext={() => goToStep(4)}
                  />
                )}

                {currentStep === 4 && (
                  <BookingConfirm
                    professional={selectedProfessional}
                    selectedServices={selectedServices}
                    date={selectedDate}
                    time={selectedTime}
                    totalMinutes={totalMinutes}
                    totalPrice={totalPrice}
                    clientName={clientName}
                    clientPhone={clientPhone}
                    notes={notes}
                    onClientNameChange={setClientName}
                    onClientPhoneChange={setClientPhone}
                    onNotesChange={setNotes}
                    onPrev={() => goToStep(3)}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    appliedCoupon={appliedCoupon}
                    onApplyCoupon={handleApplyCoupon}
                    onRemoveCoupon={handleRemoveCoupon}
                    couponLoading={couponLoading}
                    couponError={couponError}
                  />
                )}
              </div>
            </>
          )}

          {activePage === "profile" && user && (
            <ProfilePage user={user} />
          )}

          {activePage === "my-bookings" && user && (
            <MyBookings user={user} />
          )}

          <footer className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground text-center sm:text-left">
            <span>© {new Date().getFullYear()} Agendamento Manicure</span>
            <span className="hidden sm:inline">Sistema de agendamento online</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
