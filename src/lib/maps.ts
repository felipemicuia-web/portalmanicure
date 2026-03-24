export function buildGoogleMapsEmbedUrl(address: string): string | null {
  const normalizedAddress = address.trim();

  if (!normalizedAddress) return null;

  return `https://www.google.com/maps?q=${encodeURIComponent(normalizedAddress)}&output=embed`;
}

export function buildGoogleMapsExternalUrl(address: string): string | null {
  const normalizedAddress = address.trim();

  if (!normalizedAddress) return null;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(normalizedAddress)}`;
}

export function normalizeGoogleMapsEmbedUrl(url?: string, address?: string): string | null {
  const normalizedUrl = url?.trim() ?? "";

  if (!normalizedUrl) {
    return buildGoogleMapsEmbedUrl(address ?? "");
  }

  try {
    const parsed = new URL(normalizedUrl);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const pathname = parsed.pathname.toLowerCase();

    if (host === "google.com" || host === "maps.google.com") {
      if (pathname.includes("/maps/embed") || parsed.searchParams.get("output") === "embed") {
        return normalizedUrl;
      }
    }

    if (host.endsWith("google.com") || host === "maps.app.goo.gl") {
      return buildGoogleMapsEmbedUrl(address ?? "");
    }

    return normalizedUrl;
  } catch {
    return buildGoogleMapsEmbedUrl(address ?? "");
  }
}
