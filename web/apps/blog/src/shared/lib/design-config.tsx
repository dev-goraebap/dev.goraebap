import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { IconProvider, type IconSetId } from "@goraebap/ui-react/icons";
import { syncThemeColor } from "./pwa-install";

type ThemePresetId = "app" | "editorial" | "ocean" | "forest" | "terracotta";
export type RadiusOptionId = "0rem" | "0.25rem" | "0.5rem" | "0.75rem" | "1rem";
export type CornerShapeId = "round" | "squircle";
export type BodyFontId =
  "pretendard" | "suit" | "wanted" | "plex" | "gowun" | "noto-serif" | "maru" | "system";
export type HeadingFontId = "same" | BodyFontId | "mono";
export type LatinFontId = "same" | "inter" | "geist" | "dm-sans" | "source-serif";
export type UiSizeId = "93.75%" | "100%" | "112.5%" | "125%";

export interface DesignConfig {
  theme: ThemePresetId;
  uiSize: UiSizeId;
  radius: RadiusOptionId;
  cornerShape: CornerShapeId;
  font: BodyFontId;
  heading: HeadingFontId;
  latinFont: LatinFontId;
  iconSet: IconSetId;
  // 기본 영문 폰트가 바뀐 판. 예전 판에 저장한 값은 새 기본값으로 옮긴다.
  fontRevision: number;
}

