import { useState } from "react";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetTitle,
} from "@goraebap/ui-react/components/bottom-sheet";
import { SystemIcon } from "@goraebap/ui-react/icons";
import { useMobileDocBarState } from "@/shared/lib/mobile-doc-bar";
import { useActiveHeading } from "./TableOfContents";

function TocListIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M4 6h16" />
      <path d="M4 12h12" />
      <path d="M8 18h10" opacity={0.65} />
    </svg>
  );
}

export function MobileDocBar() {
  const { sidebar, toc } = useMobileDocBarState();
  const activeId = useActiveHeading(toc);
  const [tocOpen, setTocOpen] = useState(false);

  const hasSidebar = sidebar !== null;
  const hasToc = toc.length > 0;
  if (!hasSidebar && !hasToc) return null;

  // 목차가 있으면 xl 미만(데스크톱 우측 목차가 숨겨진 구간)까지, 사이드바만 있으면 lg 미만에서만 노출한다.
  const visibilityClass = hasToc ? "xl:hidden" : "lg:hidden";

  function scrollToTop() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }

  function jumpToHeading(id: string) {
    setTocOpen(false);
    window.history.replaceState(null, "", `#${id}`);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // BottomSheet 스크롤 잠금이 풀린 뒤 해당 절로 이동한다.
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: reduced ? "auto" : "smooth",
        block: "start",
      });
    }, 80);
  }

  return (
    <>
      {/* 스크롤 끝까지 내렸을 때 본문과 푸터가 하단 액션바에 가리지 않도록 여유 스크롤 영역을 둔다. */}
      <div
        aria-hidden="true"
        className={`h-[calc(5.5rem+env(safe-area-inset-bottom))] shrink-0 ${visibilityClass}`}
      />

      {/* 하단 액션바 뒤를 은은하게 정리하는 그라데이션 */}
      <div
        aria-hidden="true"
        className={`from-background/85 via-background/30 pointer-events-none fixed inset-x-0 bottom-0 z-20 h-24 bg-gradient-to-t to-transparent ${visibilityClass}`}
      />

      <div
        role="region"
        aria-label="문서 빠른 도구"
        className={`pointer-events-none fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 flex justify-center px-4 ${visibilityClass}`}
      >
        <div className="pointer-events-auto flex items-center gap-2.5">
          <div className="border-border/80 bg-card/85 shadow-foreground/5 flex h-12 items-center gap-1 rounded-full border p-1.5 shadow-lg backdrop-blur-xl">
            {sidebar && (
              <button
                type="button"
                aria-label={`${sidebar.label} 열기`}
                onClick={() => sidebar.open()}
                className="text-foreground/90 hover:bg-secondary/80 hover:text-foreground focus-visible:outline-ring inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition-colors focus-visible:outline-2 active:scale-[0.98] lg:hidden"
              >
                <SystemIcon name="workspace" className="size-4 shrink-0" />
                <span>목록</span>
              </button>
            )}

            {hasToc && (
              <button
                type="button"
                aria-expanded={tocOpen}
                aria-label="이 페이지의 목차 열기"
                onClick={() => setTocOpen(true)}
                className={`focus-visible:outline-ring inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition-colors focus-visible:outline-2 active:scale-[0.98] ${
                  tocOpen
                    ? "bg-secondary text-foreground"
                    : "text-foreground/90 hover:bg-secondary/80 hover:text-foreground"
                }`}
              >
                <TocListIcon className="size-4 shrink-0" />
                <span>목차</span>
              </button>
            )}

            <button
              type="button"
              aria-label="맨 위로 이동"
              onClick={scrollToTop}
              className="text-muted-foreground hover:bg-secondary/80 hover:text-foreground focus-visible:outline-ring inline-flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-2 active:scale-[0.98]"
            >
              <SystemIcon name="chevronUp" className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {hasToc && (
        <BottomSheet open={tocOpen} onOpenChange={setTocOpen}>
          <BottomSheetContent>
            <BottomSheetTitle className="mb-3">이 페이지의 목차</BottomSheetTitle>
            <nav aria-label="이 페이지의 목차" data-lenis-prevent>
              <ul className="space-y-1 text-sm">
                {toc.map((item) => {
                  const isActive = item.id === activeId;
                  return (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        aria-current={isActive ? "location" : undefined}
                        onClick={(event) => {
                          event.preventDefault();
                          jumpToHeading(item.id);
                        }}
                        className={`block rounded-xl py-2 break-keep transition-colors ${
                          item.level === 3 ? "pr-3 pl-7 text-[0.8125rem]" : "px-3"
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
            </nav>
          </BottomSheetContent>
        </BottomSheet>
      )}
    </>
  );
}
