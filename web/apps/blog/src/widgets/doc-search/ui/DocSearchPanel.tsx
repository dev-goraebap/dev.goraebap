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
  onBack?: () => void;
  closeButton?: ReactNode;
  onOpen: (entry: DocEntry) => void;
}

export function DocSearchPanel({
  surface,
  initialQuery = "",
  onQueryChange,
  onExpand,
  onBack,
  closeButton,
  onOpen,
}: DocSearchPanelProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const keyboardNavRef = useRef(false);
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
  useHeightTransition(rootRef, isDialog);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

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
    if (!keyboardNavRef.current) return;
    keyboardNavRef.current = false;
    listRef.current
      ?.querySelector(`#${optionId(activeIndex)}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, results]);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (isPending || results.length === 0) return;
      keyboardNavRef.current = true;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((index) => (index + step + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      // 결과가 갱신되기 전에 눌러도 지금 입력한 검색어의 첫 결과로 간다.
      const target = isPending ? searchDocs(query)[0] : results[activeIndex];
      if (target) onOpen(target);
    } else if (event.key === "Escape" && !isDialog) {
      event.preventDefault();
      if (query) {
        setQuery("");
        setActiveIndex(0);
      } else {
        onBack?.();
      }
    }
  }

  function clearQuery() {
    setQuery("");
    setActiveIndex(0);
    inputRef.current?.focus();
  }

  let cursor = -1;

  const inputField = (
    <div className="relative min-w-0 flex-1">
      <SystemIcon
        name="search"
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
      />
      <Input
        ref={inputRef}
        id={DOC_SEARCH_INPUT_ID}
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
            ? "border-transparent bg-transparent pr-9 pl-10 focus-visible:border-transparent focus-visible:ring-0"
            : "border-border/60 bg-secondary/60 focus-visible:border-border focus-visible:bg-secondary/80 h-10 rounded-full pr-9 pl-10 focus-visible:ring-0"
        }
      />
      {query && (
        <button
          type="button"
          aria-label="검색어 지우기"
          onClick={clearQuery}
          className="text-muted-foreground hover:text-foreground focus-visible:outline-ring absolute top-1/2 right-2.5 inline-flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-2"
        >
          <SystemIcon name="close" className="size-3.5" />
        </button>
      )}
    </div>
  );

  const resultsList = (
    <div
      ref={listRef}
      id={LIST_ID}
      role="listbox"
      aria-label="검색 결과"
      data-lenis-prevent={isDialog ? true : undefined}
      className={
        isDialog
          ? "max-h-[min(26rem,55dvh)] overflow-y-auto overscroll-contain p-2"
          : "mx-auto w-full max-w-2xl px-4 py-4 pb-12 sm:px-6"
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
          <div key={section.group} role="group" aria-label={section.group} className="mb-3">
            <p className="text-muted-foreground px-3 py-1.5 text-xs font-medium">{section.group}</p>
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
                  className={`flex cursor-pointer scroll-mt-16 items-center justify-between gap-3 rounded-lg px-3 py-2 ${
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
  );

  if (isDialog) {
    return (
      <div
        ref={rootRef}
        className="flex min-h-[24rem] flex-col motion-safe:animate-[page-state-enter_240ms_cubic-bezier(0.2,0,0,1)_both]"
      >
        <div className="border-border flex items-center gap-1 border-b p-2">
          {inputField}
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
        {resultsList}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="flex min-h-screen flex-col">
      <header className="border-border/80 bg-background/85 sticky top-0 z-30 border-b backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center gap-2 px-4 sm:px-6">
          {onBack && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              shape="pill"
              aria-label="이전 화면으로 돌아가기"
              title="돌아가기"
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground -ml-1.5 size-9 shrink-0"
            >
              <SystemIcon name="chevronLeft" className="size-5" />
            </Button>
          )}
          {inputField}
        </div>
      </header>
      <main className="flex-1">
        <h1 className="sr-only">문서 검색</h1>
        {resultsList}
      </main>
    </div>
  );
}