const DEFAULT_DESIGN_CONFIG: DesignConfig = {
  theme: "app",
  uiSize: "100%",
  radius: "0.5rem",
  cornerShape: "round",
  font: "pretendard",
  heading: "same",
  latinFont: "source-serif",
  iconSet: "solar",
  fontRevision: 2,
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

export const UI_SIZE_OPTIONS: { id: UiSizeId; label: string }[] = [
  { id: "93.75%", label: "작게" },
  { id: "100%", label: "기본" },
  { id: "112.5%", label: "크게" },
  { id: "125%", label: "더 크게" },
];

export const RADIUS_OPTIONS: { id: RadiusOptionId; label: string }[] = [
  { id: "0rem", label: "0" },
  { id: "0.25rem", label: "0.25" },
  { id: "0.5rem", label: "0.5" },
  { id: "0.75rem", label: "0.75" },
  { id: "1rem", label: "1.0" },
];

export const CORNER_SHAPE_OPTIONS: { id: CornerShapeId; label: string }[] = [
  { id: "round", label: "원형" },
  { id: "squircle", label: "초타원" },
];

const googleFont = (family: string) =>
  `https://fonts.googleapis.com/css2?family=${family}&display=swap`;

export const FONT_OPTIONS: { id: BodyFontId; label: string; stack: string; href?: string }[] = [
  {
    id: "pretendard",
    label: "Pretendard",
    stack:
      '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  },
  {
    id: "suit",
    label: "SUIT",
    stack: '"SUIT Variable", system-ui, sans-serif',
    href: "https://cdn.jsdelivr.net/gh/sun-typeface/SUIT@2/fonts/variable/woff2/SUIT-Variable.css",
  },
  {
    id: "wanted",
    label: "Wanted Sans",
    stack: '"Wanted Sans Variable", system-ui, sans-serif',
    href: "https://cdn.jsdelivr.net/gh/wanteddev/wanted-sans@v1.0.3/packages/wanted-sans/fonts/webfonts/variable/split/WantedSansVariable.min.css",
  },
  {
    id: "plex",
    label: "IBM Plex Sans KR",
    stack: '"IBM Plex Sans KR", system-ui, sans-serif',
    href: googleFont("IBM+Plex+Sans+KR:wght@400;500;600;700"),
  },
  {
    id: "gowun",
    label: "고운돋움",
    stack: '"Gowun Dodum", system-ui, sans-serif',
    href: googleFont("Gowun+Dodum"),
  },
  {
    id: "noto-serif",
    label: "Noto Serif KR",
    stack: '"Noto Serif KR", Georgia, serif',
    href: googleFont("Noto+Serif+KR:wght@400;500;600;700"),
  },
  {
    id: "maru",
    label: "마루 부리",
    stack: '"Maru Buri", Georgia, serif',
  },
  {
    id: "system",
    label: "System UI",
    stack: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  },
];

const MONO_STACK = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

export const HEADING_OPTIONS: { id: HeadingFontId; label: string }[] = [
  { id: "same", label: "본문과 동일" },
  ...FONT_OPTIONS.filter((option) => option.id !== "system").map(({ id, label }) => ({
    id,
    label,
  })),
  { id: "mono", label: "JetBrains Mono" },
];

// 한글 글리프가 없는 폰트를 앞에 두면 영문만 이 폰트로 그려진다.
export const LATIN_FONT_OPTIONS: {
  id: LatinFontId;
  label: string;
  family?: string;
  href?: string;
}[] = [
  { id: "same", label: "본문과 동일" },
  {
    id: "inter",
    label: "Inter",
    family: '"Inter"',
    href: googleFont("Inter:wght@400;500;600;700"),
  },
  {
    id: "geist",
    label: "Geist",
    family: '"Geist"',
    href: googleFont("Geist:wght@400;500;600;700"),
  },
  {
    id: "dm-sans",
    label: "DM Sans",
    family: '"DM Sans"',
    href: googleFont("DM+Sans:wght@400;500;600;700"),
  },
  {
    id: "source-serif",
    label: "Source Serif 4",
    family: '"Source Serif 4"',
    href: googleFont("Source+Serif+4:wght@400;500;600;700"),
  },
];

function loadFontStylesheet(href?: string) {
  if (!href || document.querySelector(`link[data-ds-font="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.dsFont = href;
  document.head.append(link);
}

export const ICON_SET_OPTIONS: { id: IconSetId; label: string }[] = [
  { id: "solar", label: "Solar" },
  { id: "lucide", label: "Lucide" },
];

const STORAGE_KEY = "goraebap-design-config-v2";

function loadConfig(): DesignConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DESIGN_CONFIG;
    const stored = { ...DEFAULT_DESIGN_CONFIG, ...(JSON.parse(raw) as Partial<DesignConfig>) };
    const isKnownSize = UI_SIZE_OPTIONS.some((option) => option.id === stored.uiSize);
    // 예전에 저장한 제목 폰트 값을 새 이름으로 옮긴다.
    const heading = (stored.heading as string) === "serif" ? "noto-serif" : stored.heading;
    const isOldFont =
      (JSON.parse(raw) as Partial<DesignConfig>).fontRevision !==
      DEFAULT_DESIGN_CONFIG.fontRevision;
    return {
      ...stored,
      heading,
      latinFont: isOldFont ? DEFAULT_DESIGN_CONFIG.latinFont : stored.latinFont,
      fontRevision: DEFAULT_DESIGN_CONFIG.fontRevision,
      uiSize: isKnownSize ? stored.uiSize : DEFAULT_DESIGN_CONFIG.uiSize,
    };
  } catch {
    return DEFAULT_DESIGN_CONFIG;
  }
}

// 빌드 때 정적 페이지를 만드는 서버에는 document가 없다. 그때는 기본값으로 그리고 브라우저가 이어받는다.
const isBrowser = typeof document !== "undefined";

function applyUiSize(size: UiSizeId) {
  if (!isBrowser) return;
  document.documentElement.style.setProperty("--ui-size", size);
}

interface DesignConfigContextValue {
  config: DesignConfig;
  /** 브라우저 글꼴 설정까지 반영한 1rem과 16px의 비율 */
  rootScale: number;
  updateConfig: <K extends keyof DesignConfig>(key: K, value: DesignConfig[K]) => void;
  resetConfig: () => void;
}

const DesignConfigContext = createContext<DesignConfigContextValue | null>(null);

export function DesignConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<DesignConfig>(() => {
    const initial = loadConfig();
    applyUiSize(initial.uiSize);
    return initial;
  });
  const rootScale = isBrowser
    ? parseFloat(getComputedStyle(document.documentElement).fontSize) / 16
    : 1;

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-ds-theme", config.theme);
    root.removeAttribute("data-ds-accent");
    syncThemeColor(config.theme);
    root.style.setProperty("--radius", config.radius);

    root.style.setProperty("--ds-corner-shape", config.cornerShape);

    const body = FONT_OPTIONS.find((f) => f.id === config.font) ?? FONT_OPTIONS[0];
    const latin = LATIN_FONT_OPTIONS.find((f) => f.id === config.latinFont);
    const heading = FONT_OPTIONS.find((f) => f.id === config.heading);
    const latinPrefix = latin?.family ? `${latin.family}, ` : "";
    [body.href, heading?.href, latin?.href].forEach(loadFontStylesheet);

    root.style.setProperty("--font-sans", `${latinPrefix}${body.stack}`);
    root.style.setProperty(
      "--font-heading",
      config.heading === "mono"
        ? MONO_STACK
        : heading
          ? `${latinPrefix}${heading.stack}`
          : "var(--font-sans)",
    );

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Ignore storage quota errors
    }
  }, [config]);

  function updateConfig<K extends keyof DesignConfig>(key: K, value: DesignConfig[K]) {
    if (key === "uiSize") applyUiSize(value as UiSizeId);
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function resetConfig() {
    applyUiSize(DEFAULT_DESIGN_CONFIG.uiSize);
    setConfig(DEFAULT_DESIGN_CONFIG);
  }

  return (
    <DesignConfigContext.Provider value={{ config, rootScale, updateConfig, resetConfig }}>
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
