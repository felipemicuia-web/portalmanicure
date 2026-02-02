import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Sparkles, Upload, ImageIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
import { Label } from "@/components/ui/label";

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  image_url: string | null;
  active: boolean;
  created_at: string;
}

interface ServiceForm {
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  image_url: string | null;
}

const emptyForm: ServiceForm = {
  name: "",
  description: "",
  duration_minutes: 30,
  price: 0,
  image_url: null,
};

export function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      logger.error("Error fetching services:", error);
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openAddDialog = () => {
    setEditingService(null);
    setForm(emptyForm);
    setPreviewUrl(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setForm({
      name: service.name,
      description: service.description || "",
      duration_minutes: service.duration_minutes,
      price: Number(service.price),
      image_url: service.image_url,
    });
    setPreviewUrl(service.image_url);
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo de imagem válido.",
        variant: "destructive",
      });
      return null;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 2MB.",
        variant: "destructive",
      });
      return null;
    }

    setUploadingImage(true);

    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `service-${Date.now()}.${fileExt}`;
      const filePath = `services/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const imageUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      return imageUrl;
    } catch (error) {
      logger.error("Error uploading image:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a imagem.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    const uploadedUrl = await handleImageUpload(file);
    if (uploadedUrl) {
      setForm({ ...form, image_url: uploadedUrl });
      setPreviewUrl(uploadedUrl);
    } else {
      setPreviewUrl(form.image_url);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Digite o nome do serviço", variant: "destructive" });
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      duration_minutes: form.duration_minutes,
      price: form.price,
      image_url: form.image_url,
    };

    if (editingService) {
      const { error } = await supabase
        .from("services")
        .update(payload)
        .eq("id", editingService.id);

      if (error) {
        logger.error("Error updating service:", error);
        toast({ title: "Erro ao atualizar serviço", variant: "destructive" });
      } else {
        toast({ title: "Serviço atualizado!" });
      }
    } else {
      const { error } = await supabase.from("services").insert(payload);

      if (error) {
        logger.error("Error adding service:", error);
        toast({ title: "Erro ao adicionar serviço", variant: "destructive" });
      } else {
        toast({ title: "Serviço adicionado!" });
      }
    }

    setIsDialogOpen(false);
    setPreviewUrl(null);
    fetchServices();
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from("services")
      .update({ active: !currentActive })
      .eq("id", id);

    if (error) {
      logger.error("Error toggling service:", error);
    } else {
      fetchServices();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase.from("services").delete().eq("id", deleteId);

    if (error) {
      logger.error("Error deleting service:", error);
      toast({ title: "Erro ao remover serviço", variant: "destructive" });
    } else {
      toast({ title: "Serviço removido!" });
      fetchServices();
    }
    setDeleteId(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const FormContent = () => (
    <div className="space-y-4">
      {/* Image Upload */}
      <div className="space-y-2">
        <Label>Imagem do Serviço</Label>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 border-dashed border-border/50 overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="gap-2 w-full sm:w-auto"
            >
              {uploadingImage ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {previewUrl ? "Trocar" : "Enviar"}
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              JPG, PNG ou GIF. Máx. 2MB.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Ex: Manicure"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Descrição do serviço"
          rows={2}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration">Duração (min)</Label>
          <Input
            id="duration"
            type="number"
            min={15}
            step={15}
            value={form.duration_minutes}
            onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 30 })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Preço (R$)</Label>
          <Input
            id="price"
            type="number"
            min={0}
            step={0.01}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg sm:text-xl font-semibold">Serviços</h2>
        </div>
        <Button onClick={openAddDialog} size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Adicionar</span>
        </Button>
      </div>

      {/* Mobile: Cards Layout */}
      {isMobile ? (
        <div className="space-y-3">
          {services.length === 0 ? (
            <div className="glass-panel p-8 text-center text-muted-foreground">
              Nenhum serviço cadastrado
            </div>
          ) : (
            services.map((service) => (
              <div key={service.id} className="glass-panel p-4">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-lg border border-border/50 overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                    {service.image_url ? (
                      <img
                        src={service.image_url}
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`font-medium truncate ${!service.active ? "text-muted-foreground" : ""}`}>
                        {service.name}
                      </h3>
                      <Switch
                        checked={service.active}
                        onCheckedChange={() => handleToggleActive(service.id, service.active)}
                      />
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span>{service.duration_minutes} min</span>
                      <span className="font-medium text-foreground">{formatPrice(service.price)}</span>
                    </div>
                    {service.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(service)}
                        className="flex-1 gap-1"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteId(service.id)}
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
                <TableHead className="w-24 text-center">Duração</TableHead>
                <TableHead className="w-28 text-right">Preço</TableHead>
                <TableHead className="w-24 text-center">Ativo</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum serviço cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div className="w-10 h-10 rounded-lg border border-border/50 overflow-hidden bg-muted flex items-center justify-center">
                        {service.image_url ? (
                          <img
                            src={service.image_url}
                            alt={service.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className={!service.active ? "text-muted-foreground" : ""}>
                          {service.name}
                        </span>
                        {service.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {service.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{service.duration_minutes} min</TableCell>
                    <TableCell className="text-right">{formatPrice(service.price)}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={service.active}
                        onCheckedChange={() => handleToggleActive(service.id, service.active)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEditDialog(service)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(service.id)}>
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

      {/* Add/Edit: Drawer for mobile, Dialog for desktop */}
      {isMobile ? (
        <Drawer open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{editingService ? "Editar Serviço" : "Novo Serviço"}</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
              <FormContent />
            </div>
            <DrawerFooter className="pt-2">
              <Button onClick={handleSave} disabled={uploadingImage}>
                {editingService ? "Salvar" : "Adicionar"}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-background/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle>{editingService ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <FormContent />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={uploadingImage}>
                {editingService ? "Salvar" : "Adicionar"}
              </Button>
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
              Tem certeza que deseja remover este serviço? Esta ação não pode ser desfeita.
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
