import { useEffect, useState } from "react";
import { SystemIcon } from "@goraebap/ui-react/icons";

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

function useActiveHeading(items: readonly TocItem[]): string {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    setActiveId(items[0]?.id ?? "");
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

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [items]);

  return activeId;
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

export function MobileToc({ items }: { items: readonly TocItem[] }) {
  const [open, setOpen] = useState(false);
  const activeId = useActiveHeading(items);
  if (items.length === 0) return null;

  const activeItem = items.find((item) => item.id === activeId) ?? items[0];

  return (
    <div className="border-border bg-card/50 rounded-xl border xl:hidden">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full cursor-pointer items-center justify-between gap-2 px-3.5 py-2.5 text-left text-xs"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="text-muted-foreground shrink-0 font-semibold">목차</span>
          {activeItem && (
            <span className="text-foreground truncate font-medium">{activeItem.text}</span>
          )}
        </span>
        <SystemIcon
          name="chevronDown"
          className={`text-muted-foreground size-3.5 shrink-0 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <ul className="border-border space-y-0.5 border-t px-2 py-2 text-xs">
          {items.map((item) => {
            const isActive = item.id === activeId;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg py-1.5 break-keep transition-colors ${
                    item.level === 3 ? "pr-2.5 pl-6" : "px-2.5"
                  } ${
                    isActive
                      ? "bg-secondary text-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  }`}
                >
                  {item.text}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
