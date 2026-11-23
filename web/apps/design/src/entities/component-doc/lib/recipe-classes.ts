export const CLASS_GROUPS = ["Spacing", "Typography", "Color", "Shape", "Motion", "State"] as const;

export type ClassGroup = (typeof CLASS_GROUPS)[number];

const COLOR_TOKENS = new Set([
  "sidebar",
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "success",
  "warning",
  "info",
  "border",
  "input",
  "ring",
]);

// bg-primary/90처럼 테마 색을 쓰는 클래스면 칩에 칠할 CSS 색을 돌려준다.
export function classColor(token: string) {
  const utility = token.slice(token.lastIndexOf(":") + 1);
  const match = utility.match(
    /^(?:bg|text|border|ring|outline|fill|stroke)-([a-z-]+?)(?:\/(\d+))?$/,
  );
  if (!match || !COLOR_TOKENS.has(match[1])) return undefined;
  return match[2]
    ? `color-mix(in srgb, var(--${match[1]}) ${match[2]}%, transparent)`
    : `var(--${match[1]})`;
}

export function classGroup(token: string): ClassGroup | null {
  if (token.includes(":")) return "State";
  if (classColor(token)) return "Color";
  if (/^(transition|duration|ease|animate|delay)/.test(token)) return "Motion";
  if (/^(rounded|border|shadow|ring|outline)/.test(token)) return "Shape";
  if (/^(text-|font-|tracking|leading|whitespace|truncate)/.test(token)) return "Typography";
  if (/^(h-|w-|size-|min-|max-|p[xytblr]?-|m[xytblr]?-|gap-|space-)/.test(token)) return "Spacing";
  return null;
}
