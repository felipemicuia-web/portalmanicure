import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLandingContentAdmin } from "@/hooks/useLandingContent";
import { LandingAdminHeader } from "./landing/LandingAdminHeader";
import { LandingAdminHero } from "./landing/LandingAdminHero";
import { LandingAdminBenefits } from "./landing/LandingAdminBenefits";
import { LandingAdminFeatures } from "./landing/LandingAdminFeatures";
import { LandingAdminPricing } from "./landing/LandingAdminPricing";
import { LandingAdminDemo } from "./landing/LandingAdminDemo";
import { LandingAdminCta } from "./landing/LandingAdminCta";
import { LandingAdminFooter } from "./landing/LandingAdminFooter";
import { LandingAdminTheme } from "./landing/LandingAdminTheme";
import {
  Save,
  Upload,
  Undo2,
  Eye,
  Loader2,
  Layout,
  Sparkles,
  Gift,
  Zap,
  DollarSign,
  Monitor,
  Megaphone,
  PanelBottom,
  Palette,
} from "lucide-react";

const TABS = [
  { id: "header", label: "Header", icon: Layout },
  { id: "hero", label: "Hero", icon: Sparkles },
  { id: "benefits", label: "Benefícios", icon: Gift },
  { id: "features", label: "Funções", icon: Zap },
  { id: "pricing", label: "Preços", icon: DollarSign },
  { id: "demo", label: "Demonstração", icon: Monitor },
  { id: "cta", label: "CTA Final", icon: Megaphone },
  { id: "footer", label: "Rodapé", icon: PanelBottom },
  { id: "theme", label: "Tema", icon: Palette },
];

export function PlatformLandingAdmin() {
  const [activeTab, setActiveTab] = useState("header");
  const { toast } = useToast();
  const {
    draft,
    published,
    loading,
    saving,
    publishing,
    hasUnsavedChanges,
    updateDraft,
    saveDraft,
    publish,
    discardDraft,
  } = useLandingContentAdmin();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const handleSave = async () => {
    await saveDraft();
    toast({ title: "Rascunho salvo com sucesso!" });
  };

  const handlePublish = async () => {
    await publish();
    toast({ title: "Landing page publicada!", description: "As alterações estão visíveis no site." });
  };

  const handleDiscard = () => {
    discardDraft();
    toast({ title: "Alterações descartadas", description: "O conteúdo foi revertido para a versão publicada." });
  };

  const handlePreview = () => {
    window.open("/", "_blank");
  };

  const handleThemeChange = async (themeId: string) => {
    updateDraft((prev) => ({ ...prev, themeId }));
    const updatedContent = { ...draft, themeId };
    const value = JSON.stringify(updatedContent);
    const { data: pubExists } = await supabase.from("platform_settings").select("id").eq("key", "landing_page_published").maybeSingle();
    if (pubExists) {
      await supabase.from("platform_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", "landing_page_published");
    } else {
      await supabase.from("platform_settings").insert({ key: "landing_page_published", value });
    }
    const { data: draftExists } = await supabase.from("platform_settings").select("id").eq("key", "landing_page_draft").maybeSingle();
    if (draftExists) {
      await supabase.from("platform_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", "landing_page_draft");
    } else {
      await supabase.from("platform_settings").insert({ key: "landing_page_draft", value });
    }
    toast({ title: "Tema aplicado!", description: "O tema da landing page foi atualizado." });
  };

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">Status:</h3>
            {published ? (
              <Badge variant="default" className="text-xs">Publicado</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Não publicado</Badge>
            )}
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-xs border-destructive/50 text-destructive">
                Alterações não salvas
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handlePreview} className="gap-1.5">
            <Eye className="w-4 h-4" /> Preview
          </Button>
          {hasUnsavedChanges && (
            <Button variant="ghost" size="sm" onClick={handleDiscard} className="gap-1.5 text-destructive hover:text-destructive">
              <Undo2 className="w-4 h-4" /> Descartar
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving || !hasUnsavedChanges} className="gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar rascunho
          </Button>
          <Button size="sm" onClick={handlePublish} disabled={publishing} className="gap-1.5">
            {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Publicar
          </Button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-1 p-1 bg-muted/50 rounded-lg border border-border/50">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="border border-border/50 rounded-lg bg-card/50 p-4 sm:p-6">
        {activeTab === "header" && <LandingAdminHeader content={draft.header} onChange={(header) => updateDraft((prev) => ({ ...prev, header }))} />}
        {activeTab === "hero" && <LandingAdminHero content={draft.hero} onChange={(hero) => updateDraft((prev) => ({ ...prev, hero }))} />}
        {activeTab === "benefits" && <LandingAdminBenefits content={draft.benefits} onChange={(benefits) => updateDraft((prev) => ({ ...prev, benefits }))} />}
        {activeTab === "features" && <LandingAdminFeatures content={draft.features} onChange={(features) => updateDraft((prev) => ({ ...prev, features }))} />}
        {activeTab === "pricing" && <LandingAdminPricing content={draft.pricing} onChange={(pricing) => updateDraft((prev) => ({ ...prev, pricing }))} />}
        {activeTab === "demo" && <LandingAdminDemo content={draft.demo} onChange={(demo) => updateDraft((prev) => ({ ...prev, demo }))} />}
        {activeTab === "cta" && <LandingAdminCta content={draft.cta} onChange={(cta) => updateDraft((prev) => ({ ...prev, cta }))} />}
        {activeTab === "footer" && <LandingAdminFooter content={draft.footer} onChange={(footer) => updateDraft((prev) => ({ ...prev, footer }))} />}
        {activeTab === "theme" && <LandingAdminTheme selectedThemeId={draft.themeId || "galaxy"} onChange={async (themeId) => {
          updateDraft((prev) => ({ ...prev, themeId }));
          // Auto-publish theme change immediately
          const updatedContent = { ...draft, themeId };
          const value = JSON.stringify(updatedContent);
          const { data: pubExists } = await supabase.from("platform_settings").select("id").eq("key", "landing_page_published").maybeSingle();
          if (pubExists) {
            await supabase.from("platform_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", "landing_page_published");
          } else {
            await supabase.from("platform_settings").insert({ key: "landing_page_published", value });
          }
          const { data: draftExists } = await supabase.from("platform_settings").select("id").eq("key", "landing_page_draft").maybeSingle();
          if (draftExists) {
            await supabase.from("platform_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", "landing_page_draft");
          } else {
            await supabase.from("platform_settings").insert({ key: "landing_page_draft", value });
          }
          toast({ title: "Tema aplicado!", description: "O tema da landing page foi atualizado." });
        }} />
      </div>
    </div>
  );
}
