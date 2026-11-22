import { useEffect, useState } from "react";
import type { ThemePresetId } from "./design-config";

export const PREVIEW_SYNC_TYPE = "goraebap-preview-sync";

export type PreviewAdapter = "html" | "react";
export type PreviewTheme = ThemePresetId;

const ALLOWED_THEMES: readonly PreviewTheme[] = [
  "app",
  "editorial",
  "ocean",
  "forest",
  "terracotta",
];

export interface PreviewSyncPayload {
  type: typeof PREVIEW_SYNC_TYPE;
  adapter?: PreviewAdapter;
  theme?: PreviewTheme;
  dark?: boolean;
}

function readInitialDark(): boolean {
  if (typeof window === "undefined") return true;
  try {
    if (window.parent && window.parent !== window) {
      return window.parent.document.documentElement.classList.contains("dark");
    }
  } catch {
    // cross-origin fallback
  }
  const saved = window.localStorage.getItem("goraebap-design-mode");
  if (saved === "light") return false;
  if (saved === "dark") return true;
  return document.documentElement.classList.contains("dark");
}

function readInitialParam<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const value = new URLSearchParams(window.location.search).get(key);
  if (value && (allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  return fallback;
}

export function usePreviewSync(defaults?: { adapter?: PreviewAdapter; theme?: PreviewTheme }) {
  const [adapter, setAdapter] = useState<PreviewAdapter>(() =>
    readInitialParam("adapter", ["html", "react"] as const, defaults?.adapter ?? "html"),
  );
  const [theme, setTheme] = useState<PreviewTheme>(() =>
    readInitialParam("theme", ALLOWED_THEMES, defaults?.theme ?? "app"),
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", readInitialDark());

    function handleMessage(event: MessageEvent<unknown>) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as Partial<PreviewSyncPayload> | null;
      if (!data || data.type !== PREVIEW_SYNC_TYPE) return;

      if (typeof data.dark === "boolean") {
        document.documentElement.classList.toggle("dark", data.dark);
      }
      if (data.adapter === "html" || data.adapter === "react") {
        setAdapter(data.adapter);
      }
      if (data.theme && (ALLOWED_THEMES as readonly string[]).includes(data.theme)) {
        setTheme(data.theme);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return { adapter, theme };
}
