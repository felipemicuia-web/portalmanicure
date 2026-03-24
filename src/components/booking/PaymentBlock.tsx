import { usePublicPaymentSettings } from "@/hooks/usePaymentSettings";
import { Button } from "@/components/ui/button";
import { CreditCard, ExternalLink, AlertTriangle } from "lucide-react";

export function PaymentBlock() {
  const { paymentSettings, loading } = usePublicPaymentSettings();

  if (loading || !paymentSettings) return null;

  const handleClick = () => {
    if (paymentSettings.open_in_new_tab) {
      window.open(paymentSettings.payment_url, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = paymentSettings.payment_url;
    }
  };

  return (
    <div className="border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <CreditCard className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold text-sm sm:text-base">{paymentSettings.title}</h3>
      </div>

      {paymentSettings.description && (
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {paymentSettings.description}
        </p>
      )}

      {paymentSettings.warning_message && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 mt-0.5 shrink-0" />
          <p className="text-xs text-yellow-200/80">{paymentSettings.warning_message}</p>
        </div>
      )}

      <Button
        onClick={handleClick}
        variant="outline"
        className="w-full gap-2 border-primary/40 hover:bg-primary/10 h-11"
      >
        <ExternalLink className="w-4 h-4" />
        {paymentSettings.button_text}
      </Button>
    </div>
  );
}
