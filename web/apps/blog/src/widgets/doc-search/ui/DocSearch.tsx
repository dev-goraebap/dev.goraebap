import { Suspense, lazy, useEffect, useRef } from "react";
import { useLocation, useNavigate, useRouter } from "@tanstack/react-router";
import { Button } from "@goraebap/ui-react/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@goraebap/ui-react/components/dialog";
import { SystemIcon } from "@goraebap/ui-react/icons";
import { useIsMobile } from "@goraebap/ui-react/lib/use-is-mobile";
import type { DocSearchPanelProps } from "./DocSearchPanel";

// 문서 전체 목록은 검색을 열 때만 불러온다.
const LazyDocSearchPanel = lazy(() =>
  import("./DocSearchPanel").then((module) => ({ default: module.DocSearchPanel })),
);

const SHORTCUT =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘K" : "Ctrl K";

function SearchLoading() {
  return (
    <div
      role="status"
      aria-label="문서 목록을 불러오는 중"
      className="flex min-h-[24rem] items-center justify-center motion-safe:animate-[page-state-enter_200ms_120ms_both]"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="text-muted-foreground size-5 animate-spin"
      >
        <path
          d="M12 3a9 9 0 1 0 9 9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function DocSearchContent(props: DocSearchPanelProps) {
  return (
    <Suspense fallback={<SearchLoading />}>
      <LazyDocSearchPanel {...props} />
    </Suspense>
  );
}

export function DocSearch() {
  const router = useRouter();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const currentSearch = location.search as Record<string, unknown>;
  const isOpen = currentSearch.panel === "search";
  const isSearchPage = location.pathname.replace(/\/$/, "") === "/search";

  function openSearch() {
    if (isSearchPage) {
      document.getElementById("doc-search-input")?.focus();
    } else if (isMobile) {
      void navigate({ to: "/search" });
    } else if (!isOpen) {
      // 데스크톱은 지금 페이지 위 모달로 열고 주소만 /search로 보여 준다. 새로고침하면 페이지가 된다.
      void navigate({
        to: location.pathname,
        hash: location.hash,
        search: { ...currentSearch, panel: "search" } as never,
        mask: { to: "/search", unmaskOnReload: true },
        resetScroll: false,
      });
    }
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (isOpen) router.history.back();
        else openSearch();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // 모달을 연 채 창을 좁히면 모바일 규칙대로 페이지로 옮긴다.
  useEffect(() => {
    if (isOpen && isMobile) void navigate({ to: "/search", replace: true });
  }, [isOpen, isMobile, navigate]);

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        size="sm"
        shape="pill"
        aria-label="문서 검색"
        onClick={openSearch}
        className="bg-secondary/60 text-muted-foreground hover:text-foreground size-8 p-0 lg:w-48 lg:justify-between lg:px-3"
      >
        <span className="flex items-center gap-2">
          <SystemIcon name="search" className="size-4" />
          <span className="hidden font-normal lg:inline">문서 검색</span>
        </span>
        <kbd className="hidden font-sans text-[0.6875rem] lg:inline">{SHORTCUT}</kbd>
      </Button>
      <Dialog
        open={isOpen && !isMobile}
        onOpenChange={(next) => {
          if (!next) router.history.back();
        }}
      >
        <DialogContent
          showCloseButton={false}
          finalFocus={triggerRef}
          className="gap-0 overflow-hidden p-0 sm:max-w-xl"
        >
          <DialogTitle className="sr-only">문서 검색</DialogTitle>
          <DocSearchContent
            surface="dialog"
            closeButton={
              <DialogClose
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="닫기"
                    className="text-muted-foreground hover:text-foreground size-8 shrink-0"
                  />
                }
              >
                <SystemIcon name="close" className="size-4" />
              </DialogClose>
            }
            onExpand={(query) =>
              void navigate({
                to: "/search",
                search: { q: query.trim() || undefined },
                replace: true,
              })
            }
            onOpen={(entry) => void navigate({ to: entry.href, hash: entry.hash, replace: true })}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
