import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profile?: {
    name: string | null;
    avatar_url: string | null;
  } | null;
}

interface ReviewListProps {
  reviews: Review[];
}

export function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className="glass-panel p-4 sm:p-6">
        <h3 className="font-semibold text-base sm:text-lg mb-3">Avaliações</h3>
        <p className="text-muted-foreground text-sm">
          Este profissional ainda não possui avaliações.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4 sm:p-6">
      <h3 className="font-semibold text-base sm:text-lg mb-4">
        Avaliações ({reviews.length})
      </h3>
      
      <div className="space-y-4">
        {reviews.map((review) => {
          const name = review.profile?.name || "Usuário";
          const initials = name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <div key={review.id} className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10">
                  {review.profile?.avatar_url ? (
                    <AvatarImage src={review.profile.avatar_url} alt={name} />
                  ) : null}
                  <AvatarFallback className="text-xs">
                    {initials || <User className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-medium text-sm truncate">{name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(review.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>

                  {/* Stars */}
                  <div className="flex gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= review.rating
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>

                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
