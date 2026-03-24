import { useState, useEffect } from "react";
import { usePlatformSettingsAdmin } from "@/hooks/usePlatformSettings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link2, Type, FileText, ExternalLink } from "lucide-react";

export function PlatformFooterSettings() {
  const { settings, loading, saving, save } = usePlatformSettingsAdmin();
  const { toast } = useToast();

  const [footerText, setFooterText] = useState("");
  const [footerUrl, setFooterUrl] = useState("");
  const [secondaryText, setSecondaryText] = useState("");

  useEffect(() => {
    if (!loading) {
      setFooterText(settings.footer_text);
      setFooterUrl(settings.footer_url);
      setSecondaryText(settings.footer_secondary_text);
    }
  }, [loading, settings]);

  const handleSave = async () => {
    // Validate URL if provided
    if (footerUrl.trim() && !/^https?:\/\/.+/i.test(footerUrl.trim())) {
      toast({ title: "URL inválida", description: "Use formato http:// ou https://", variant: "destructive" });
      return;
    }

    await save({
      footer_text: footerText.trim(),
      footer_url: footerUrl.trim(),
      footer_secondary_text: secondaryText.trim(),
    });
    toast({ title: "Configurações salvas!" });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-primary" />
            Rodapé da Página Pública
          </CardTitle>
          <CardDescription>
            Configure o texto e link exibidos no rodapé da página de agendamento de todos os tenants.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="footer-text" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Texto do Rodapé
            </Label>
            <Input
              id="footer-text"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="Ex: © 2026 Minha Empresa"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">Texto principal exibido no rodapé</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer-url" className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Link do Rodapé
            </Label>
            <Input
              id="footer-url"
              value={footerUrl}
              onChange={(e) => setFooterUrl(e.target.value)}
              placeholder="https://meusite.com"
              type="url"
            />
            <p className="text-xs text-muted-foreground">
              Se preenchido, o texto do rodapé será clicável e redirecionará para este link
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer-secondary" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Texto Secundário
            </Label>
            <Input
              id="footer-secondary"
              value={secondaryText}
              onChange={(e) => setSecondaryText(e.target.value)}
              placeholder="Ex: Sistema de agendamento online"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">Texto adicional exibido ao lado (visível apenas em desktop)</p>
          </div>

          {/* Preview */}
          {footerText && (
            <div className="rounded-lg border border-border/50 p-4 bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Preview do rodapé:</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {footerUrl ? (
                  <a
                    href={footerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary hover:text-primary/80 flex items-center gap-1"
                  >
                    {footerText}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span>{footerText}</span>
                )}
                {secondaryText && <span className="text-muted-foreground/60">•</span>}
                {secondaryText && <span>{secondaryText}</span>}
              </div>
            </div>
          )}

          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
