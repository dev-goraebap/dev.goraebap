import { useEffect, useState, useSyncExternalStore } from "react";

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

// 클릭으로 선택한 목차(특히 페이지 하단이라 상단 기준선까지 못 올라오는 절)는
// 사용자가 다시 직접 스크롤할 때까지 선택 상태를 유지한다.
let pinnedHeadingId: string | null = null;
let pinnedAt = 0;
let pinnedScrollY: number | null = null;
let lastItemsKey = "";
const pinListeners = new Set<() => void>();

function emitPin() {
  for (const listener of pinListeners) listener();
}

function subscribePin(listener: () => void) {
  pinListeners.add(listener);
  return () => {
    pinListeners.delete(listener);
  };
}

function getPinnedSnapshot() {
  return pinnedHeadingId;
}

function getPinnedServerSnapshot() {
  return null;
}

export function pinActiveHeading(id: string) {
  pinnedHeadingId = id;
  pinnedAt = typeof performance !== "undefined" ? performance.now() : 0;
  pinnedScrollY = null;
  emitPin();
}

function clearPinnedHeading() {
  if (pinnedHeadingId === null) return;
  pinnedHeadingId = null;
  pinnedScrollY = null;
  emitPin();
}

const TOP_OFFSET = 120;
const SCROLL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
]);

export function useActiveHeading(items: readonly TocItem[]): string {
  const itemsKey = items.map((item) => item.id).join("\n");
  const [scrollActiveId, setScrollActiveId] = useState(items[0]?.id ?? "");
  const pinnedId = useSyncExternalStore(
    subscribePin,
    getPinnedSnapshot,
    getPinnedServerSnapshot,
  );

  useEffect(() => {
    if (!itemsKey) return;
    const ids = itemsKey.split("\n");

    if (itemsKey !== lastItemsKey) {
      lastItemsKey = itemsKey;
      clearPinnedHeading();
      const hashId = decodeURIComponent(window.location.hash.replace(/^#/, ""));
      if (hashId && ids.includes(hashId)) {
        pinActiveHeading(hashId);
      }
    }

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const computeScrollActive = () => {
      const scrollY = window.scrollY;
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const remaining = Math.max(0, maxScroll - scrollY);

      // 하단 영역의 짧은 절들이 TOP_OFFSET까지 못 올라오더라도 순차적으로 선택되도록
      // 페이지 끝부분에서는 기준선을 마지막 제목의 최종 위치까지 부드럽게 내린다.
      const lastRestTop = elements[elements.length - 1].getBoundingClientRect().top - remaining;
      const maxThreshold = Math.max(TOP_OFFSET, lastRestTop + 8);
      const bottomZone = Math.min(maxScroll, Math.max(180, window.innerHeight * 0.45));
      const progress =
        bottomZone > 0 && remaining < bottomZone ? 1 - remaining / bottomZone : 0;
      const threshold = TOP_OFFSET + progress * (maxThreshold - TOP_OFFSET);

      let current = elements[0].id;
      for (const el of elements) {
        if (el.getBoundingClientRect().top <= threshold) {
          current = el.id;
        } else {
          break;
        }
      }
      setScrollActiveId(current);
    };

    const handleScroll = () => {
      if (pinnedHeadingId !== null) {
        // 클릭 직후 프로그래밍 스크롤(최대 ~650ms)이 끝난 뒤 스크롤바 드래그 등으로
        // 위치가 달라지면 고정을 푼다.
        const elapsed = performance.now() - pinnedAt;
        if (elapsed > 650) {
          if (pinnedScrollY === null) {
            pinnedScrollY = window.scrollY;
          } else if (Math.abs(window.scrollY - pinnedScrollY) > 6) {
            clearPinnedHeading();
          }
        }
      }
      computeScrollActive();
    };

    const handleUserScrollInput = () => {
      if (pinnedHeadingId !== null) clearPinnedHeading();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (pinnedHeadingId !== null && SCROLL_KEYS.has(event.key)) {
        clearPinnedHeading();
      }
    };

    const raf = window.requestAnimationFrame(computeScrollActive);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("wheel", handleUserScrollInput, { passive: true });
    window.addEventListener("touchmove", handleUserScrollInput, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", handleUserScrollInput);
      window.removeEventListener("touchmove", handleUserScrollInput);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [itemsKey]);

  if (pinnedId && items.some((item) => item.id === pinnedId)) return pinnedId;
  return items.some((item) => item.id === scrollActiveId) ? scrollActiveId : (items[0]?.id ?? "");
}

export function TableOfContents({ items }: { items: readonly TocItem[] }) {
  const activeId = useActiveHeading(items);
  if (items.length === 0) return null;

  function handleSelect(id: string) {
    pinActiveHeading(id);
    window.history.replaceState(null, "", `#${id}`);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
  }

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
                onClick={(event) => {
                  event.preventDefault();
                  handleSelect(item.id);
                }}
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
