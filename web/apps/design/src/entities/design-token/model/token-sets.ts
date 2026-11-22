import baseCss from "@goraebap/design-system/styles/base.css?raw";
import appCss from "@goraebap/design-system/styles/theme-app.css?raw";
import editorialCss from "@goraebap/design-system/styles/theme-editorial.css?raw";
import forestCss from "@goraebap/design-system/styles/theme-forest.css?raw";
import oceanCss from "@goraebap/design-system/styles/theme-ocean.css?raw";
import terracottaCss from "@goraebap/design-system/styles/theme-terracotta.css?raw";

export type TokenMode = "light" | "dark";
export type TokenValues = Record<string, string>;

export interface TokenSet {
  id: string;
  name: string;
  source: string;
  light: TokenValues;
  dark: TokenValues;
}

export interface TokenGroup {
  title: string;
  tokens: { name: string; value: string }[];
}

const DECLARATION = /(--[\w-]+)\s*:\s*([^;]+);/g;

function stripComments(css: string) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function readDeclarations(body: string, into: TokenValues) {
  for (const [, name, value] of body.matchAll(DECLARATION)) {
    into[name] = value.replace(/\s+/g, " ").trim();
  }
}

function parseTokenSet(id: string, name: string, source: string, css: string): TokenSet {
  const light: TokenValues = {};
  const dark: TokenValues = {};
  for (const [, selector, body] of stripComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    readDeclarations(body, selector.includes(".dark") ? dark : light);
  }
  return { id, name, source, light, dark };
}

// 토큰 세트를 더할 때는 패키지에 CSS를 두고 이 목록에 한 줄을 더합니다.
export const TOKEN_SETS: TokenSet[] = [
  parseTokenSet("app", "Neutral", "theme-app.css", appCss),
  parseTokenSet("editorial", "Editorial", "theme-editorial.css", editorialCss),
  parseTokenSet("ocean", "Ocean", "theme-ocean.css", oceanCss),
  parseTokenSet("forest", "Forest", "theme-forest.css", forestCss),
  parseTokenSet("terracotta", "Terracotta", "theme-terracotta.css", terracottaCss),
];

const COLOR_GROUPS = [
  { title: "Surface", names: ["--sidebar", "--background", "--card", "--popover"] },
  {
    title: "Text",
    names: ["--foreground", "--card-foreground", "--popover-foreground", "--muted-foreground"],
  },
  {
    title: "Action",
    names: [
      "--primary",
      "--primary-foreground",
      "--secondary",
      "--secondary-foreground",
      "--muted",
      "--accent",
      "--accent-foreground",
    ],
  },
  {
    title: "Status",
    names: ["--destructive", "--destructive-foreground", "--success", "--warning", "--info"],
  },
  { title: "Line", names: ["--border", "--input", "--ring"] },
];

const NON_COLOR_TOKENS = new Set(["--radius"]);

export function resolveTokens(set: TokenSet, mode: TokenMode): TokenValues {
  return mode === "dark" ? { ...set.light, ...set.dark } : { ...set.light };
}

export function groupColorTokens(values: TokenValues): TokenGroup[] {
  const known = new Set(COLOR_GROUPS.flatMap((group) => group.names));
  const groups = COLOR_GROUPS.map((group) => ({
    title: group.title,
    tokens: group.names
      .filter((name) => name in values)
      .map((name) => ({ name, value: values[name] })),
  }));
  const others = Object.keys(values)
    .filter((name) => !known.has(name) && !NON_COLOR_TOKENS.has(name))
    .map((name) => ({ name, value: values[name] }));
  return [...groups, { title: "Other", tokens: others }].filter((group) => group.tokens.length > 0);
}

function readScale(prefix: string) {
  const values: TokenValues = {};
  readDeclarations(stripComments(baseCss), values);
  return Object.entries(values)
    .filter(([name]) => name.startsWith(prefix))
    .map(([name, value]) => ({ name, value }));
}

export const RADIUS_SCALE = readScale("--radius-");
export const FONT_FAMILIES = readScale("--font-");
