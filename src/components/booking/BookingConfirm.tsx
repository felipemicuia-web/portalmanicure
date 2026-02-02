import { Professional, Service } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, User, Briefcase, Calendar, Wallet, Phone, CheckCircle } from "lucide-react";

interface BookingConfirmProps {
  professional: Professional | undefined;
  selectedServices: Service[];
  date: string;
  time: string;
  totalMinutes: number;
  totalPrice: number;
  clientName: string;
  clientPhone: string;
  notes: string;
  onClientNameChange: (value: string) => void;
  onClientPhoneChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onPrev: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isConfirmed?: boolean;
}

function formatPrice(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "—";
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  
  if (dateStr === todayStr) {
    return "Hoje";
  }
  
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

const MAX_NOTES_LENGTH = 500;

export function BookingConfirm({
  professional,
  selectedServices,
  date,
  time,
  totalMinutes,
  totalPrice,
  clientName,
  clientPhone,
  notes,
  onClientNameChange,
  onClientPhoneChange,
  onNotesChange,
  onPrev,
  onSubmit,
  isSubmitting,
  isConfirmed = false,
}: BookingConfirmProps) {
  const handleNotesChange = (value: string) => {
    if (value.length <= MAX_NOTES_LENGTH) {
      onNotesChange(value);
    }
  };

  return (
    <div className="glass-panel p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold mb-1">Confirmar agendamento</h2>
          <p className="text-muted-foreground text-sm">
            Revise seus dados e confirme abaixo.
          </p>
        </div>
        <Button variant="secondary" onClick={onPrev} className="gap-1.5">
          Voltar
        </Button>
      </div>

      {/* Summary Card */}
      <div className="border border-border/50 bg-card/50 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 py-1">
          <div className="flex items-center gap-3 text-muted-foreground">
            <User className="w-4 h-4" />
            <span>Profissional</span>
          </div>
          <span className="font-semibold text-right">{professional?.name || "—"}</span>
        </div>
        
        <div className="flex items-center justify-between gap-3 py-1">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Briefcase className="w-4 h-4" />
            <span>Serviços</span>
          </div>
          <span className="font-semibold text-right">
            {selectedServices.length > 0 
              ? selectedServices.map(s => s.name).join(", ") 
              : "—"}
          </span>
        </div>
        
        <div className="flex items-center justify-between gap-3 py-1">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Data/Hora</span>
          </div>
          <span className="font-semibold text-right">
            {date && time ? `${formatDateDisplay(date)} - ${time}` : "—"}
          </span>
        </div>
        
        <div className="flex items-center justify-between gap-3 py-1">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Wallet className="w-4 h-4" />
            <span>Total</span>
          </div>
          <span className="font-semibold text-primary text-lg">
            {selectedServices.length > 0 
              ? `R$ ${formatPrice(totalPrice)}` 
              : "—"}
          </span>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="clientName" className="text-sm mb-1.5 block">Nome</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="clientName"
                type="text"
                value={clientName}
                onChange={(e) => onClientNameChange(e.target.value)}
                placeholder="Seu nome"
                required
                className="bg-input border-border pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="clientPhone" className="text-sm mb-1.5 block">WhatsApp</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="clientPhone"
                type="tel"
                value={clientPhone}
                onChange={(e) => onClientPhoneChange(e.target.value)}
                placeholder="(11) 99999-9999"
                required
                className="bg-input border-border pl-10"
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <Label htmlFor="notes" className="text-sm">Observações</Label>
            <span className="text-xs text-muted-foreground">
              {notes.length} / {MAX_NOTES_LENGTH}
            </span>
          </div>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            rows={3}
            placeholder="Alguma observação?"
            className="bg-input border-border resize-none"
            maxLength={MAX_NOTES_LENGTH}
          />
        </div>

        {/* Success Message */}
        {isConfirmed && (
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Agendamento confirmado.</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || isConfirmed}
            className="bg-primary hover:bg-primary/90 px-6"
          >
            {isSubmitting ? "Confirmando..." : "Confirmar agendamento"}
          </Button>
        </div>
      </div>
    </div>
  );
}