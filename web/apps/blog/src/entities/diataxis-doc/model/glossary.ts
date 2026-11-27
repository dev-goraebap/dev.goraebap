export type DiataxisSpace = "backend" | "frontend";

export interface DiataxisGlossaryEntry {
  id: string;
  korean: string;
  term: string;
  category: string;
  definition: string;
  distinction?: string;
  stacks?: Record<string, string>;
}

interface ParsedGlossary {
  categories: string[];
  entries: DiataxisGlossaryEntry[];
  byId: Record<string, DiataxisGlossaryEntry>;
  pattern: RegExp | null;
  labelToId: Map<string, string>;
}

const RAW_GLOSSARIES = import.meta.glob<string>("/content/{backend,frontend}/glossary.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

const ESCAPE = /[.*+?^${}()|[\]\\]/g;

function parseGlossary(raw: string): ParsedGlossary {
  const categories: string[] = [];
  const entries: DiataxisGlossaryEntry[] = [];
  let currentCategory = "";
  let current: DiataxisGlossaryEntry | null = null;
  let inStacks = false;

  const flush = () => {
    if (current && current.id) entries.push(current);
    current = null;
    inStacks = false;
  };

  for (const rawLine of raw.replace(/\r\n/g, "\n").split("\n")) {
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
        korean: match ? match[1].trim() : heading,
        term: match ? match[2].trim() : heading,
        category: currentCategory,
        definition: "",
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
    }
  }
  flush();

  const byId = Object.fromEntries(entries.map((entry) => [entry.id, entry]));
  const autoTerms = entries
    .map((entry) => ({ id: entry.id, label: entry.korean }))
    .filter((item) => item.label.length >= 2)
    .sort((a, b) => b.label.length - a.label.length);
  const pattern =
    autoTerms.length > 0
      ? new RegExp(
          `(${autoTerms.map((item) => item.label.replace(ESCAPE, "\\$&")).join("|")})`,
          "g",
        )
      : null;
  const labelToId = new Map(autoTerms.map((item) => [item.label, item.id]));

  return { categories, entries, byId, pattern, labelToId };
}

const GLOSSARIES: Record<DiataxisSpace, ParsedGlossary> = {
  backend: parseGlossary(RAW_GLOSSARIES["/content/backend/glossary.md"] ?? ""),
  frontend: parseGlossary(RAW_GLOSSARIES["/content/frontend/glossary.md"] ?? ""),
};

export function glossaryOf(space: DiataxisSpace) {
  return GLOSSARIES[space];
}

export type DiataxisGlossarySegment = string | { id: string; label: string };

export function annotateDiataxisPlain(
  space: DiataxisSpace,
  text: string,
  seen: Set<string>,
): DiataxisGlossarySegment[] {
  const { pattern, labelToId } = GLOSSARIES[space];
  if (!pattern || !text) return [text];
  const segments: DiataxisGlossarySegment[] = [];
  let cursor = 0;
  pattern.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const label = match[0];
    const id = labelToId.get(label);
    if (!id || seen.has(id)) continue;
    if (match.index > cursor) segments.push(text.slice(cursor, match.index));
    seen.add(id);
    segments.push({ id, label });
    cursor = match.index + label.length;
  }

  if (cursor < text.length) segments.push(text.slice(cursor));
  return segments.length ? segments : [text];
}
