import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "@goraebap/ui-react/components/button";
import { Input } from "@goraebap/ui-react/components/input";
import { SystemIcon } from "@goraebap/ui-react/icons";
import { useDebouncedValue } from "@/shared/lib/use-debounced-value";
import { useHeightTransition } from "@/shared/lib/use-height-transition";
import { PageState } from "@/shared/ui";
import { DOC_GROUPS, searchDocs, type DocEntry } from "../model/search-index";

const SEARCH_DEBOUNCE_MS = 200;
const LIST_ID = "doc-search-results";
const DOC_SEARCH_INPUT_ID = "doc-search-input";
const optionId = (index: number) => `doc-search-option-${index}`;

export interface DocSearchPanelProps {
  surface: "dialog" | "page";
  initialQuery?: string;
  onQueryChange?: (query: string) => void;
  onExpand?: (query: string) => void;
  closeButton?: ReactNode;
  onOpen: (entry: DocEntry) => void;
}

export function DocSearchPanel({
  surface,
  initialQuery = "",
  onQueryChange,
  onExpand,
  closeButton,
  onOpen,
}: DocSearchPanelProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [activeIndex, setActiveIndex] = useState(0);
  // 입력을 지우면 기다리지 않고 바로 추천 목록으로 돌아간다.
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const settledQuery = query.trim() ? debouncedQuery : "";
  const isSearching = settledQuery.trim().length > 0;
  const isPending = query.trim() !== settledQuery.trim();
  const onQueryChangeRef = useRef(onQueryChange);
  const sentQueryRef = useRef(initialQuery);
  const isDialog = surface === "dialog";
  useHeightTransition(rootRef);

  // 검색 중에는 관련도 순서를, 추천 목록은 문서 묶음 순서를 그대로 보여 준다.
  const { results, sections } = useMemo(() => {
    const found = searchDocs(settledQuery);
    const ordered = isSearching
      ? found
      : DOC_GROUPS.flatMap((group) => found.filter((entry) => entry.group === group));
    const grouped = isSearching
      ? [{ group: "검색 결과", items: ordered }]
      : DOC_GROUPS.map((group) => ({
          group: group as string,
          items: ordered.filter((entry) => entry.group === group),
        })).filter((section) => section.items.length > 0);
    return { results: ordered, sections: grouped };
  }, [settledQuery, isSearching]);

  useEffect(() => {
    onQueryChangeRef.current = onQueryChange;
  });

  useEffect(() => {
    if (settledQuery === sentQueryRef.current) return;
    sentQueryRef.current = settledQuery;
    onQueryChangeRef.current?.(settledQuery);
  }, [settledQuery]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`#${optionId(activeIndex)}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, results]);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (isPending || results.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((index) => (index + step + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      // 결과가 갱신되기 전에 눌러도 지금 입력한 검색어의 첫 결과로 간다.
      const target = isPending ? searchDocs(query)[0] : results[activeIndex];
      if (target) onOpen(target);
    }
  }

  let cursor = -1;

  return (
    <div
      ref={rootRef}
      className={`flex flex-col motion-safe:animate-[page-state-enter_240ms_cubic-bezier(0.2,0,0,1)_both] ${
        isDialog ? "min-h-[24rem]" : ""
      }`}
    >
      <div className={`flex items-center gap-1 ${isDialog ? "border-border border-b p-2" : ""}`}>
        <div className="relative min-w-0 flex-1">
          <SystemIcon
            name="search"
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          />
          <Input
            id={DOC_SEARCH_INPUT_ID}
            autoFocus
            role="combobox"
            aria-label="문서 검색"
            aria-expanded="true"
            aria-controls={LIST_ID}
            aria-autocomplete="list"
            aria-activedescendant={results.length > 0 ? optionId(activeIndex) : undefined}
            autoComplete="off"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="문서 검색"
            className={
              isDialog
                ? "border-transparent bg-transparent pl-9 focus-visible:border-transparent focus-visible:ring-0"
                : "bg-card h-11 pl-9"
            }
          />
        </div>
        {onExpand && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="페이지로 보기"
            title="페이지로 보기"
            onClick={() => onExpand(query)}
            className="text-muted-foreground hover:text-foreground size-8 shrink-0"
          >
            <SystemIcon name="externalLink" className="size-4" />
          </Button>
        )}
        {closeButton}
      </div>

      <div
        ref={listRef}
        id={LIST_ID}
        role="listbox"
        aria-label="검색 결과"
        data-lenis-prevent={isDialog ? true : undefined}
        className={
          isDialog ? "max-h-[min(26rem,55dvh)] overflow-y-auto overscroll-contain p-2" : "mt-4"
        }
      >
        {results.length === 0 ? (
          <PageState
            kind="search"
            isCompact
            title="검색 결과가 없습니다"
            description={`"${settledQuery.trim()}"에 해당하는 문서가 없습니다.`}
          />
        ) : (
          sections.map((section) => (
            <div key={section.group} role="group" aria-label={section.group} className="mb-2">
              <p className="text-muted-foreground px-3 py-1.5 text-xs font-medium">
                {section.group}
              </p>
              {section.items.map((entry) => {
                cursor += 1;
                const index = cursor;
                const isActive = index === activeIndex;
                return (
                  <div
                    key={entry.id}
                    id={optionId(index)}
                    role="option"
                    aria-selected={isActive}
                    onPointerMove={() => setActiveIndex(index)}
                    onClick={() => onOpen(entry)}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 ${
                      isActive ? "bg-accent" : ""
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{entry.title}</span>
                      <span className="text-muted-foreground block truncate text-xs">
                        {entry.description}
                      </span>
                    </span>
                    {isSearching && (
                      <span className="text-muted-foreground shrink-0 text-xs">{entry.group}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
