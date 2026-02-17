import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";

interface FollowButtonProps {
  professionalId: string;
  user: User | null;
  onFollowChange?: () => void;
  variant?: "default" | "compact";
}

export function FollowButton({ 
  professionalId, 
  user, 
  onFollowChange,
  variant = "default" 
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { tenantId } = useTenant();

  useEffect(() => {
    if (!user) {
      setIsFollowing(false);
      return;
    }

    const checkFollowing = async () => {
      const { data } = await supabase
        .rpc("is_following", { 
          p_user_id: user.id, 
          p_professional_id: professionalId 
        });
      
      setIsFollowing(!!data);
    };

    checkFollowing();
  }, [user, professionalId]);

  const handleToggleFollow = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para seguir profissionais.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("followers")
          .delete()
          .eq("user_id", user.id)
          .eq("professional_id", professionalId);

        if (error) throw error;

        setIsFollowing(false);
        toast({
          title: "Deixou de seguir",
          description: "Você deixou de seguir este profissional.",
        });
      } else {
        // Follow
        const { error } = await supabase
          .from("followers")
          .insert({
            user_id: user.id,
            professional_id: professionalId,
            tenant_id: tenantId!,
          });

        if (error) throw error;

        setIsFollowing(true);
        toast({
          title: "Seguindo!",
          description: "Você está seguindo este profissional.",
        });
      }

      onFollowChange?.();
    } catch (error) {
      logger.error("Follow toggle error:", error);
      toast({
        title: "Erro",
        description: "Não foi possível processar sua solicitação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (variant === "compact") {
    return (
      <Button
        variant={isFollowing ? "secondary" : "outline"}
        size="icon"
        onClick={handleToggleFollow}
        disabled={loading}
        className="shrink-0"
      >
        <Heart 
          className={`w-4 h-4 ${isFollowing ? "fill-primary text-primary" : ""}`} 
        />
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? "secondary" : "outline"}
      onClick={handleToggleFollow}
      disabled={loading}
      className="gap-2"
    >
      <Heart 
        className={`w-4 h-4 ${isFollowing ? "fill-primary text-primary" : ""}`} 
      />
      {isFollowing ? "Seguindo" : "Seguir"}
    </Button>
  );
}
