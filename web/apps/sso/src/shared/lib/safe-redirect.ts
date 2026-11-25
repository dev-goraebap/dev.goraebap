const ALLOWED_ROOT_DOMAIN = "goraebap.xyz";

/**
 * Validates SSO `next` redirect targets so external open redirects are rejected.
 * Allows relative paths (`/…`), `*.goraebap.xyz`, and local dev hosts (`localhost`, `127.0.0.1`).
 */
export function resolveSafeNextUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }
    const host = parsed.hostname.toLowerCase();
    const isGoraebap = host === ALLOWED_ROOT_DOMAIN || host.endsWith(`.${ALLOWED_ROOT_DOMAIN}`);
    const isLocal = host === "localhost" || host === "127.0.0.1";
    if (!isGoraebap && !isLocal) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
