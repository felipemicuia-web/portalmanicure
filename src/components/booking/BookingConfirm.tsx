import { useState } from "react";
import { Professional, Service } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, User, Briefcase, Calendar, Wallet, Phone, CheckCircle, Ticket, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AppliedCoupon {
  coupon_id: string;
  code: string;
  discount_type: "fixed" | "percentage";
  discount_value: number;
  discount_amount: number;
  final_total: number;
}

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
  appliedCoupon: AppliedCoupon | null;
  onApplyCoupon: (code: string) => Promise<AppliedCoupon | null>;
  onRemoveCoupon: () => void;
  couponLoading: boolean;
  couponError: string | null;
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
  return `${day}/${month}`;
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
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  couponLoading,
  couponError,
}: BookingConfirmProps) {
  const [couponCode, setCouponCode] = useState("");

  const handleNotesChange = (value: string) => {
    if (value.length <= MAX_NOTES_LENGTH) {
      onNotesChange(value);
    }
  };

  const handleApplyCoupon = async () => {
    const trimmed = couponCode.trim();
    if (!trimmed) return;
    const result = await onApplyCoupon(trimmed);
    if (result) setCouponCode("");
  };

  const displayTotal = appliedCoupon ? appliedCoupon.final_total : totalPrice;

  return (
    <div className="glass-panel p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text">
            Confirmar
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Revise e confirme seu agendamento.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onPrev} className="gap-1 hover:bg-white/10 flex-shrink-0 h-9 px-2 sm:px-3">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden xs:inline">Voltar</span>
        </Button>
      </div>

      {/* Summary Card - Compact on mobile */}
      <div className="relative border border-border/40 bg-gradient-to-br from-card/80 to-card/40 rounded-xl sm:rounded-2xl p-3 sm:p-5 space-y-3 sm:space-y-4 overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative flex items-center justify-between gap-2 sm:gap-3 py-2 border-b border-border/30">
          <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            </div>
            <span className="font-medium text-xs sm:text-sm">Profissional</span>
          </div>
          <span className="font-bold text-right text-sm sm:text-base truncate">{professional?.name || "—"}</span>
        </div>
        
        <div className="relative flex items-center justify-between gap-2 sm:gap-3 py-2 border-b border-border/30">
          <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary" />
            </div>
            <span className="font-medium text-xs sm:text-sm">Serviços</span>
          </div>
          <span className="font-bold text-right text-sm sm:text-base max-w-[140px] sm:max-w-[200px] truncate">
            {selectedServices.length > 0 
              ? `${selectedServices.length} serviço${selectedServices.length > 1 ? 's' : ''}`
              : "—"}
          </span>
        </div>
        
        <div className="relative flex items-center justify-between gap-2 sm:gap-3 py-2 border-b border-border/30">
          <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
            </div>
            <span className="font-medium text-xs sm:text-sm">Data/Hora</span>
          </div>
          <span className="font-bold text-right text-sm sm:text-base">
            {date && time ? `${formatDateDisplay(date)} - ${time}` : "—"}
          </span>
        </div>
        
        <div className="relative flex items-center justify-between gap-2 sm:gap-3 py-2">
          <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            </div>
            <span className="font-medium text-xs sm:text-sm">
              {appliedCoupon ? "Subtotal" : "Total"}
            </span>
          </div>
          <span className={cn(
            "font-bold text-sm sm:text-base",
            appliedCoupon ? "text-muted-foreground line-through" : "text-lg sm:text-xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
          )}>
            {selectedServices.length > 0 
              ? `R$ ${formatPrice(totalPrice)}` 
              : "—"}
          </span>
        </div>

        {appliedCoupon && (
          <>
            <div className="relative flex items-center justify-between gap-2 sm:gap-3 py-2 border-t border-border/30">
              <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-xs sm:text-sm">Desconto</span>
                  <span className="text-[10px] text-muted-foreground">
                    {appliedCoupon.code} ({appliedCoupon.discount_type === "percentage" ? `${appliedCoupon.discount_value}%` : `R$ ${formatPrice(appliedCoupon.discount_value)}`})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-sm sm:text-base text-primary">
                  -R$ {formatPrice(appliedCoupon.discount_amount)}
                </span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemoveCoupon}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="relative flex items-center justify-between gap-2 sm:gap-3 py-2 border-t border-border/30">
              <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                </div>
                <span className="font-medium text-xs sm:text-sm">Total Final</span>
              </div>
              <span className="font-bold text-lg sm:text-xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                R$ {formatPrice(displayTotal)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Coupon Input */}
      {!isConfirmed && (
        <div className="border border-border/40 bg-card/40 rounded-xl p-3 sm:p-4 space-y-2">
          <Label className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
            <Ticket className="w-3.5 h-3.5" />
            Cupom de desconto
          </Label>
          {!appliedCoupon ? (
            <div className="flex gap-2">
              <Input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="CODIGO10"
                className="font-mono uppercase bg-input/80 border-border/60 h-10 text-sm"
                maxLength={20}
                onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
              />
              <Button
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                variant="outline"
                className="h-10 px-4 shrink-0"
              >
                {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-primary/10 rounded-lg px-3 py-2">
              <span className="text-sm font-mono font-semibold text-primary">{appliedCoupon.code}</span>
              <Button variant="ghost" size="sm" onClick={onRemoveCoupon} className="h-7 px-2 text-muted-foreground">
                <X className="w-3.5 h-3.5 mr-1" />
                Remover
              </Button>
            </div>
          )}
          {couponError && (
            <p className="text-xs text-destructive">{couponError}</p>
          )}
        </div>
      )}

      {/* Form - Stack on mobile */}
      <div className="space-y-4 sm:space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          <div className="glow-ring rounded-lg">
            <Label htmlFor="clientName" className="text-xs sm:text-sm mb-1.5 sm:mb-2 block font-medium">Nome</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="clientName"
                type="text"
                value={clientName}
                onChange={(e) => onClientNameChange(e.target.value)}
                placeholder="Seu nome"
                required
                className="bg-input/80 border-border/60 pl-10 h-11 sm:h-12 text-base transition-all duration-200"
              />
            </div>
          </div>
          <div className="glow-ring rounded-lg">
            <Label htmlFor="clientPhone" className="text-xs sm:text-sm mb-1.5 sm:mb-2 block font-medium">WhatsApp</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="clientPhone"
                type="tel"
                value={clientPhone}
                onChange={(e) => onClientPhoneChange(e.target.value)}
                placeholder="(11) 99999-9999"
                required
                className="bg-input/80 border-border/60 pl-10 h-11 sm:h-12 text-base transition-all duration-200"
              />
            </div>
          </div>
        </div>

        <div className="glow-ring rounded-lg">
          <div className="flex justify-between items-center mb-1.5 sm:mb-2">
            <Label htmlFor="notes" className="text-xs sm:text-sm font-medium">Observações</Label>
            <span className={cn(
              "text-[10px] sm:text-xs transition-colors",
              notes.length > MAX_NOTES_LENGTH * 0.9 ? "text-destructive" : "text-muted-foreground"
            )}>
              {notes.length}/{MAX_NOTES_LENGTH}
            </span>
          </div>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            rows={3}
            placeholder="Alguma observação? (opcional)"
            className="bg-input/80 border-border/60 resize-none text-base transition-all duration-200"
            maxLength={MAX_NOTES_LENGTH}
          />
        </div>

        {/* Success Message */}
        {isConfirmed && (
          <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-green-500/10 border border-green-500/30">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
            </div>
            <span className="font-semibold text-green-400 text-sm sm:text-base">Agendamento confirmado!</span>
          </div>
        )}

        <div className="flex justify-end pt-2 sm:pt-3">
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || isConfirmed}
            className={cn(
              "px-6 sm:px-8 h-12 sm:h-14 font-bold text-sm sm:text-base transition-all duration-300 w-full sm:w-auto",
              !isSubmitting && !isConfirmed 
                ? "bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/30 hover:shadow-primary/40 sm:hover:scale-105"
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