import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LandingFooter } from "@/types/landing";

interface Props {
  content: LandingFooter;
  onChange: (v: LandingFooter) => void;
}

export function LandingAdminFooter({ content, onChange }: Props) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">Rodapé</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nome da marca</Label>
          <Input value={content.brandName} onChange={(e) => onChange({ ...content, brandName: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Texto de copyright</Label>
          <Input value={content.copyrightText} onChange={(e) => onChange({ ...content, copyrightText: e.target.value })} />
        </div>
      </div>
    </div>
  );
}
