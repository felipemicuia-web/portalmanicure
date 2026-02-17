import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTenant } from "@/contexts/TenantContext";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Pencil, Trash2, Check, X, Users, Upload, User, Image as ImageIcon, Sparkles } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AdminProfessionalGallery } from "./AdminProfessionalGallery";
import { Checkbox } from "@/components/ui/checkbox";

interface Professional {
  id: string;
  name: string;
  subtitle: string | null;
  photo_url: string | null;
  bio: string | null;
  instagram: string | null;
  active: boolean;
  created_at: string;
}

interface ServiceItem {
  id: string;
  name: string;
}

export function AdminProfessionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [editName, setEditName] = useState("");
  const [editSubtitle, setEditSubtitle] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editInstagram, setEditInstagram] = useState("");
  const [newName, setNewName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [galleryProfessional, setGalleryProfessional] = useState<Professional | null>(null);
  const [allServices, setAllServices] = useState<ServiceItem[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { tenantId } = useTenant();

  const fetchProfessionals = async () => {
    const { data, error } = await supabase
      .from("professionals")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      logger.error("Error fetching professionals:", error);
    } else {
      setProfessionals(data || []);
    }
    setLoading(false);
  };

  const fetchAllServices = async () => {
    const { data } = await supabase.from("services").select("id, name").eq("active", true).order("name");
    if (data) setAllServices(data);
  };

  const fetchProfessionalServices = async (profId: string) => {
    const { data } = await supabase.from("professional_services").select("service_id").eq("professional_id", profId);
    setSelectedServiceIds(data?.map(d => d.service_id) || []);
  };

  useEffect(() => {
    fetchProfessionals();
    fetchAllServices();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;

    const { error } = await supabase
      .from("professionals")
      .insert({ name: newName.trim(), tenant_id: tenantId });

    if (error) {
      logger.error("Error adding professional:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o profissional.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Profissional adicionado!" });
      setNewName("");
      setIsAdding(false);
      fetchProfessionals();
    }
  };

  const handleEdit = async () => {
    if (!editingProfessional || !editName.trim()) return;

    const { error } = await supabase
      .from("professionals")
      .update({ 
        name: editName.trim(),
        subtitle: editSubtitle.trim() || null,
        bio: editBio.trim() || null,
        instagram: editInstagram.trim() || null,
      })
      .eq("id", editingProfessional.id);

    if (error) {
      logger.error("Error updating professional:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o profissional.",
        variant: "destructive",
      });
    } else {
      // Save professional services
      await supabase.from("professional_services").delete().eq("professional_id", editingProfessional.id);
      if (selectedServiceIds.length > 0) {
        await supabase.from("professional_services").insert(
          selectedServiceIds.map(sid => ({ professional_id: editingProfessional.id, service_id: sid, tenant_id: tenantId }))
        );
      }
      toast({ title: "Profissional atualizado!" });
      setEditingProfessional(null);
      fetchProfessionals();
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from("professionals")
      .update({ active: !currentActive })
      .eq("id", id);

    if (error) {
      logger.error("Error toggling professional:", error);
    } else {
      fetchProfessionals();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from("professionals")
      .delete()
      .eq("id", deleteId);

    if (error) {
      logger.error("Error deleting professional:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o profissional.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Profissional removido!" });
      fetchProfessionals();
    }
    setDeleteId(null);
  };

  const handlePhotoUpload = async (profId: string, file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo de imagem válido.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 2MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingId(profId);

    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${profId}/photo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const photoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase
        .from("professionals")
        .update({ photo_url: photoUrl })
        .eq("id", profId);

      if (updateError) throw updateError;

      toast({ title: "Foto atualizada!" });
      fetchProfessionals();
    } catch (error) {
      logger.error("Error uploading photo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a foto.",
        variant: "destructive",
      });
    } finally {
      setUploadingId(null);
    }
  };

  const triggerFileInput = (profId: string) => {
    setUploadingId(profId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingId) {
      handlePhotoUpload(uploadingId, file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openEditSheet = (prof: Professional) => {
    setEditingProfessional(prof);
    setEditName(prof.name);
    setEditSubtitle(prof.subtitle || "");
    setEditBio(prof.bio || "");
    setEditInstagram(prof.instagram || "");
    fetchProfessionalServices(prof.id);
  };

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds(prev =>
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Show gallery view if a professional is selected
  if (galleryProfessional) {
    return (
      <AdminProfessionalGallery
        professionalId={galleryProfessional.id}
        professionalName={galleryProfessional.name}
        onBack={() => setGalleryProfessional(null)}
      />
    );
  }

  const editFormContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome</Label>
        <Input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder="Nome do profissional"
        />
      </div>
      <div className="space-y-2">
        <Label>Subtítulo</Label>
        <Input
          value={editSubtitle}
          onChange={(e) => setEditSubtitle(e.target.value.slice(0, 22))}
          placeholder="Ex: Especialista em gel"
          maxLength={22}
        />
        <span className="text-xs text-muted-foreground">{editSubtitle.length}/22</span>
      </div>
      <div className="space-y-2">
        <Label>Biografia</Label>
        <Textarea
          value={editBio}
          onChange={(e) => setEditBio(e.target.value)}
          placeholder="Biografia (opcional)"
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label>Instagram</Label>
        <Input
          value={editInstagram}
          onChange={(e) => setEditInstagram(e.target.value)}
          placeholder="@usuario (sem @)"
        />
      </div>
      {allServices.length > 0 && (
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Serviços que realiza
          </Label>
          <div className="space-y-2 max-h-40 overflow-y-auto p-2 rounded-lg border border-border/50 bg-muted/20">
            {allServices.map(s => (
              <label key={s.id} className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox
                  checked={selectedServiceIds.includes(s.id)}
                  onCheckedChange={() => toggleService(s.id)}
                />
                {s.name}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-lg sm:text-xl font-semibold">Profissionais</h2>
        </div>
        <Button onClick={() => setIsAdding(true)} size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Adicionar</span>
        </Button>
      </div>

      {isAdding && (
        <div className="flex items-center gap-2 p-3 glass-panel">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome do profissional"
            className="flex-1"
            autoFocus
          />
          <Button size="icon" onClick={handleAdd}>
            <Check className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setIsAdding(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Mobile: Cards Layout */}
      {isMobile ? (
        <div className="space-y-3">
          {professionals.length === 0 ? (
            <div className="glass-panel p-8 text-center text-muted-foreground">
              Nenhum profissional cadastrado
            </div>
          ) : (
            professionals.map((prof) => (
              <div key={prof.id} className="glass-panel p-4">
                <div className="flex items-start gap-3">
                  <div className="relative group">
                    <Avatar className="h-14 w-14 border-2 border-border/50">
                      {prof.photo_url ? (
                        <AvatarImage src={prof.photo_url} alt={prof.name} />
                      ) : null}
                      <AvatarFallback className="bg-muted text-muted-foreground text-sm font-semibold">
                        {getInitials(prof.name) || <User className="w-5 h-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => triggerFileInput(prof.id)}
                      disabled={uploadingId === prof.id}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity"
                    >
                      {uploadingId === prof.id ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`font-medium truncate ${!prof.active ? "text-muted-foreground" : ""}`}>
                        {prof.name}
                      </h3>
                      <Switch
                        checked={prof.active}
                        onCheckedChange={() => handleToggleActive(prof.id, prof.active)}
                      />
                    </div>
                    {prof.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {prof.bio}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditSheet(prof)}
                        className="flex-1 gap-1"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setGalleryProfessional(prof)}
                        className="gap-1"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteId(prof.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Desktop: Table Layout */
        <div className="glass-panel overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Foto</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Biografia</TableHead>
                <TableHead className="w-24 text-center">Ativo</TableHead>
                <TableHead className="w-28 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {professionals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum profissional cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                professionals.map((prof) => (
                  <TableRow key={prof.id}>
                    <TableCell>
                      <div className="relative group">
                        <Avatar className="h-10 w-10 border-2 border-border/50">
                          {prof.photo_url ? (
                            <AvatarImage src={prof.photo_url} alt={prof.name} />
                          ) : null}
                          <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">
                            {getInitials(prof.name) || <User className="w-4 h-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <button
                          type="button"
                          onClick={() => triggerFileInput(prof.id)}
                          disabled={uploadingId === prof.id}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {uploadingId === prof.id ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 text-white" />
                          )}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={!prof.active ? "text-muted-foreground" : ""}>
                        {prof.name}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-muted-foreground line-clamp-2">
                        {prof.bio || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={prof.active}
                        onCheckedChange={() => handleToggleActive(prof.id, prof.active)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditSheet(prof)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setGalleryProfessional(prof)}
                          title="Galeria de fotos"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteId(prof.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit: Drawer for mobile, Dialog for desktop */}
      {isMobile ? (
        <Drawer open={!!editingProfessional} onOpenChange={(open) => !open && setEditingProfessional(null)}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Editar Profissional</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4">
              {editFormContent}
            </div>
            <DrawerFooter className="pt-2">
              <Button onClick={handleEdit}>Salvar</Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={!!editingProfessional} onOpenChange={(open) => !open && setEditingProfessional(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Profissional</DialogTitle>
            </DialogHeader>
            {editFormContent}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditingProfessional(null)}>
                Cancelar
              </Button>
              <Button onClick={handleEdit}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este profissional? Esta ação não pode ser desfeita.
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
