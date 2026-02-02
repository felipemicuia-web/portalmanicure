import { useState, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { Plus, Trash2, X, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GalleryPhoto {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
}

interface PhotoGalleryProps {
  user: User;
  photos: GalleryPhoto[];
  onPhotosChange: () => void;
}

export function PhotoGallery({ user, photos, onPhotosChange }: PhotoGalleryProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Erro",
            description: `${file.name} não é uma imagem válida.`,
            variant: "destructive",
          });
          continue;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "Erro",
            description: `${file.name} deve ter no máximo 10MB.`,
            variant: "destructive",
          });
          continue;
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("gallery")
          .upload(fileName, file);

        if (uploadError) {
          logger.error("Upload error:", uploadError);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("gallery")
          .getPublicUrl(fileName);

        // Save to database
        const { error: dbError } = await supabase.from("gallery_photos").insert({
          user_id: user.id,
          image_url: urlData.publicUrl,
        });

        if (dbError) {
          logger.error("Database error:", dbError);
        }
      }

      toast({
        title: "Sucesso!",
        description: "Fotos adicionadas à galeria.",
      });

      onPhotosChange();
    } catch (error) {
      logger.error("Upload error:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar as fotos.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeletePhoto = async (photo: GalleryPhoto) => {
    setIsDeleting(true);

    try {
      // Extract file path from URL
      const urlParts = photo.image_url.split("/gallery/");
      if (urlParts.length > 1) {
        const filePath = urlParts[1].split("?")[0];
        
        // Delete from storage
        await supabase.storage.from("gallery").remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from("gallery_photos")
        .delete()
        .eq("id", photo.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Foto removida.",
      });

      setSelectedPhoto(null);
      onPhotosChange();
    } catch (error) {
      logger.error("Delete error:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a foto.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="glass-panel p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-5 h-5" />
          <span className="font-semibold">Galeria</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddClick}
          disabled={isUploading}
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          {isUploading ? "Enviando..." : "Adicionar"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Gallery Grid */}
      {photos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Grid3X3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma foto ainda</p>
          <p className="text-sm">Adicione fotos para mostrar seu trabalho!</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="aspect-square cursor-pointer overflow-hidden bg-muted hover:opacity-80 transition-opacity"
            >
              <img
                src={photo.image_url}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {/* Photo Modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-3xl bg-background/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <DialogTitle className="sr-only">Ver foto</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="space-y-4">
              <div className="relative aspect-square sm:aspect-video max-h-[70vh] overflow-hidden rounded-lg">
                <img
                  src={selectedPhoto.image_url}
                  alt=""
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {new Date(selectedPhoto.created_at).toLocaleDateString("pt-BR")}
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeletePhoto(selectedPhoto)}
                  disabled={isDeleting}
                  className="gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? "Removendo..." : "Excluir"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
