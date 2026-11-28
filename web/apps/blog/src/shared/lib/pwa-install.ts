import { useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const THEME_COLOR_MAP: Record<string, { light: string; dark: string }> = {
  app: { light: "#f9f9fa", dark: "#1b1b1e" },
  editorial: { light: "#fdfcfa", dark: "#18181b" },
  ocean: { light: "#f7f9fc", dark: "#171f2c" },
  forest: { light: "#f7faf8", dark: "#17201c" },
  terracotta: { light: "#fbf9f6", dark: "#211c19" },
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let initialized = false;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

export function initPwaInstallCapture() {
  if (typeof window === "undefined" || initialized) return;
  initialized = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): boolean {
  return deferredPrompt !== null;
}

function getServerSnapshot(): boolean {
  return false;
}

export function usePwaInstall() {
  const canInstall = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  async function promptInstall(): Promise<boolean> {
    if (!deferredPrompt) return false;
    const promptEvent = deferredPrompt;
    deferredPrompt = null;
    notify();
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    return outcome === "accepted";
  }

  return { canInstall, promptInstall };
}

/** 현재 다크·라이트 모드와 테마 프리셋에 맞춰 PWA 타이틀바(theme-color)를 동기화한다. */
export function syncThemeColor(theme?: string, dark?: boolean) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const isDark = dark ?? root.classList.contains("dark");
  const activeTheme = theme ?? root.getAttribute("data-ds-theme") ?? "app";
  const palette = THEME_COLOR_MAP[activeTheme] ?? THEME_COLOR_MAP.app;
  const color = isDark ? palette.dark : palette.light;

  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.append(meta);
  }
  meta.content = color;
}
