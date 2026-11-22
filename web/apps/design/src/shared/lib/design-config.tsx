import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { IconProvider, type IconSetId } from "@goraebap/ui-react/icons";

export type ThemePresetId = "app" | "editorial" | "ocean" | "forest" | "terracotta";
export type RadiusOptionId = "0rem" | "0.25rem" | "0.5rem" | "0.75rem" | "1rem";
export type BodyFontId = "pretendard" | "system";
export type HeadingFontId = "same" | "serif" | "mono";

export interface DesignConfig {
  theme: ThemePresetId;
  radius: RadiusOptionId;
  font: BodyFontId;
  heading: HeadingFontId;
  iconSet: IconSetId;
}

const DEFAULT_DESIGN_CONFIG: DesignConfig = {
  theme: "app",
  radius: "0.5rem",
  font: "pretendard",
  heading: "same",
  iconSet: "solar",
};

export interface ThemePresetOption {
  id: ThemePresetId;
  name: string;
  subtitle: string;
  cssFile: string;
  swatches: [string, string, string, string];
}

export const THEME_PRESETS: ThemePresetOption[] = [
  {
    id: "app",
    name: "Neutral",
    subtitle: "정제된 무채색 작업 화면",
    cssFile: "@goraebap/design-system/styles/theme-app.css",
    swatches: ["#efeff0", "#f9f9fa", "#ffffff", "#1b1b1b"],
  },
  {
    id: "editorial",
    name: "Editorial",
    subtitle: "따뜻한 종이 톤의 읽기 화면",
    cssFile: "@goraebap/design-system/styles/theme-editorial.css",
    swatches: ["#f5f4f0", "#fdfcfa", "#ffffff", "#25262b"],
  },
  {
    id: "ocean",
    name: "Ocean",
    subtitle: "차분한 슬레이트 블루 · 오션",
    cssFile: "@goraebap/design-system/styles/theme-ocean.css",
    swatches: ["#eaf0f8", "#f7f9fc", "#ffffff", "#2c64c6"],
  },
  {
    id: "forest",
    name: "Forest",
    subtitle: "은은한 세이지 · 딥 포레스트",
    cssFile: "@goraebap/design-system/styles/theme-forest.css",
    swatches: ["#ebf2ee", "#f7faf8", "#ffffff", "#2d6e52"],
  },
  {
    id: "terracotta",
    name: "Terracotta",
    subtitle: "따뜻한 샌드 · 테라코타",
    cssFile: "@goraebap/design-system/styles/theme-terracotta.css",
    swatches: ["#f4eee8", "#fbf9f6", "#ffffff", "#b85c38"],
  },
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

export const ICON_SET_OPTIONS: { id: IconSetId; label: string }[] = [
  { id: "solar", label: "Solar" },
  { id: "lucide", label: "Lucide" },
];

const STORAGE_KEY = "goraebap-design-config-v2";

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
    root.setAttribute("data-ds-theme", config.theme);
    root.removeAttribute("data-ds-accent");
    root.style.setProperty("--radius", config.radius);

    const fontStack =
      FONT_OPTIONS.find((f) => f.id === config.font)?.stack ?? FONT_OPTIONS[0].stack;
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
