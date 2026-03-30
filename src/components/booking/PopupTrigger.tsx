import { useState, useEffect } from "react";
import { usePublicPopupSettings } from "@/hooks/usePopupSettings";
import { isValidUrl } from "@/hooks/usePaymentSettings";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ExternalLink } from "lucide-react";

export function PopupTrigger() {
  const { popup, loading } = usePublicPopupSettings();
  const [open, setOpen] = useState(false);

  // Auto-open when popup is loaded and enabled
  useEffect(() => {
    if (!loading && popup) {
      setOpen(true);
    }
  }, [loading, popup]);

  if (loading || !popup) return null;

  const hasModalImage = popup.modal_image_url && isValidUrl(popup.modal_image_url);
  const hasButton = popup.button_url && isValidUrl(popup.button_url) && popup.button_text;
  const hasContent = hasModalImage || popup.title || popup.description || hasButton;

  if (!hasContent) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[90dvh] overflow-y-auto p-0 gap-0">
        <DialogClose className="absolute right-3 top-3 z-10 rounded-full bg-background/80 backdrop-blur-sm p-1.5 shadow-sm border border-border/50 hover:bg-background transition-colors">
          <X className="w-4 h-4" />
        </DialogClose>

        {hasModalImage && (
          <div className="w-full">
            <img
              src={popup.modal_image_url}
              alt={popup.title || "Promoção"}
              className="w-full h-auto object-contain rounded-t-lg"
            />
          </div>
        )}

        <div className="p-4 sm:p-5 space-y-3">
          {popup.title && (
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">{popup.title}</DialogTitle>
            </DialogHeader>
          )}

          {popup.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {popup.description}
            </p>
          )}

          {hasButton && (
            <Button
              className="w-full gap-2"
              onClick={() => {
                if (popup.open_button_in_new_tab) {
                  window.open(popup.button_url, "_blank", "noopener,noreferrer");
                } else {
                  window.location.href = popup.button_url;
                }
              }}
            >
              <ExternalLink className="w-4 h-4" />
              {popup.button_text}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
