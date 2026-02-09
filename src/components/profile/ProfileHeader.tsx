import { useState, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { Camera, Edit2, Check, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizePhone, formatPhone, isValidBrazilianPhone } from "@/lib/validation";

interface ProfileHeaderProps {
  user: User;
  profile: {
    name: string | null;
    avatar_url: string | null;
    phone: string | null;
  } | null;
  bookingCount: number;
  onProfileUpdate: () => void;
}

export function ProfileHeader({
  user,
  profile,
  bookingCount,
  onProfileUpdate,
}: ProfileHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [newName, setNewName] = useState(profile?.name || "");
  const [newPhone, setNewPhone] = useState(profile?.phone ? formatPhone(profile.phone) : "");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhoneInputChange = (value: string) => {
    const digits = normalizePhone(value);
    if (digits.length <= 11) {
      setNewPhone(formatPhone(digits));
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Erro", description: "Por favor, selecione uma imagem válida.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Erro", description: "A imagem deve ter no máximo 5MB.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("user_id", user.id);
      if (updateError) throw updateError;
      toast({ title: "Sucesso!", description: "Foto do perfil atualizada." });
      onProfileUpdate();
    } catch (error) {
      logger.error("Avatar upload error:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar a foto.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleNameSave = async () => {
    if (!newName.trim()) {
      toast({ title: "Erro", description: "Digite um nome válido.", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase.from("profiles").update({ name: newName.trim() }).eq("user_id", user.id);
      if (error) throw error;
      toast({ title: "Sucesso!", description: "Nome atualizado." });
      setIsEditingName(false);
      onProfileUpdate();
    } catch (error) {
      logger.error("Name update error:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar o nome.", variant: "destructive" });
    }
  };

  const handlePhoneSave = async () => {
    const digits = normalizePhone(newPhone);
    if (!isValidBrazilianPhone(digits)) {
      toast({ title: "Erro", description: "Telefone inválido. Use DDD + número.", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase.from("profiles").update({ phone: digits }).eq("user_id", user.id);
      if (error) throw error;
      toast({ title: "Sucesso!", description: "WhatsApp atualizado." });
      setIsEditingPhone(false);
      onProfileUpdate();
    } catch (error) {
      logger.error("Phone update error:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar o WhatsApp.", variant: "destructive" });
    }
  };

  return (
    <div className="glass-panel p-6">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Avatar */}
        <div className="relative group">
          <div
            onClick={handleAvatarClick}
            className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-primary/50 to-purple-600/50 flex items-center justify-center overflow-hidden cursor-pointer border-4 border-primary/30 transition-all hover:border-primary/60 ${
              isUploading ? "opacity-50" : ""
            }`}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl sm:text-5xl font-bold text-primary-foreground">
                {(profile?.name || user.email)?.[0]?.toUpperCase() || "?"}
              </span>
            )}
          </div>
          <div
            onClick={handleAvatarClick}
            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
          >
            <Camera className="w-8 h-8 text-white" />
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left space-y-3">
          {/* Name */}
          <div className="flex items-center justify-center sm:justify-start gap-2">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="bg-input border-border max-w-[220px]"
                  autoFocus
                />
                <Button size="icon" variant="ghost" onClick={handleNameSave}>
                  <Check className="w-4 h-4 text-primary" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => { setIsEditingName(false); setNewName(profile?.name || ""); }}>
                  <X className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ) : (
              <>
                <h2 className="text-xl sm:text-2xl font-bold">{profile?.name || "Sem nome"}</h2>
                <Button size="icon" variant="ghost" onClick={() => setIsEditingName(true)} className="h-8 w-8">
                  <Edit2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          {/* Email */}
          <p className="text-muted-foreground text-sm">{user.email}</p>

          {/* Phone */}
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            {isEditingPhone ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newPhone}
                  onChange={(e) => handlePhoneInputChange(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="bg-input border-border max-w-[180px]"
                  autoFocus
                />
                <Button size="icon" variant="ghost" onClick={handlePhoneSave}>
                  <Check className="w-4 h-4 text-primary" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => { setIsEditingPhone(false); setNewPhone(profile?.phone ? formatPhone(profile.phone) : ""); }}>
                  <X className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ) : (
              <>
                <span className="text-sm">{profile?.phone ? formatPhone(profile.phone) : "Sem WhatsApp"}</span>
                <Button size="icon" variant="ghost" onClick={() => setIsEditingPhone(true)} className="h-7 w-7">
                  <Edit2 className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="flex justify-center sm:justify-start gap-8 pt-1">
            <div className="text-center">
              <span className="text-xl font-bold">{bookingCount}</span>
              <p className="text-xs text-muted-foreground">agendamentos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
