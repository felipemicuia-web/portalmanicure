import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LandingFeatures, SectionDisplayMode } from "@/types/landing";
import { SectionImageUpload } from "./SectionImageUpload";

interface Props {
  content: LandingFeatures;
  onChange: (v: LandingFeatures) => void;
}

export function LandingAdminFeatures({ content, onChange }: Props) {
  const mode = content.displayMode || "text";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Funções</h3>
        <div className="flex items-center gap-2">
          <Label htmlFor="features-enabled" className="text-sm">Ativo</Label>
          <Switch id="features-enabled" checked={content.enabled} onCheckedChange={(enabled) => onChange({ ...content, enabled })} />
        </div>
      </div>

      <SectionImageUpload
        imageUrl={content.imageUrl || ""}
        displayMode={mode}
        onImageChange={(url) => onChange({ ...content, imageUrl: url })}
        onDisplayModeChange={(m) => onChange({ ...content, displayMode: m })}
        sectionLabel="funcoes"
      />

      {(mode === "text" || mode === "both") && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Badge</Label>
              <Input value={content.badgeText} onChange={(e) => onChange({ ...content, badgeText: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={content.title} onChange={(e) => onChange({ ...content, title: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Subtítulo</Label>
            <Input value={content.subtitle} onChange={(e) => onChange({ ...content, subtitle: e.target.value })} />
          </div>
        </>
      )}
    </div>
  );
}
