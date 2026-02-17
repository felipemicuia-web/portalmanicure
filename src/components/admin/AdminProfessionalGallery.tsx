import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Upload, X, Image as ImageIcon, ArrowLeft } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Photo {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
}

interface AdminProfessionalGalleryProps {
  professionalId: string;
  professionalName: string;
  onBack: () => void;
}

export function AdminProfessionalGallery({ 
  professionalId, 
  professionalName, 
  onBack 
}: AdminProfessionalGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCaption, setNewCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { tenantId } = useTenant();

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
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPhotos();
  }, [professionalId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo de imagem válido.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setIsAddDialogOpen(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);

    try {
      const fileExt = selectedFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `professionals/${professionalId}/gallery/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from("professional_photos")
        .insert({
          professional_id: professionalId,
          image_url: urlData.publicUrl,
          caption: newCaption.trim() || null,
          tenant_id: tenantId,
        });

      if (insertError) throw insertError;

      toast({ title: "Foto adicionada!" });
      setIsAddDialogOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setNewCaption("");
      fetchPhotos();
    } catch (error) {
      logger.error("Error uploading photo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a foto.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const photo = photos.find((p) => p.id === deleteId);
    if (!photo) return;

    try {
      // Extract file path from URL
      const url = new URL(photo.image_url);
      const pathMatch = url.pathname.match(/\/object\/public\/avatars\/(.+)/);
      if (pathMatch) {
        await supabase.storage.from("avatars").remove([pathMatch[1]]);
      }

      const { error } = await supabase
        .from("professional_photos")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast({ title: "Foto removida!" });
      fetchPhotos();
    } catch (error) {
      logger.error("Error deleting photo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a foto.",
        variant: "destructive",
      });
    }
    setDeleteId(null);
  };

  const handleCloseAddDialog = () => {
    setIsAddDialogOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setNewCaption("");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold">Galeria de {professionalName}</h2>
            <p className="text-sm text-muted-foreground">{photos.length} fotos</p>
          </div>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Adicionar</span>
        </Button>
      </div>

      {photos.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">Nenhuma foto na galeria</p>
          <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="gap-2">
            <Upload className="w-4 h-4" /> Adicionar primeira foto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden glass-panel">
              <img
                src={photo.image_url}
                alt={photo.caption || "Foto da galeria"}
                className="w-full h-full object-cover"
              />
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-white text-xs line-clamp-2">{photo.caption}</p>
                </div>
              )}
              <button
                onClick={() => setDeleteId(photo.id)}
                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Photo Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={handleCloseAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Foto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {previewUrl && (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    fileInputRef.current?.click();
                  }}
                  className="absolute top-2 right-2 p-1 bg-black/60 rounded-full hover:bg-black/80"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            )}
            <div className="space-y-2">
              <Label>Legenda (opcional)</Label>
              <Textarea
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                placeholder="Adicione uma descrição para a foto..."
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleCloseAddDialog}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                "Adicionar"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta foto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
