import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { LandingDemo, SectionDisplayMode } from "@/types/landing";
import { SectionImageUpload } from "./SectionImageUpload";

interface Props {
  content: LandingDemo;
  onChange: (v: LandingDemo) => void;
}

export function LandingAdminDemo({ content, onChange }: Props) {
  const mode = content.displayMode || "text";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Demonstração</h3>
        <div className="flex items-center gap-2">
          <Label htmlFor="demo-enabled" className="text-sm">Ativo</Label>
          <Switch id="demo-enabled" checked={content.enabled} onCheckedChange={(enabled) => onChange({ ...content, enabled })} />
        </div>
      </div>

      <SectionImageUpload
        imageUrl={content.imageUrl || ""}
        displayMode={mode}
        onImageChange={(url) => onChange({ ...content, imageUrl: url })}
        onDisplayModeChange={(m) => onChange({ ...content, displayMode: m })}
        sectionLabel="demonstracao"
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

          <div className="space-y-2">
            <Label>Descrição interna</Label>
            <Textarea value={content.description} onChange={(e) => onChange({ ...content, description: e.target.value })} rows={3} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Texto do botão</Label>
              <Input value={content.ctaText} onChange={(e) => onChange({ ...content, ctaText: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Link do demo</Label>
              <Input value={content.demoUrl} onChange={(e) => onChange({ ...content, demoUrl: e.target.value })} placeholder="/tenant/default" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
