import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  /** If set, user must type this text to confirm */
  confirmText?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmText,
  variant = "default",
  onConfirm,
}: ConfirmDialogProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const canConfirm = confirmText ? input === confirmText : true;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      setInput("");
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setInput(""); }}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {variant === "destructive" && <AlertTriangle className="w-5 h-5 text-destructive" />}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left whitespace-pre-line">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {confirmText && (
          <div className="space-y-2 py-2">
            <p className="text-sm text-muted-foreground">
              Digite <strong className="text-foreground">{confirmText}</strong> para confirmar:
            </p>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={confirmText}
              autoFocus
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); handleConfirm(); }}
            disabled={!canConfirm || loading}
            className={variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {loading ? "Processando..." : "Confirmar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
