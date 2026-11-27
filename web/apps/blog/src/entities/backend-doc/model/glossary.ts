const GLOSSARY_RAW =
  Object.values(
    import.meta.glob<string>("/content/backend/glossary.md", {
      query: "?raw",
      import: "default",
      eager: true,
    }),
  )[0] ?? "";

export interface BackendGlossaryEntry {
  id: string;
  korean: string;
  term: string;
  category: string;
  definition: string;
  distinction?: string;
  stacks?: Record<string, string>;
}

function parseGlossary(raw: string): {
  categories: string[];
  entries: BackendGlossaryEntry[];
} {
  const categories: string[] = [];
  const entries: BackendGlossaryEntry[] = [];
  let currentCategory = "";
  let current: BackendGlossaryEntry | null = null;
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
  return { categories, entries };
}

const PARSED = parseGlossary(GLOSSARY_RAW);

export const BACKEND_GLOSSARY_CATEGORIES = PARSED.categories;
export const BACKEND_GLOSSARY_ENTRIES = PARSED.entries;
export const BACKEND_GLOSSARY_BY_ID: Record<string, BackendGlossaryEntry> = Object.fromEntries(
  PARSED.entries.map((entry) => [entry.id, entry]),
);

const AUTO_TERMS = PARSED.entries
  .map((entry) => ({ id: entry.id, label: entry.korean }))
  .filter((item) => item.label.length >= 2)
  .sort((a, b) => b.label.length - a.label.length);

const ESCAPE = /[.*+?^${}()|[\]\\]/g;
const AUTO_PATTERN =
  AUTO_TERMS.length > 0
    ? new RegExp(
        `(${AUTO_TERMS.map((item) => item.label.replace(ESCAPE, "\\$&")).join("|")})`,
        "g",
      )
    : null;
const LABEL_TO_ID = new Map(AUTO_TERMS.map((item) => [item.label, item.id]));

export type BackendGlossarySegment = string | { id: string; label: string };

export function annotateBackendPlain(
  text: string,
  seen: Set<string>,
): BackendGlossarySegment[] {
  if (!AUTO_PATTERN || !text) return [text];
  const segments: BackendGlossarySegment[] = [];
  let cursor = 0;
  AUTO_PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = AUTO_PATTERN.exec(text)) !== null) {
    const label = match[0];
    const id = LABEL_TO_ID.get(label);
    if (!id || seen.has(id)) continue;
    if (match.index > cursor) segments.push(text.slice(cursor, match.index));
    seen.add(id);
    segments.push({ id, label });
    cursor = match.index + label.length;
  }

  if (cursor < text.length) segments.push(text.slice(cursor));
  return segments.length ? segments : [text];
}
