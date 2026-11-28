import { useEffect, useState } from "react";

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

export function headingToAnchor(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

function stripInlineMarkdown(line: string): string {
  return line
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\s+#+\s*$/, "")
    .trim();
}

export function extractHeadingsFromMarkdown(source: string): TocItem[] {
  if (!source) return [];
  const withoutFrontmatter = source.replace(/^---[\s\S]*?---\s*/, "");
  const items: TocItem[] = [];
  let inFence = false;

  for (const rawLine of withoutFrontmatter.replace(/\r\n/g, "\n").split("\n")) {
    const trimmed = rawLine.trim();
    if (/^(`{3,}|~{3,})/.test(trimmed)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = /^(#{2,3})\s+(.+)$/.exec(trimmed);
    if (!match) continue;
    const level = match[1].length as 2 | 3;
    const text = stripInlineMarkdown(match[2]);
    if (!text) continue;
    items.push({ id: headingToAnchor(text), text, level });
  }

  return items;
}

export function useActiveHeading(items: readonly TocItem[]): string {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    if (items.length === 0) return;

    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const update = () => {
      const scrollY = window.scrollY;
      const offset = 120;
      if (scrollY + window.innerHeight >= document.documentElement.scrollHeight - 24) {
        setActiveId(elements[elements.length - 1].id);
        return;
      }
      let current = elements[0].id;
      for (const el of elements) {
        if (el.getBoundingClientRect().top <= offset) {
          current = el.id;
        } else {
          break;
        }
      }
      setActiveId(current);
    };

    const raf = window.requestAnimationFrame(update);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", update);
    };
  }, [items]);

  return items.some((item) => item.id === activeId) ? activeId : (items[0]?.id ?? "");
}

export function TableOfContents({ items }: { items: readonly TocItem[] }) {
  const activeId = useActiveHeading(items);
  if (items.length === 0) return null;

  return (
    <nav aria-label="이 페이지의 목차" className="space-y-2.5">
      <p className="text-muted-foreground text-xs font-semibold">목차</p>
      <ul className="border-border flex flex-col border-l text-[0.8125rem] leading-snug">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "location" : undefined}
                className={`block py-1.5 break-keep transition-colors ${
                  item.level === 3 ? "pl-6" : "pl-3"
                } ${
                  isActive
                    ? "border-foreground text-foreground -ml-px border-l-2 font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
