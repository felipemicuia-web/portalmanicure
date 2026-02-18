import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  User as UserIcon, 
  Star, 
  Users, 
  Instagram,
  Calendar
} from "lucide-react";
import { FollowButton } from "@/components/professional/FollowButton";
import { ReviewList } from "@/components/professional/ReviewList";
import { ReviewForm } from "@/components/professional/ReviewForm";
import { ProfessionalServices } from "@/components/professional/ProfessionalServices";
import { ProfessionalGallery } from "@/components/professional/ProfessionalGallery";
import { useAdmin } from "@/hooks/useAdmin";

interface Professional {
  id: string;
  name: string;
  photo_url: string | null;
  bio: string | null;
  instagram: string | null;
  active: boolean;
}

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profile?: {
    name: string | null;
    avatar_url: string | null;
  };
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  image_url: string | null;
}

export default function ProfessionalProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const { isAdmin } = useAdmin(user);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    
    try {
      // Fetch professional
      const { data: profData, error: profError } = await supabase
        .from("professionals")
        .select("*")
        .eq("id", id)
        .eq("active", true)
        .single();

      if (profError || !profData) {
        toast({
          title: "Erro",
          description: "Profissional não encontrado.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setProfessional(profData);

      // Fetch services for this professional
      const { data: profServices } = await supabase
        .from("professional_services")
        .select("service_id")
        .eq("professional_id", id);

      if (profServices && profServices.length > 0) {
        const serviceIds = profServices.map(ps => ps.service_id);
        const { data: servicesData } = await supabase
          .from("services")
          .select("*")
          .in("id", serviceIds)
          .eq("active", true);
        
        setServices(servicesData || []);
      } else {
        // If no specific services, show all active services
        const { data: allServices } = await supabase
          .from("services")
          .select("*")
          .eq("active", true);
        
        setServices(allServices || []);
      }

      // Fetch reviews with profile info
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("*")
        .eq("professional_id", id)
        .order("created_at", { ascending: false });

      // Fetch profiles for reviews
      if (reviewsData && reviewsData.length > 0) {
        const userIds = [...new Set(reviewsData.map(r => r.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, name, avatar_url")
          .in("user_id", userIds);

        const reviewsWithProfiles = reviewsData.map(review => ({
          ...review,
          profile: profiles?.find(p => p.user_id === review.user_id) || null,
        }));

        setReviews(reviewsWithProfiles);
      } else {
        setReviews([]);
      }

      // Fetch follower count using RPC
      const { data: countData } = await supabase
        .rpc("get_follower_count", { p_professional_id: id });
      
      setFollowerCount(countData || 0);

      // Fetch average rating using RPC
      const { data: ratingData } = await supabase
        .rpc("get_average_rating", { p_professional_id: id });
      
      setAverageRating(Number(ratingData) || 0);

    } catch (error) {
      logger.error("Error fetching professional:", error);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  // Check if user can review (has a completed booking with this professional)
  const checkCanReview = useCallback(async () => {
    if (!user || !id) {
      setCanReview(false);
      return;
    }

    // Check if user has a booking with this professional
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("user_id", user.id)
      .eq("professional_id", id)
      .limit(1);

    // Check if user already reviewed this professional
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", user.id)
      .eq("professional_id", id)
      .is("booking_id", null)
      .limit(1);

    setCanReview(bookings && bookings.length > 0 && (!existingReview || existingReview.length === 0));
  }, [user, id]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    checkCanReview();
  }, [checkCanReview]);

  const handleReviewSubmitted = () => {
    fetchData();
    checkCanReview();
  };

  const handleBookNow = () => {
    navigate(`/?professional=${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="galaxy-bg" />
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin relative z-10" />
      </div>
    );
  }

  if (!professional) {
    return null;
  }

  const initials = professional.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <div className="galaxy-bg" />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 glass-panel border-b border-border/50">
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold text-base sm:text-lg truncate">
              Perfil do Profissional
            </h1>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Profile Card */}
          <div className="glass-panel p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              {/* Avatar */}
              <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-primary/30">
                {professional.photo_url ? (
                  <AvatarImage src={professional.photo_url} alt={professional.name} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-muted text-2xl sm:text-3xl font-bold">
                  {initials || <UserIcon className="w-10 h-10" />}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-bold mb-1">{professional.name}</h2>
                
                {professional.bio && (
                  <p className="text-muted-foreground text-sm mb-3">{professional.bio}</p>
                )}

                {/* Stats */}
                <div className="flex justify-center sm:justify-start gap-6 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 fill-current text-primary" />
                      <span className="font-bold">{averageRating > 0 ? averageRating.toFixed(1) : "-"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{reviews.length} avaliações</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="font-bold">{followerCount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">seguidores</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <FollowButton
                    professionalId={professional.id}
                    user={user}
                    onFollowChange={() => {
                      supabase.rpc("get_follower_count", { p_professional_id: professional.id })
                        .then(({ data }) => setFollowerCount(data || 0));
                    }}
                  />
                  
                  <Button
                    onClick={handleBookNow}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Agendar agora
                  </Button>

                  {professional.instagram && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(`https://instagram.com/${professional.instagram}`, "_blank")}
                    >
                      <Instagram className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Gallery */}
          {id && <ProfessionalGallery professionalId={id} user={user} />}

          {/* Review Form */}
          {canReview && id && (
            <ReviewForm
              professionalId={id}
              userId={user!.id}
              onSubmitted={handleReviewSubmitted}
            />
          )}

          {/* Reviews */}
          <ReviewList
            reviews={reviews}
            currentUserId={user?.id}
            isAdmin={isAdmin}
            onReviewDeleted={handleReviewSubmitted}
          />
        </main>
      </div>
    </div>
  );
}
