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
  if (dateStr === todayStr) return "Hoje";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}`;
}

const MAX_NOTES_LENGTH = 500;

function SummaryRow({ icon: Icon, iconBg, label, children, border = true }: { icon: any; iconBg: string; label: string; children: React.ReactNode; border?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 py-3", border && "border-b border-border/20")}>
      <div className="flex items-center gap-3 text-muted-foreground min-w-0">
        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", iconBg)}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="font-medium text-xs sm:text-sm">{label}</span>
      </div>
      <div className="text-right min-w-0 flex-1">{children}</div>
    </div>
  );
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
    <div className="glass-panel space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">
            Confirmar
          </h2>
          <p className="text-muted-foreground text-sm">
            Revise e confirme seu agendamento
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onPrev} className="gap-1.5 hover:bg-muted/30 flex-shrink-0 h-9 px-3 rounded-xl">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
      </div>

      {/* Summary Card */}
      <div className="border border-border/20 bg-card/20 rounded-2xl p-4 sm:p-5 overflow-hidden">
        <SummaryRow icon={User} iconBg="bg-primary/15 text-primary" label="Profissional">
          <span className="font-bold text-sm sm:text-base truncate block">{professional?.name || "—"}</span>
        </SummaryRow>
        
        <SummaryRow icon={Briefcase} iconBg="bg-secondary/15 text-secondary" label="Serviços">
          {selectedServices.length > 0 
            ? selectedServices.map((s) => (
                <span key={s.id} className="font-bold text-sm sm:text-base block truncate">{s.name}</span>
              ))
            : <span className="font-bold">—</span>}
        </SummaryRow>
        
        <SummaryRow icon={Calendar} iconBg="bg-accent/15 text-accent" label="Data/Hora">
          <span className="font-bold text-sm sm:text-base">
            {date && time ? `${formatDateDisplay(date)} - ${time}` : "—"}
          </span>
        </SummaryRow>
        
        <SummaryRow icon={Wallet} iconBg="bg-primary/15 text-primary" label={appliedCoupon ? "Subtotal" : "Total"} border={!!appliedCoupon}>
          <span className={cn(
            "font-extrabold text-sm sm:text-base",
            appliedCoupon ? "text-muted-foreground line-through" : "text-lg sm:text-xl text-foreground"
          )}>
            {selectedServices.length > 0 ? `R$ ${formatPrice(totalPrice)}` : "—"}
          </span>
        </SummaryRow>

        {appliedCoupon && (
          <>
            <SummaryRow icon={Ticket} iconBg="bg-primary/15 text-primary" label="Desconto">
              <div className="flex items-center justify-end gap-1">
                <span className="font-bold text-sm text-primary">
                  -R$ {formatPrice(appliedCoupon.discount_amount)}
                </span>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg" onClick={onRemoveCoupon}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </SummaryRow>
            <SummaryRow icon={Wallet} iconBg="bg-primary/15 text-primary" label="Total Final" border={false}>
              <span className="font-extrabold text-lg sm:text-xl text-foreground">
                R$ {formatPrice(displayTotal)}
              </span>
            </SummaryRow>
          </>
        )}
      </div>

      {/* Coupon Input */}
      {!isConfirmed && (
        <div className="border border-border/20 bg-card/20 rounded-2xl p-4 space-y-2">
          <Label className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
            <Ticket className="w-3.5 h-3.5" />
            Cupom de desconto
          </Label>
          {!appliedCoupon ? (
            <div className="flex gap-2">
              <Input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="CODIGO10"
                className="font-mono uppercase bg-muted/15 border-border/30 h-11 text-sm rounded-xl"
                maxLength={20}
                onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
              />
              <Button
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                variant="outline"
                className="h-11 px-5 shrink-0 rounded-xl border-border/30"
              >
                {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-primary/8 rounded-xl px-4 py-2.5">
              <span className="text-sm font-mono font-bold text-primary">{appliedCoupon.code}</span>
              <Button variant="ghost" size="sm" onClick={onRemoveCoupon} className="h-7 px-2 text-muted-foreground rounded-lg">
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

      {/* Form */}
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          <div>
            <Label htmlFor="clientName" className="text-xs sm:text-sm mb-2 block font-semibold text-muted-foreground uppercase tracking-wider">Nome</Label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <Input
                id="clientName"
                type="text"
                value={clientName}
                onChange={(e) => onClientNameChange(e.target.value)}
                placeholder="Seu nome"
                required
                className="bg-muted/15 border-border/30 pl-11 h-12 text-base rounded-xl"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="clientPhone" className="text-xs sm:text-sm mb-2 block font-semibold text-muted-foreground uppercase tracking-wider">WhatsApp</Label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <Input
                id="clientPhone"
                type="tel"
                value={clientPhone}
                onChange={(e) => onClientPhoneChange(e.target.value)}
                placeholder="(11) 99999-9999"
                required
                className="bg-muted/15 border-border/30 pl-11 h-12 text-base rounded-xl"
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <Label htmlFor="notes" className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider">Observações</Label>
            <span className={cn(
              "text-[10px] sm:text-xs transition-colors",
              notes.length > MAX_NOTES_LENGTH * 0.9 ? "text-destructive" : "text-muted-foreground/50"
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
            className="bg-muted/15 border-border/30 resize-none text-base rounded-xl"
            maxLength={MAX_NOTES_LENGTH}
          />
        </div>

        {/* Success */}
        {isConfirmed && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
            <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <span className="font-bold text-green-400 text-sm sm:text-base">Agendamento confirmado!</span>
          </div>
        )}

        <div className="pt-2">
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || isConfirmed}
            className={cn(
              "w-full h-14 font-bold text-base rounded-2xl transition-all duration-300",
              !isSubmitting && !isConfirmed 
                ? "btn-glow bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 hover:shadow-primary/30"
                : "opacity-50"
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
