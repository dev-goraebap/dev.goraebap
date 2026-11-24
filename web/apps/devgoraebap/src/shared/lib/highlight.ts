import type { HighlighterCore, LanguageRegistration, ThemedToken } from "shiki/core";

type SupportedLang =
  | "html"
  | "tsx"
  | "typescript"
  | "css"
  | "bash"
  | "json"
  | "angular-html"
  | "angular-ts"
  | "java"
  | "sql"
  | "groovy"
  | "yaml";

const LANG_ALIASES: Record<string, SupportedLang> = {
  html: "html",
  tsx: "tsx",
  jsx: "tsx",
  react: "tsx",
  ts: "typescript",
  typescript: "typescript",
  css: "css",
  bash: "bash",
  sh: "bash",
  shell: "bash",
  json: "json",
  "angular-html": "angular-html",
  "angular-ts": "angular-ts",
  java: "java",
  sql: "sql",
  groovy: "groovy",
  yaml: "yaml",
  yml: "yaml",
  js: "typescript",
  javascript: "typescript",
};

const LANG_LOADERS: Record<SupportedLang, () => Promise<{ default: LanguageRegistration[] }>> = {
  html: () => import("shiki/langs/html.mjs"),
  tsx: () => import("shiki/langs/tsx.mjs"),
  typescript: () => import("shiki/langs/typescript.mjs"),
  css: () => import("shiki/langs/css.mjs"),
  bash: () => import("shiki/langs/bash.mjs"),
  json: () => import("shiki/langs/json.mjs"),
  "angular-html": () => import("shiki/langs/angular-html.mjs"),
  "angular-ts": () => import("shiki/langs/angular-ts.mjs"),
  java: () => import("shiki/langs/java.mjs"),
  sql: () => import("shiki/langs/sql.mjs"),
  groovy: () => import("shiki/langs/groovy.mjs"),
  yaml: () => import("shiki/langs/yaml.mjs"),
};

const DUAL_THEMES = {
  light: "github-light-default",
  dark: "github-dark-default",
} as const;

let highlighterInstance: HighlighterCore | null = null;
let highlighterPromise: Promise<HighlighterCore> | null = null;
const loadedLangs = new Set<string>(["text"]);
const loadingLangs = new Map<string, Promise<void>>();

async function getHighlighter(): Promise<HighlighterCore> {
  if (highlighterInstance) return highlighterInstance;
  if (!highlighterPromise) {
    highlighterPromise = Promise.all([
      import("shiki/core"),
      import("shiki/engine/javascript"),
      import("shiki/themes/github-light-default.mjs"),
      import("shiki/themes/github-dark-default.mjs"),
    ]).then(async ([{ createHighlighterCore }, { createJavaScriptRegexEngine }, light, dark]) => {
      const instance = await createHighlighterCore({
        themes: [light.default, dark.default],
        langs: [],
        engine: createJavaScriptRegexEngine({ forgiving: true }),
      });
      highlighterInstance = instance;
      return instance;
    });
  }
  return highlighterPromise;
}

function normalizeLanguage(language?: string): SupportedLang | "text" {
  if (!language) return "text";
  const key = language.trim().toLowerCase();
  return LANG_ALIASES[key] ?? "text";
}

async function ensureLanguage(hl: HighlighterCore, lang: SupportedLang | "text"): Promise<void> {
  if (loadedLangs.has(lang) || lang === "text") return;
  let pending = loadingLangs.get(lang);
  if (!pending) {
    pending = LANG_LOADERS[lang]()
      .then((mod) => hl.loadLanguage(mod.default))
      .then(() => {
        loadedLangs.add(lang);
      })
      .finally(() => {
        loadingLangs.delete(lang);
      });
    loadingLangs.set(lang, pending);
  }
  await pending;
}

export function detectAngularLanguage(code: string): "angular-html" | "angular-ts" {
  return code.trimStart().startsWith("<") ? "angular-html" : "angular-ts";
}

export function tokenizeCodeSync(code: string, language?: string): ThemedToken[][] | null {
  const lang = normalizeLanguage(language);
  if (lang === "text") {
    return code.split("\n").map((line) => [{ content: line, offset: 0 }]);
  }
  if (!highlighterInstance || !loadedLangs.has(lang)) {
    return null;
  }
  const { tokens } = highlighterInstance.codeToTokens(code, {
    lang,
    themes: DUAL_THEMES,
    defaultColor: false,
  });
  return tokens;
}

export async function tokenizeCodeAsync(code: string, language?: string): Promise<ThemedToken[][]> {
  const lang = normalizeLanguage(language);
  if (lang === "text") {
    return code.split("\n").map((line) => [{ content: line, offset: 0 }]);
  }
  const hl = await getHighlighter();
  await ensureLanguage(hl, lang);
  const { tokens } = hl.codeToTokens(code, {
    lang,
    themes: DUAL_THEMES,
    defaultColor: false,
  });
  return tokens;
}
