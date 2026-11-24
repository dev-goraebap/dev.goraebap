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
  tokens: { name: string; value: string; role: string }[];
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
  { title: "면", names: ["--sidebar", "--background", "--card", "--popover"] },
  {
    title: "글자",
    names: ["--foreground", "--card-foreground", "--popover-foreground", "--muted-foreground"],
  },
  {
    title: "동작",
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
    title: "상태",
    names: ["--destructive", "--destructive-foreground", "--success", "--warning", "--info"],
  },
  { title: "선", names: ["--border", "--input", "--ring"] },
];

const TOKEN_ROLES: Record<string, string> = {
  "--sidebar": "사이드바와 앱 바깥 바닥 면",
  "--background": "페이지의 기본 배경 면",
  "--card": "배경 위 카드와 패널 면",
  "--popover": "화면 위 팝오버와 메뉴 면",
  "--foreground": "기본 배경 위 글자와 아이콘",
  "--card-foreground": "카드 위 글자와 아이콘",
  "--popover-foreground": "팝오버 위 글자와 아이콘",
  "--muted-foreground": "설명·보조 글자와 아이콘",
  "--primary": "주요 동작과 강조 요소 배경",
  "--primary-foreground": "주요 동작 위 글자와 아이콘",
  "--secondary": "보조 동작과 태그 배경",
  "--secondary-foreground": "보조 동작 위 글자와 아이콘",
  "--muted": "비활성·보조 영역 배경",
  "--accent": "호버와 선택 상태의 배경",
  "--accent-foreground": "호버와 선택 상태의 글자와 아이콘",
  "--destructive": "파괴적 동작과 오류 상태",
  "--destructive-foreground": "파괴적 동작 위 글자와 아이콘",
  "--success": "완료와 성공 상태 표시",
  "--warning": "주의와 경고 상태 표시",
  "--info": "안내와 진행 상태 표시",
  "--border": "카드와 영역의 경계선",
  "--input": "입력 컨트롤의 테두리",
  "--ring": "키보드 포커스 표시",
};

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
      .map((name) => ({ name, value: values[name], role: TOKEN_ROLES[name] ?? "" })),
  }));
  const others = Object.keys(values)
    .filter((name) => !known.has(name) && !NON_COLOR_TOKENS.has(name))
    .map((name) => ({ name, value: values[name], role: TOKEN_ROLES[name] ?? "" }));
  return [...groups, { title: "기타", tokens: others }].filter((group) => group.tokens.length > 0);
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
