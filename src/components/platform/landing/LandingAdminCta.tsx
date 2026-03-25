import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { LandingCta, SectionDisplayMode } from "@/types/landing";
import { SectionImageUpload } from "./SectionImageUpload";

interface Props {
  content: LandingCta;
  onChange: (v: LandingCta) => void;
}

export function LandingAdminCta({ content, onChange }: Props) {
  const mode = content.displayMode || "text";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">CTA Final</h3>
        <div className="flex items-center gap-2">
          <Label htmlFor="cta-enabled" className="text-sm">Ativo</Label>
          <Switch id="cta-enabled" checked={content.enabled} onCheckedChange={(enabled) => onChange({ ...content, enabled })} />
        </div>
      </div>

      <SectionImageUpload
        imageUrl={content.imageUrl || ""}
        displayMode={mode}
        onImageChange={(url) => onChange({ ...content, imageUrl: url })}
        onDisplayModeChange={(m) => onChange({ ...content, displayMode: m })}
        sectionLabel="cta"
      />

      {(mode === "text" || mode === "both") && (
        <>
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={content.title} onChange={(e) => onChange({ ...content, title: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={content.description} onChange={(e) => onChange({ ...content, description: e.target.value })} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Texto do botão</Label>
            <Input value={content.ctaText} onChange={(e) => onChange({ ...content, ctaText: e.target.value })} />
          </div>
        </>
      )}
    </div>
  );
}
