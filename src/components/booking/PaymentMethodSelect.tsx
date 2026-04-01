import { usePublicPaymentMethods } from "@/hooks/usePaymentMethods";
import { CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentMethodSelectProps {
  selected: string;
  onChange: (value: string) => void;
}

export function PaymentMethodSelect({ selected, onChange }: PaymentMethodSelectProps) {
  const { methods, loading } = usePublicPaymentMethods();

  if (loading || methods.length === 0) return null;

  return (
    <div className="border border-border/40 bg-card/40 rounded-xl p-3 sm:p-4 space-y-2.5">
      <label className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
        <CreditCard className="w-3.5 h-3.5" />
        Forma de pagamento
      </label>
      <div className="grid grid-cols-2 gap-2">
        {methods.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.name)}
            className={cn(
              "px-3 py-2.5 rounded-lg border text-xs sm:text-sm font-medium transition-all duration-200",
              selected === m.name
                ? "border-primary bg-primary/15 text-primary shadow-sm"
                : "border-border/50 bg-card/60 text-muted-foreground hover:border-primary/40 hover:bg-primary/5"
            )}
          >
            {m.name}
          </button>
        ))}
      </div>
    </div>
  );
}
