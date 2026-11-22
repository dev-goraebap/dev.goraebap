import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { IconProvider, type IconSetId } from "@goraebap/ui-react/icons";

export type BaseThemeId = "app" | "editorial";
export type AccentColorId = "default" | "blue" | "emerald" | "violet" | "amber" | "rose";
export type RadiusOptionId = "0rem" | "0.25rem" | "0.5rem" | "0.75rem" | "1rem";
export type BodyFontId = "pretendard" | "system";
export type HeadingFontId = "same" | "serif" | "mono";

export interface DesignConfig {
  base: BaseThemeId;
  accent: AccentColorId;
  radius: RadiusOptionId;
  font: BodyFontId;
  heading: HeadingFontId;
  iconSet: IconSetId;
}

export const DEFAULT_DESIGN_CONFIG: DesignConfig = {
  base: "app",
  accent: "default",
  radius: "0.5rem",
  font: "pretendard",
  heading: "same",
  iconSet: "solar",
};

export const BASE_OPTIONS: { id: BaseThemeId; label: string; desc: string }[] = [
  { id: "app", label: "App (Neutral)", desc: "중립 무채색 작업 화면" },
  { id: "editorial", label: "Editorial (Warm)", desc: "따뜻한 종이 톤 읽기 화면" },
];

export const ACCENT_OPTIONS: { id: AccentColorId; label: string; swatch: string }[] = [
  { id: "default", label: "Default", swatch: "var(--foreground)" },
  { id: "blue", label: "Blue", swatch: "oklch(0.546 0.245 262.881)" },
  { id: "emerald", label: "Emerald", swatch: "oklch(0.556 0.145 163.225)" },
  { id: "violet", label: "Violet", swatch: "oklch(0.541 0.281 293.009)" },
  { id: "amber", label: "Amber", swatch: "oklch(0.666 0.179 58.318)" },
  { id: "rose", label: "Rose", swatch: "oklch(0.586 0.253 17.585)" },
];

export const RADIUS_OPTIONS: { id: RadiusOptionId; label: string }[] = [
  { id: "0rem", label: "0" },
  { id: "0.25rem", label: "0.25" },
  { id: "0.5rem", label: "0.5" },
  { id: "0.75rem", label: "0.75" },
  { id: "1rem", label: "1.0" },
];

export const FONT_OPTIONS: { id: BodyFontId; label: string; stack: string }[] = [
  {
    id: "pretendard",
    label: "Pretendard",
    stack:
      '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  },
  {
    id: "system",
    label: "System UI",
    stack: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  },
];

export const HEADING_OPTIONS: { id: HeadingFontId; label: string; stack: string }[] = [
  { id: "same", label: "본문과 동일", stack: "var(--font-sans)" },
  {
    id: "serif",
    label: "Noto Serif KR",
    stack: '"Noto Serif KR", Georgia, serif',
  },
  {
    id: "mono",
    label: "JetBrains Mono",
    stack: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  },
];

export const ICON_SET_OPTIONS: { id: IconSetId; label: string; desc: string }[] = [
  { id: "solar", label: "Solar (기본)", desc: "둥근 기하학 스타일" },
  { id: "lucide", label: "Lucide", desc: "단정한 선형 스타일" },
];

const STORAGE_KEY = "goraebap-design-config";

function loadConfig(): DesignConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DESIGN_CONFIG;
    return { ...DEFAULT_DESIGN_CONFIG, ...(JSON.parse(raw) as Partial<DesignConfig>) };
  } catch {
    return DEFAULT_DESIGN_CONFIG;
  }
}

interface DesignConfigContextValue {
  config: DesignConfig;
  updateConfig: <K extends keyof DesignConfig>(key: K, value: DesignConfig[K]) => void;
  resetConfig: () => void;
}

const DesignConfigContext = createContext<DesignConfigContextValue | null>(null);

export function DesignConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<DesignConfig>(loadConfig);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-ds-theme", config.base);
    if (config.accent === "default") {
      root.removeAttribute("data-ds-accent");
    } else {
      root.setAttribute("data-ds-accent", config.accent);
    }
    root.style.setProperty("--radius", config.radius);

    const fontStack = FONT_OPTIONS.find((f) => f.id === config.font)?.stack ?? FONT_OPTIONS[0].stack;
    root.style.setProperty("--font-sans", fontStack);

    const headingStack =
      HEADING_OPTIONS.find((h) => h.id === config.heading)?.stack ?? HEADING_OPTIONS[0].stack;
    root.style.setProperty("--font-heading", headingStack);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Ignore storage quota errors
    }
  }, [config]);

  function updateConfig<K extends keyof DesignConfig>(key: K, value: DesignConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function resetConfig() {
    setConfig(DEFAULT_DESIGN_CONFIG);
  }

  return (
    <DesignConfigContext.Provider value={{ config, updateConfig, resetConfig }}>
      <IconProvider value={config.iconSet}>{children}</IconProvider>
    </DesignConfigContext.Provider>
  );
}

export function useDesignConfig(): DesignConfigContextValue {
  const ctx = useContext(DesignConfigContext);
  if (!ctx) {
    throw new Error("useDesignConfig must be used inside DesignConfigProvider");
  }
  return ctx;
}
