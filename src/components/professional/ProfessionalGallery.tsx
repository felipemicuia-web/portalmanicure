import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { formatDateBR } from "@/lib/dateFormat";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Heart,
  MessageCircle,
  Send,
  Trash2,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Photo {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    name: string | null;
    avatar_url: string | null;
  } | null;
}

interface ProfessionalGalleryProps {
  professionalId: string;
  user: User | null;
  isAdmin?: boolean;
}

export function ProfessionalGallery({ professionalId, user, isAdmin }: ProfessionalGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [deleteCommentTarget, setDeleteCommentTarget] = useState<string | null>(null);
  const [deletingComment, setDeletingComment] = useState(false);
  const { toast } = useToast();
  const { tenantId } = useTenant();

  const selectedPhoto = selectedIndex >= 0 ? photos[selectedIndex] : null;

  const fetchPhotos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("professional_photos")
      .select("*")
      .eq("professional_id", professionalId)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching photos:", error);
    } else {
      setPhotos(data || []);

      if (data && data.length > 0) {
        const counts: Record<string, number> = {};
        const likes: Record<string, boolean> = {};

        for (const photo of data) {
          const { count } = await supabase
            .from("photo_likes")
            .select("*", { count: "exact", head: true })
            .eq("photo_id", photo.id);

          counts[photo.id] = count || 0;

          if (user) {
            const { data: likeData } = await supabase
              .from("photo_likes")
              .select("id")
              .eq("photo_id", photo.id)
              .eq("user_id", user.id)
              .maybeSingle();

            likes[photo.id] = !!likeData;
          }
        }

        setLikeCounts(counts);
        setUserLikes(likes);
      }
    }
    setLoading(false);
  };

  const fetchComments = async (photoId: string) => {
    setLoadingComments(true);
    const { data, error } = await supabase
      .from("photo_comments")
      .select("*")
      .eq("photo_id", photoId)
      .order("created_at", { ascending: true });

    if (error) {
      logger.error("Error fetching comments:", error);
      setComments([]);
    } else if (data && data.length > 0) {
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url")
        .in("user_id", userIds);

      const commentsWithProfiles = data.map((comment) => ({
        ...comment,
        profile: profiles?.find((p) => p.user_id === comment.user_id) || null,
      }));

      setComments(commentsWithProfiles);
    } else {
      setComments([]);
    }
    setLoadingComments(false);
  };

  useEffect(() => {
    fetchPhotos();
  }, [professionalId, user]);

  useEffect(() => {
    if (selectedPhoto) {
      fetchComments(selectedPhoto.id);
    } else {
      setComments([]);
    }
  }, [selectedIndex]);

  const handleLike = async (photoId: string) => {
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para curtir fotos.",
        variant: "destructive",
      });
      return;
    }

    const isLiked = userLikes[photoId];

    try {
      if (isLiked) {
        await supabase
          .from("photo_likes")
          .delete()
          .eq("photo_id", photoId)
          .eq("user_id", user.id);

        setUserLikes((prev) => ({ ...prev, [photoId]: false }));
        setLikeCounts((prev) => ({ ...prev, [photoId]: Math.max(0, (prev[photoId] || 0) - 1) }));
      } else {
        await supabase
          .from("photo_likes")
          .insert({ photo_id: photoId, user_id: user.id, tenant_id: tenantId! });

        setUserLikes((prev) => ({ ...prev, [photoId]: true }));
        setLikeCounts((prev) => ({ ...prev, [photoId]: (prev[photoId] || 0) + 1 }));
      }
    } catch (error) {
      logger.error("Error toggling like:", error);
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para comentar.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPhoto || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("photo_comments").insert({
        photo_id: selectedPhoto.id,
        user_id: user.id,
        content: newComment.trim(),
        tenant_id: tenantId!,
      });

      if (error) throw error;

      setNewComment("");
      fetchComments(selectedPhoto.id);
    } catch (error) {
      logger.error("Error adding comment:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o comentário.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!deleteCommentTarget) return;
    setDeletingComment(true);

    try {
      const { error } = await supabase
        .from("photo_comments")
        .delete()
        .eq("id", deleteCommentTarget);

      if (error) throw error;

      toast({ title: "Comentário excluído" });
      if (selectedPhoto) {
        fetchComments(selectedPhoto.id);
      }
    } catch (error) {
      logger.error("Error deleting comment:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o comentário.",
        variant: "destructive",
      });
    } finally {
      setDeletingComment(false);
      setDeleteCommentTarget(null);
    }
  };

  const navigatePhoto = (direction: "prev" | "next") => {
    setSelectedIndex((prev) => {
      if (direction === "prev") return prev > 0 ? prev - 1 : photos.length - 1;
      return prev < photos.length - 1 ? prev + 1 : 0;
    });
    setNewComment("");
  };

  // Keyboard navigation
  useEffect(() => {
    if (selectedIndex < 0) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") navigatePhoto("prev");
      else if (e.key === "ArrowRight") navigatePhoto("next");
      else if (e.key === "Escape") setSelectedIndex(-1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedIndex, photos.length]);

  if (loading) {
    return (
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Galeria</h3>
        </div>
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    return null;
  }

  return (
    <div className="glass-panel p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Galeria</h3>
        <span className="text-sm text-muted-foreground">({photos.length} fotos)</span>
      </div>

      {/* Instagram-style Grid: 2 cols mobile, 3 cols desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-1.5">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => setSelectedIndex(index)}
            className="relative group aspect-square rounded-md overflow-hidden bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <img
              src={photo.image_url}
              alt={photo.caption || "Foto"}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex items-center gap-4 text-white font-semibold text-sm">
                <span className="flex items-center gap-1">
                  <Heart className={cn("w-5 h-5", userLikes[photo.id] && "fill-current")} />
                  {likeCounts[photo.id] || 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-5 h-5" />
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      <Dialog open={selectedIndex >= 0} onOpenChange={(open) => !open && setSelectedIndex(-1)}>
        <DialogContent className="max-w-4xl w-[95vw] p-0 overflow-hidden gap-0 border-border/50">
          {selectedPhoto && (
            <div className="flex flex-col md:flex-row max-h-[90vh]">
              {/* Image section with carousel arrows */}
              <div className="relative md:w-3/5 bg-black flex items-center justify-center min-h-[250px] md:min-h-[500px]">
                <img
                  src={selectedPhoto.image_url}
                  alt={selectedPhoto.caption || "Foto"}
                  className="max-h-[40vh] md:max-h-[90vh] w-full object-contain select-none"
                  draggable={false}
                />

                {/* Carousel arrows */}
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigatePhoto("prev"); }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
                      aria-label="Foto anterior"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigatePhoto("next"); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
                      aria-label="Próxima foto"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Photo counter */}
                {photos.length > 1 && (
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-white/80 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {selectedIndex + 1} / {photos.length}
                  </span>
                )}
              </div>

              {/* Comments Section */}
              <div className="md:w-2/5 flex flex-col bg-background max-h-[50vh] md:max-h-[90vh]">
                {/* Header with like/comment counts */}
                <div className="p-4 border-b border-border/50">
                  {selectedPhoto.caption && (
                    <p className="text-sm mb-2">{selectedPhoto.caption}</p>
                  )}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(selectedPhoto.id)}
                      className="flex items-center gap-1.5 text-sm transition-colors"
                    >
                      <Heart
                        className={cn(
                          "w-6 h-6 transition-all",
                          userLikes[selectedPhoto.id]
                            ? "fill-red-500 text-red-500 scale-110"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      />
                      <span className="font-medium">{likeCounts[selectedPhoto.id] || 0}</span>
                    </button>
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MessageCircle className="w-5 h-5" />
                      <span>{comments.length}</span>
                    </span>
                  </div>
                </div>

                {/* Comments List */}
                <ScrollArea className="flex-1 p-4">
                  {loadingComments ? (
                    <div className="flex justify-center py-4">
                      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum comentário ainda
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {comments.map((comment) => {
                        const canDelete =
                          (user && user.id === comment.user_id) || isAdmin;

                        return (
                          <div key={comment.id} className="flex gap-2 group">
                            <Avatar className="w-8 h-8 shrink-0">
                              {comment.profile?.avatar_url && (
                                <AvatarImage src={comment.profile.avatar_url} />
                              )}
                              <AvatarFallback className="text-xs bg-muted">
                                {comment.profile?.name?.[0]?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">
                                <span className="font-semibold mr-1">
                                  {comment.profile?.name || "Usuário"}
                                </span>
                                {comment.content}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {formatDateBR(comment.created_at)}
                              </p>
                            </div>
                            {canDelete && (
                              <button
                                onClick={() => setDeleteCommentTarget(comment.id)}
                                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0 p-1"
                                title="Excluir comentário"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>

                {/* Add Comment */}
                {user ? (
                  <div className="p-3 border-t border-border/50">
                    <div className="flex gap-2">
                      <Input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Adicione um comentário..."
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment();
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        onClick={handleAddComment}
                        disabled={submitting || !newComment.trim()}
                      >
                        {submitting ? (
                          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 border-t border-border/50 text-center">
                    <p className="text-sm text-muted-foreground">
                      Faça login para comentar
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Comment Confirmation */}
      <AlertDialog open={!!deleteCommentTarget} onOpenChange={(open) => !open && setDeleteCommentTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir comentário?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingComment}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteComment}
              disabled={deletingComment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingComment ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
