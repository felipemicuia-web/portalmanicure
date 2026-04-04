import { usePublicLocationSettings } from "@/hooks/useLocationSettings";
import { isValidUrl } from "@/hooks/usePaymentSettings";
import { buildGoogleMapsExternalUrl, normalizeGoogleMapsEmbedUrl } from "@/lib/maps";
import { MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

function buildEmbedUrl(address: string, embedUrl?: string): string | null {
  return normalizeGoogleMapsEmbedUrl(embedUrl, address);
}

export function LocationSection() {
  const { location, loading } = usePublicLocationSettings();

  if (loading || !location) return null;

  const embedSrc = buildEmbedUrl(location.address, location.embed_url);
  const mapsUrl = location.google_maps_url.trim();
  const fallbackMapsUrl = buildGoogleMapsExternalUrl(location.address);
  const actionUrl = mapsUrl !== "" && isValidUrl(mapsUrl) ? mapsUrl : fallbackMapsUrl;
  const hasMapsLink = Boolean(actionUrl);

  return (
    <div className="glass-panel p-4 sm:p-5 space-y-3 mt-6 mb-4">
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-primary shrink-0" />
        <h3 className="font-semibold text-sm sm:text-base text-foreground">
          {location.title}
        </h3>
      </div>

      {location.description && (
        <p className="text-xs sm:text-sm text-muted-foreground">{location.description}</p>
      )}

      <p className="text-xs sm:text-sm text-foreground/90">{location.address}</p>

      {embedSrc && (
        <div className="rounded-lg overflow-hidden border border-border/40">
          <iframe
            src={embedSrc}
            className="w-full h-40 sm:h-48"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            title="Localização"
            style={{ border: 0 }}
          />
        </div>
      )}

      {hasMapsLink && (
        <Button
          variant="outline"
          size="sm"
          className="gap-2 w-full sm:w-auto"
          onClick={() => {
            const url = actionUrl!;
            if (location.open_in_new_tab) {
              const w = window.open(url, "_blank", "noopener,noreferrer");
              if (!w) window.location.href = url;
            } else {
              window.location.href = url;
            }
          }}
        >
          <ExternalLink className="w-4 h-4" />
          {location.button_text || "Ver no Google Maps"}
        </Button>
      )}
    </div>
  );
}
