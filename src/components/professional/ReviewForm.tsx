import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";

interface ReviewFormProps {
  professionalId: string;
  userId: string;
  onSubmitted: () => void;
}

export function ReviewForm({ professionalId, userId, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        title: "Selecione uma nota",
        description: "Por favor, selecione de 1 a 5 estrelas.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("reviews")
        .insert({
          user_id: userId,
          professional_id: professionalId,
          rating,
          comment: comment.trim() || null,
        });

      if (error) throw error;

      toast({
        title: "Avaliação enviada!",
        description: "Obrigado por avaliar este profissional.",
      });

      setRating(0);
      setComment("");
      onSubmitted();
    } catch (error) {
      logger.error("Review submit error:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar sua avaliação.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel p-4 sm:p-6">
      <h3 className="font-semibold text-base sm:text-lg mb-4">Deixe sua avaliação</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating */}
        <div>
          <label className="text-sm text-muted-foreground block mb-2">
            Sua nota
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                    star <= (hoverRating || rating)
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="text-sm text-muted-foreground block mb-2">
            Comentário (opcional)
          </label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Conte sua experiência..."
            rows={3}
            className="bg-input border-border resize-none"
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? "Enviando..." : "Enviar avaliação"}
        </Button>
      </form>
    </div>
  );
}
