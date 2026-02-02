import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { useBookingData, useAvailableTimes } from "@/hooks/useBookingData";
import { BookingTopbar } from "@/components/booking/BookingTopbar";
import { BookingStepper } from "@/components/booking/BookingStepper";
import { ProfessionalSelect } from "@/components/booking/ProfessionalSelect";
import { ServiceList } from "@/components/booking/ServiceList";
import { DateTimeSelect } from "@/components/booking/DateTimeSelect";
import { BookingConfirm } from "@/components/booking/BookingConfirm";
import { ProfilePage } from "@/components/profile/ProfilePage";
import { MyBookings } from "@/components/booking/MyBookings";
import { logger } from "@/lib/logger";
import { normalizePhone, isValidBrazilianPhone, isValidName } from "@/lib/validation";

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

  const navigate = useNavigate();
  const { toast } = useToast();
  const { professionals, services, loading: dataLoading } = useBookingData();

  // Calculate totals
  const selectedServices = useMemo(
    () => services.filter((s) => selectedServiceIds.includes(s.id)),
    [services, selectedServiceIds]
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

  // Auth
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
        if (data.phone && !clientPhone) setClientPhone(data.phone);
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
    // Reset time when services change
    setSelectedTime("");
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para confirmar o agendamento.",
        variant: "destructive",
      });
      navigate("/auth");
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
      const roundedMinutes = Math.ceil(totalMinutes / 60) * 60;

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          professional_id: professionalId,
          booking_date: selectedDate,
          booking_time: selectedTime,
          duration_minutes: roundedMinutes,
          total_price: totalPrice,
          client_name: name,
          client_phone: phoneDigits,
          notes: notes.trim() || null,
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Create booking services
      const bookingServices = selectedServiceIds.map((serviceId) => ({
        booking_id: booking.id,
        service_id: serviceId,
      }));

      const { error: servicesError } = await supabase
        .from("booking_services")
        .insert(bookingServices);

      if (servicesError) throw servicesError;

      // Update profile
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existingProfile) {
        await supabase
          .from("profiles")
          .update({ name, phone: phoneDigits, notes: notes.trim() || null })
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("profiles")
          .insert({ user_id: user.id, name, phone: phoneDigits, notes: notes.trim() || null });
      }

      toast({
        title: "Agendamento confirmado!",
        description: `${selectedDate} às ${selectedTime}`,
      });

      // Reset form
      setCurrentStep(1);
      setProfessionalId("");
      setSelectedServiceIds([]);
      setSelectedTime("");
      setNotes("");
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
        <BookingTopbar
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
                    onSelect={setProfessionalId}
                    onNext={() => goToStep(2)}
                  />
                )}

                {currentStep === 2 && (
                  <ServiceList
                    services={services}
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
