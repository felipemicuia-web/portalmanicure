import { Professional, Service } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, User, Briefcase, Calendar, Wallet, Phone, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="glass-panel p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text">
            Confirmar agendamento
          </h2>
          <p className="text-muted-foreground text-sm">
            Revise seus dados e confirme abaixo.
          </p>
        </div>
        <Button variant="secondary" onClick={onPrev} className="gap-1.5 hover:bg-white/10">
          Voltar
        </Button>
      </div>

      {/* Summary Card */}
      <div className="relative border border-border/40 bg-gradient-to-br from-card/80 to-card/40 rounded-2xl p-5 space-y-4 overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative flex items-center justify-between gap-3 py-2 border-b border-border/30">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <span className="font-medium">Profissional</span>
          </div>
          <span className="font-bold text-right">{professional?.name || "—"}</span>
        </div>
        
        <div className="relative flex items-center justify-between gap-3 py-2 border-b border-border/30">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-secondary" />
            </div>
            <span className="font-medium">Serviços</span>
          </div>
          <span className="font-bold text-right max-w-[200px] truncate">
            {selectedServices.length > 0 
              ? selectedServices.map(s => s.name).join(", ") 
              : "—"}
          </span>
        </div>
        
        <div className="relative flex items-center justify-between gap-3 py-2 border-b border-border/30">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-accent" />
            </div>
            <span className="font-medium">Data/Hora</span>
          </div>
          <span className="font-bold text-right">
            {date && time ? `${formatDateDisplay(date)} - ${time}` : "—"}
          </span>
        </div>
        
        <div className="relative flex items-center justify-between gap-3 py-2">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-green-400" />
            </div>
            <span className="font-medium">Total</span>
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-green-400 to-green-300 bg-clip-text text-transparent">
            {selectedServices.length > 0 
              ? `R$ ${formatPrice(totalPrice)}` 
              : "—"}
          </span>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="glow-ring rounded-lg">
            <Label htmlFor="clientName" className="text-sm mb-2 block font-medium">Nome</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="clientName"
                type="text"
                value={clientName}
                onChange={(e) => onClientNameChange(e.target.value)}
                placeholder="Seu nome"
                required
                className="bg-input/80 border-border/60 pl-10 h-12 text-base transition-all duration-200"
              />
            </div>
          </div>
          <div className="glow-ring rounded-lg">
            <Label htmlFor="clientPhone" className="text-sm mb-2 block font-medium">WhatsApp</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="clientPhone"
                type="tel"
                value={clientPhone}
                onChange={(e) => onClientPhoneChange(e.target.value)}
                placeholder="(11) 99999-9999"
                required
                className="bg-input/80 border-border/60 pl-10 h-12 text-base transition-all duration-200"
              />
            </div>
          </div>
        </div>

        <div className="glow-ring rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <Label htmlFor="notes" className="text-sm font-medium">Observações</Label>
            <span className={cn(
              "text-xs transition-colors",
              notes.length > MAX_NOTES_LENGTH * 0.9 ? "text-destructive" : "text-muted-foreground"
            )}>
              {notes.length} / {MAX_NOTES_LENGTH}
            </span>
          </div>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            rows={4}
            placeholder="Alguma observação especial para o atendimento?"
            className="bg-input/80 border-border/60 resize-none text-base transition-all duration-200"
            maxLength={MAX_NOTES_LENGTH}
          />
        </div>

        {/* Success Message */}
        {isConfirmed && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-green-500/10 border border-green-500/30">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <span className="font-semibold text-green-400">Agendamento confirmado com sucesso!</span>
          </div>
        )}

        <div className="flex justify-end pt-3">
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || isConfirmed}
            className={cn(
              "px-8 h-12 font-bold text-base transition-all duration-300",
              !isSubmitting && !isConfirmed 
                ? "bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:scale-105"
                : "opacity-70"
            )}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Confirmando...
              </span>
            ) : (
              "Confirmar agendamento"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}