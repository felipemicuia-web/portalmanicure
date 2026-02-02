import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User as UserIcon, Star, ChevronRight } from "lucide-react";
import { FollowButton } from "./FollowButton";

interface Professional {
  id: string;
  name: string;
  photo_url: string | null;
}

interface FollowingListProps {
  user: User;
}

export function FollowingList({ user }: FollowingListProps) {
  const [following, setFollowing] = useState<Professional[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchFollowing = async () => {
    setLoading(true);

    // Fetch professionals the user is following
    const { data: followData } = await supabase
      .from("followers")
      .select("professional_id")
      .eq("user_id", user.id);

    if (followData && followData.length > 0) {
      const professionalIds = followData.map(f => f.professional_id);

      const { data: professionals } = await supabase
        .from("professionals")
        .select("id, name, photo_url")
        .in("id", professionalIds)
        .eq("active", true);

      setFollowing(professionals || []);

      // Fetch ratings for each professional
      const ratingsMap: Record<string, number> = {};
      for (const profId of professionalIds) {
        const { data: ratingData } = await supabase
          .rpc("get_average_rating", { p_professional_id: profId });
        ratingsMap[profId] = Number(ratingData) || 0;
      }
      setRatings(ratingsMap);
    } else {
      setFollowing([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchFollowing();
  }, [user.id]);

  if (loading) {
    return (
      <div className="glass-panel p-4 sm:p-6">
        <h3 className="font-semibold text-base sm:text-lg mb-4">Seguindo</h3>
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (following.length === 0) {
    return (
      <div className="glass-panel p-4 sm:p-6">
        <h3 className="font-semibold text-base sm:text-lg mb-3">Seguindo</h3>
        <p className="text-muted-foreground text-sm">
          Você ainda não está seguindo nenhum profissional.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4 sm:p-6">
      <h3 className="font-semibold text-base sm:text-lg mb-4">
        Seguindo ({following.length})
      </h3>
      
      <div className="space-y-2">
        {following.map((prof) => {
          const initials = prof.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          const rating = ratings[prof.id] || 0;

          return (
            <div
              key={prof.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
            >
              <Avatar 
                className="w-12 h-12 cursor-pointer"
                onClick={() => navigate(`/professional/${prof.id}`)}
              >
                {prof.photo_url ? (
                  <AvatarImage src={prof.photo_url} alt={prof.name} className="object-cover" />
                ) : null}
                <AvatarFallback>
                  {initials || <UserIcon className="w-5 h-5" />}
                </AvatarFallback>
              </Avatar>

              <div 
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => navigate(`/professional/${prof.id}`)}
              >
                <h4 className="font-medium text-sm truncate">{prof.name}</h4>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="w-3 h-3 fill-current text-primary" />
                  <span>{rating > 0 ? rating.toFixed(1) : "-"}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <FollowButton
                  professionalId={prof.id}
                  user={user}
                  onFollowChange={fetchFollowing}
                  variant="compact"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/professional/${prof.id}`)}
                  className="shrink-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
