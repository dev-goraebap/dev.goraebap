export interface GlossaryDomain {
  id: string;
  label: string;
  order: number;
  count: number;
  categories: string[];
}

export interface GlossaryEntry {
  id: string;
  domain: string;
  domainLabel: string;
  category: string;
  term: string;
  korean?: string;
  definition: string;
  distinction?: string;
  stacks?: Record<string, string>;
  components?: string[];
  autoLink: string[];
}

interface ParsedDomainGlossary {
  domain: GlossaryDomain;
  entries: GlossaryEntry[];
  byId: Record<string, GlossaryEntry>;
  pattern: RegExp | null;
  labelToId: Map<string, string>;
}

const RAW_GLOSSARY_FILES = import.meta.glob<string>("/content/glossary/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

const ESCAPE = /[.*+?^${}()|[\]\\]/g;

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const normalized = raw.replace(/\r\n/g, "\n");
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(normalized);
  if (!match) return { meta: {}, body: normalized };
  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const kv = /^([a-zA-Z0-9_-]+):\s*(.*)$/.exec(line.trim());
    if (kv) meta[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, "");
  }
  return { meta, body: match[2] };
}

function parseGlossaryFile(filePath: string, raw: string): ParsedDomainGlossary {
  const slug = filePath.replace(/^.*\/([^/]+)\.md$/, "$1");
  const { meta, body } = parseFrontmatter(raw);
  const domainId = meta.domain || slug;
  const domainLabel = meta.label || domainId;
  const order = Number.isFinite(Number(meta.order)) ? Number(meta.order) : 99;

  const categories: string[] = [];
  const entries: GlossaryEntry[] = [];
  let currentCategory = "";
  let current: (GlossaryEntry & { _explicitAutoLink?: boolean }) | null = null;
  let inStacks = false;

  const flush = () => {
    if (current && current.id) {
      if (!current._explicitAutoLink) {
        const fallback = current.korean ?? current.term;
        current.autoLink = fallback.length >= 2 ? [fallback] : [];
      }
      const { _explicitAutoLink: _ignored, ...clean } = current;
      void _ignored;
      entries.push(clean);
    }
    current = null;
    inStacks = false;
  };

  for (const rawLine of body.split("\n")) {
    const line = rawLine.trimEnd();
    if (line.startsWith("## ")) {
      flush();
      currentCategory = line.slice(3).trim();
      if (currentCategory && !categories.includes(currentCategory)) {
        categories.push(currentCategory);
      }
      continue;
    }
    if (line.startsWith("### ")) {
      flush();
      const heading = line.slice(4).trim();
      const match = /^(.+?)\s*\(([^)]+)\)$/.exec(heading);
      current = {
        id: "",
        domain: domainId,
        domainLabel,
        category: currentCategory,
        korean: match ? match[1].trim() : undefined,
        term: (match ? match[2].trim() : heading).replace(/`/g, ""),
        definition: "",
        autoLink: [],
      };
      continue;
    }
    if (!current) continue;

    if (inStacks) {
      const stackMatch = /^\s+-\s+([^:]+):\s*(.+)$/.exec(line);
      if (stackMatch) {
        current.stacks = current.stacks ?? {};
        current.stacks[stackMatch[1].trim()] = stackMatch[2].trim();
        continue;
      }
      if (line.trim() !== "") inStacks = false;
    }

    const field = /^-\s+\*\*([^*]+)\*\*:\s*(.*)$/.exec(line);
    if (!field) continue;
    const [, key, value] = field;
    const trimmed = value.trim();

    if (key === "id") {
      current.id = trimmed.replace(/^`|`$/g, "");
    } else if (key === "정의") {
      current.definition = trimmed;
    } else if (key === "구분") {
      current.distinction = trimmed;
    } else if (key === "스택 매핑") {
      inStacks = true;
    } else if (key === "관련 컴포넌트") {
      const list = trimmed
        .split(",")
        .map((item) => item.trim().replace(/^`|`$/g, ""))
        .filter(Boolean);
      if (list.length > 0) current.components = list;
    } else if (key === "자동 연결") {
      current._explicitAutoLink = true;
      if (trimmed === "없음" || trimmed.toLowerCase() === "false" || trimmed === "none") {
        current.autoLink = [];
      } else {
        current.autoLink = trimmed
          .split(",")
          .map((item) => item.trim().replace(/^`|`$/g, ""))
          .filter(Boolean);
      }
    }
  }
  flush();

  const byId = Object.fromEntries(entries.map((entry) => [entry.id, entry]));
  const autoTerms = entries
    .flatMap((entry) => entry.autoLink.map((word) => ({ id: entry.id, word })))
    .filter((item) => item.word.length >= 2)
    .sort((a, b) => b.word.length - a.word.length);

  const pattern =
    autoTerms.length > 0
      ? new RegExp(
          `(?<![가-힣A-Za-z0-9-])(${autoTerms.map(({ word }) => word.replace(ESCAPE, "\\$&")).join("|")})(?![A-Za-z0-9-])`,
          "g",
        )
      : null;
  const labelToId = new Map(autoTerms.map(({ id, word }) => [word, id]));

  return {
    domain: { id: domainId, label: domainLabel, order, count: entries.length, categories },
    entries,
    byId,
    pattern,
    labelToId,
  };
}

const PARSED_DOMAINS: ParsedDomainGlossary[] = Object.entries(RAW_GLOSSARY_FILES)
  .map(([filePath, raw]) => parseGlossaryFile(filePath, raw))
  .sort((a, b) => a.domain.order - b.domain.order || a.domain.id.localeCompare(b.domain.id));

const DOMAIN_MAP = new Map(PARSED_DOMAINS.map((item) => [item.domain.id, item]));

export const GLOSSARY_DOMAINS: GlossaryDomain[] = PARSED_DOMAINS.map((item) => item.domain);

export const GLOSSARY_ENTRIES: GlossaryEntry[] = PARSED_DOMAINS.flatMap((item) => item.entries);

export const GLOSSARY: Record<string, GlossaryEntry> = Object.fromEntries(
  GLOSSARY_ENTRIES.map((entry) => [entry.id, entry]),
);

const EMPTY_DOMAIN: ParsedDomainGlossary = {
  domain: { id: "", label: "", order: 99, count: 0, categories: [] },
  entries: [],
  byId: {},
  pattern: null,
  labelToId: new Map(),
};

export function glossaryForDomain(domain: string): ParsedDomainGlossary {
  return DOMAIN_MAP.get(domain) ?? EMPTY_DOMAIN;
}

export type GlossarySegment = string | { id: string; label: string };

const TERM_MARKUP = /\[\[([\w-]+)\|([^\]]+)\]\]/g;

export function stripGlossaryMarkup(text: string) {
  return text.replace(TERM_MARKUP, "$2");
}

function linkPlainWithDomain(
  domain: string,
  text: string,
  seen: Set<string>,
  segments: GlossarySegment[],
) {
  const { pattern, labelToId } = glossaryForDomain(domain);
  if (!pattern || !text) {
    if (text) segments.push(text);
    return;
  }
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const id = labelToId.get(match[0]);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    if (match.index > cursor) segments.push(text.slice(cursor, match.index));
    segments.push({ id, label: match[0] });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) segments.push(text.slice(cursor));
}

export function annotateDomainPlain(
  domain: string,
  text: string,
  seen: Set<string>,
): GlossarySegment[] {
  const segments: GlossarySegment[] = [];
  linkPlainWithDomain(domain, text, seen, segments);
  return segments.length ? segments : [text];
}

// 디자인 시스템 MDX 및 본문용([[id|라벨]] + design-system 영역 자동 연결)
export function annotateGlossary(texts: [string, string][], componentIds = new Set<string>()) {
  const seen = new Set<string>();
  const result: Record<string, GlossarySegment[]> = {};
  for (const [key, text] of texts) {
    const segments: GlossarySegment[] = [];
    let cursor = 0;
    for (const match of text.matchAll(TERM_MARKUP)) {
      const [markup, id, label] = match;
      linkPlainWithDomain("design-system", text.slice(cursor, match.index), seen, segments);
      if ((GLOSSARY[id] || componentIds.has(id)) && !seen.has(id)) {
        seen.add(id);
        segments.push({ id, label });
      } else {
        segments.push(label);
      }
      cursor = match.index + markup.length;
    }
    linkPlainWithDomain("design-system", text.slice(cursor), seen, segments);
    result[key] = segments;
  }
  return result;
}

export function annotatePlain(text: string, seen: Set<string>): GlossarySegment[] {
  return annotateDomainPlain("design-system", text, seen);
}
