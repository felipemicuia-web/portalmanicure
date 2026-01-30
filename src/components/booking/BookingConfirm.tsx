import { Professional, Service } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";

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
}

function formatPrice(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

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
}: BookingConfirmProps) {
  const roundedMinutes = totalMinutes > 0 ? Math.ceil(totalMinutes / 60) * 60 : 0;

  return (
    <div className="glass-panel p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold mb-1">Confirmar agendamento</h2>
          <p className="text-muted-foreground text-sm">
            Preencha seus dados e confirme.
          </p>
        </div>
        <Button variant="ghost" onClick={onPrev} className="gap-1">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </div>

      {/* Summary */}
      <div className="border border-border/50 bg-card/50 rounded-xl p-3 space-y-2">
        <div className="flex justify-between gap-2.5 py-1.5">
          <span className="text-muted-foreground">Profissional</span>
          <span className="font-bold">{professional?.name || "—"}</span>
        </div>
        <div className="flex justify-between gap-2.5 py-1.5">
          <span className="text-muted-foreground">Serviços</span>
          <span className="font-bold text-right">
            {selectedServices.length > 0 
              ? selectedServices.map(s => s.name).join(", ") 
              : "—"}
          </span>
        </div>
        <div className="flex justify-between gap-2.5 py-1.5">
          <span className="text-muted-foreground">Data/Hora</span>
          <span className="font-bold">
            {date && time ? `${date} ${time}` : "—"}
          </span>
        </div>
        <div className="flex justify-between gap-2.5 py-1.5">
          <span className="text-muted-foreground">Total</span>
          <span className="font-bold">
            {selectedServices.length > 0 
              ? `R$ ${formatPrice(totalPrice)} • ${formatDuration(roundedMinutes)}` 
              : "—"}
          </span>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="clientName" className="text-sm">Nome</Label>
            <Input
              id="clientName"
              type="text"
              value={clientName}
              onChange={(e) => onClientNameChange(e.target.value)}
              placeholder="Seu nome"
              required
              className="bg-input border-border mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="clientPhone" className="text-sm">WhatsApp</Label>
            <Input
              id="clientPhone"
              type="tel"
              value={clientPhone}
              onChange={(e) => onClientPhoneChange(e.target.value)}
              placeholder="(11) 99999-9999"
              required
              className="bg-input border-border mt-1.5"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="notes" className="text-sm">Observações</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={3}
            placeholder="Alguma observação?"
            className="bg-input border-border mt-1.5"
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? "Confirmando..." : "Confirmar agendamento"}
          </Button>
        </div>
      </div>
    </div>
  );
}
