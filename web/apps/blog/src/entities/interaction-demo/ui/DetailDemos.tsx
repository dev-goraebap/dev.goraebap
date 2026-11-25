import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Badge } from "@goraebap/ui-react/components/badge";
import { Button } from "@goraebap/ui-react/components/button";

const CLASSIC_SCROLLBAR = "[&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-thumb]:bg-border";

function DemoRows({ count }: { count: number }) {
  return (
    <div className="divide-border divide-y text-xs">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="bg-secondary/50 px-3 py-2">
          항목 {index + 1}
        </div>
      ))}
    </div>
  );
}

function DemoPanel({
  label,
  className,
  count,
}: {
  label: string;
  className: string;
  count: number;
}) {
  return (
    <figure className="min-w-0 space-y-2">
      <figcaption className="text-muted-foreground font-mono text-[0.6875rem]">{label}</figcaption>
      <div className={`border-border bg-card h-44 rounded-lg border ${className}`}>
        <DemoRows count={count} />
      </div>
    </figure>
  );
}

export function ScrollbarGutterDemo() {
  const [isLong, setIsLong] = useState(false);
  const count = isLong ? 12 : 3;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <DemoPanel
          label="overflow-y: auto"
          className={`overflow-y-auto ${CLASSIC_SCROLLBAR}`}
          count={count}
        />
        <DemoPanel
          label="scrollbar-gutter: stable"
          className={`[scrollbar-gutter:stable] overflow-y-auto ${CLASSIC_SCROLLBAR}`}
          count={count}
        />
      </div>
      <Button variant="outline" size="sm" onClick={() => setIsLong((value) => !value)}>
        {isLong ? "내용 줄이기" : "내용 늘리기"}
      </Button>
    </div>
  );
}

export function ThinScrollbarDemo() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <DemoPanel
        label="기본 스크롤바"
        className="demo-default-scrollbar overflow-y-auto"
        count={12}
      />
      <DemoPanel label="얇은 커스텀 스크롤바 (6px)" className="overflow-y-auto" count={12} />
    </div>
  );
}

const TRANSITION_PAGES = [
  {
    id: "overview",
    label: "개요",
    title: "워크스페이스 개요",
    body: "최근 배포 4건이 정상 완료되었습니다. 응답이 빠르거나 캐시에 있으면 스켈레톤 없이 바로 전환합니다.",
    meta: "활성 멤버 12명 · 정상 운영",
  },
  {
    id: "projects",
    label: "프로젝트",
    title: "진행 중인 프로젝트",
    body: "데이터를 불러오는 동안에도 이전 화면을 유지해 빈 화면이나 레이아웃 점프를 막습니다.",
    meta: "총 6개 프로젝트 · 마감 임박 2건",
  },
  {
    id: "activity",
    label: "활동",
    title: "최근 변경 기록",
    body: "임계 시간(180ms)을 넘길 때만 상단에 얇은 프로그레스바를 띄우고, 준비가 끝나면 View Transition으로 교체합니다.",
    meta: "오늘 업데이트 18건",
  },
] as const;

type TransitionPageId = (typeof TRANSITION_PAGES)[number]["id"];

const LATENCY_OPTIONS = [
  { id: "fast", label: "빠름 (120ms)", ms: 120 },
  { id: "slow", label: "느림 (750ms)", ms: 750 },
] as const;

const PENDING_THRESHOLD_MS = 150;

export function PageTransitionDemo() {
  const [activeId, setActiveId] = useState<TransitionPageId>("overview");
  const [pendingId, setPendingId] = useState<TransitionPageId | null>(null);
  const [showBar, setShowBar] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number>(750);
  const [cached, setCached] = useState<Set<TransitionPageId>>(() => new Set(["overview"]));
  const [status, setStatus] = useState("다른 탭을 눌러 전환 방식을 확인해 보세요.");

  const barTimerRef = useRef<number | null>(null);
  const loadTimerRef = useRef<number | null>(null);

  function clearTimers() {
    if (barTimerRef.current !== null) {
      window.clearTimeout(barTimerRef.current);
      barTimerRef.current = null;
    }
    if (loadTimerRef.current !== null) {
      window.clearTimeout(loadTimerRef.current);
      loadTimerRef.current = null;
    }
  }

  useEffect(() => clearTimers, []);

  function commitPage(nextId: TransitionPageId, message: string) {
    const apply = () => {
      setActiveId(nextId);
      setPendingId(null);
      setShowBar(false);
      setStatus(message);
    };
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => void;
    };
    if (typeof doc.startViewTransition === "function") {
      doc.startViewTransition(() => flushSync(apply));
    } else {
      apply();
    }
  }

  function navigateTo(nextId: TransitionPageId) {
    if (nextId === activeId && !pendingId) return;
    clearTimers();

    if (cached.has(nextId)) {
      commitPage(nextId, "캐시 적중 (0ms) — 대기 없이 즉시 전환했습니다.");
      return;
    }

    setPendingId(nextId);
    setShowBar(false);
    setStatus(`불러오는 중... (${latencyMs}ms)`);

    barTimerRef.current = window.setTimeout(() => {
      setShowBar(true);
    }, PENDING_THRESHOLD_MS);

    loadTimerRef.current = window.setTimeout(() => {
      clearTimers();
      setCached((prev) => new Set(prev).add(nextId));
      commitPage(
        nextId,
        latencyMs >= PENDING_THRESHOLD_MS
          ? `${latencyMs}ms — 임계 시간(${PENDING_THRESHOLD_MS}ms) 초과로 상단 프로그레스바 표시 후 전환했습니다.`
          : `${latencyMs}ms — 임계 시간(${PENDING_THRESHOLD_MS}ms) 이내라 프로그레스바 없이 바로 전환했습니다.`,
      );
    }, latencyMs);
  }

  function resetCache() {
    clearTimers();
    setPendingId(null);
    setShowBar(false);
    setCached(new Set([activeId]));
    setStatus("캐시를 비웠습니다. 다른 탭을 누르면 다시 응답 지연을 체험합니다.");
  }

  const current = TRANSITION_PAGES.find((p) => p.id === activeId) ?? TRANSITION_PAGES[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {LATENCY_OPTIONS.map((opt) => (
            <Button
              key={opt.id}
              size="sm"
              variant={latencyMs === opt.ms ? "default" : "outline"}
              onClick={() => setLatencyMs(opt.ms)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="ghost" onClick={resetCache}>
          캐시 비우기
        </Button>
      </div>

      <div className="border-border bg-card relative overflow-hidden rounded-xl border">
        {/* Top delayed progress bar */}
        <div
          aria-hidden={!showBar}
          className={`bg-primary absolute inset-x-0 top-0 h-0.5 origin-left transition-opacity duration-150 ${
            showBar ? "animate-pulse opacity-100" : "opacity-0"
          }`}
        />

        <div className="border-border flex items-center justify-between gap-2 border-b px-4 py-2.5">
          <nav aria-label="전환 예제 메뉴" className="flex items-center gap-1">
            {TRANSITION_PAGES.map((page) => {
              const isSelected = page.id === activeId;
              const isPending = page.id === pendingId;
              return (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => navigateTo(page.id)}
                  className={
                    isSelected
                      ? "bg-secondary text-foreground cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium"
                      : isPending
                        ? "text-foreground/70 cursor-pointer rounded-md px-2.5 py-1 text-xs"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground cursor-pointer rounded-md px-2.5 py-1 text-xs transition-colors"
                  }
                >
                  {page.label}
                </button>
              );
            })}
          </nav>
          <Badge variant="outline" className="font-mono text-[0.625rem]">
            캐시 {cached.size}/{TRANSITION_PAGES.length}
          </Badge>
        </div>

        <div className="space-y-2 p-5" style={{ viewTransitionName: "detail-demo-page" }}>
          <h3 className="text-sm font-semibold">{current.title}</h3>
          <p className="text-muted-foreground text-xs leading-relaxed">{current.body}</p>
          <p className="text-muted-foreground pt-1 font-mono text-[0.6875rem]">{current.meta}</p>
        </div>
      </div>

      <p className="text-muted-foreground text-xs">{status}</p>
    </div>
  );
}

export function FontLoadingDemo() {
  const [phase, setPhase] = useState<"idle" | "loading" | "ready">("ready");
  const timerRef = useRef<number | null>(null);

  function replay() {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    setPhase("loading");
    timerRef.current = window.setTimeout(() => {
      setPhase("ready");
      timerRef.current = null;
    }, 360);
  }

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <figure className="space-y-2">
          <figcaption className="text-muted-foreground font-mono text-[0.6875rem]">
            font-display: swap (즉시 노출 후 교체)
          </figcaption>
          <div className="border-border bg-card space-y-1.5 rounded-lg border p-4">
            <p
              className="text-base font-semibold"
              style={{
                fontFamily: phase === "loading" ? "Georgia, serif" : "var(--font-sans)",
              }}
            >
              가독성이 좋은 디자인 시스템
            </p>
            <p
              className="text-muted-foreground text-xs leading-relaxed"
              style={{
                fontFamily: phase === "loading" ? "Georgia, serif" : "var(--font-sans)",
              }}
            >
              폰트가 뒤늦게 적용되면서 줄바꿈과 글자 폭이 한 번 흔들립니다.
            </p>
          </div>
        </figure>

        <figure className="space-y-2">
          <figcaption className="text-muted-foreground font-mono text-[0.6875rem]">
            document.fonts.ready + 짧은 대기 게이트
          </figcaption>
          <div className="border-border bg-card space-y-1.5 rounded-lg border p-4">
            <div
              className={`space-y-1.5 transition-opacity duration-150 ${
                phase === "loading" ? "opacity-0" : "opacity-100"
              }`}
            >
              <p className="text-base font-semibold">가독성이 좋은 디자인 시스템</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                짧은 임계 시간 안에서 폰트가 준비된 뒤 한 번에 그려져 흔들림이 없습니다.
              </p>
            </div>
          </div>
        </figure>
      </div>

      <Button size="sm" variant="outline" onClick={replay}>
        새로고침 시뮬레이션
      </Button>
    </div>
  );
}

export function InitialBootDemo() {
  const [stage, setStage] = useState<"booting" | "ready">("ready");
  const timerRef = useRef<number | null>(null);

  function replay() {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    setStage("booting");
    timerRef.current = window.setTimeout(() => {
      setStage("ready");
      timerRef.current = null;
    }, 650);
  }

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <div className="space-y-4">
      <div className="border-border bg-card relative h-48 overflow-hidden rounded-xl border">
        {stage === "booting" ? (
          <div className="bg-background flex h-full flex-col items-center justify-center gap-2.5 p-6">
            <div className="border-border border-t-primary size-5 animate-spin rounded-full border-2" />
            <p className="text-muted-foreground text-xs">세션·권한·초기 데이터를 불러오는 중...</p>
          </div>
        ) : (
          <div className="flex h-full flex-col justify-between p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">워크스페이스 대시보드</p>
              <Badge variant="outline" className="text-[0.625rem]">
                초기화 완료
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["활성 프로젝트 6", "미확인 알림 2", "배포 정상"].map((text) => (
                <div
                  key={text}
                  className="border-border bg-background rounded-lg border px-3 py-2 text-xs font-medium"
                >
                  {text}
                </div>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">
              폰트와 초기 데이터가 모두 준비된 완성 화면을 한 번에 표시합니다.
            </p>
          </div>
        )}
      </div>

      <Button size="sm" variant="outline" onClick={replay}>
        초기 진입 시뮬레이션
      </Button>
    </div>
  );
}

const MASK_POSTS = [
  { id: "42", title: "단일 원본 디자인 시스템 설계", summary: "토큰과 레시피를 공유하는 구조" },
  {
    id: "43",
    title: "페이지 전환과 로딩 대기",
    summary: "임계 시간 프로그레스바와 View Transition",
  },
];

export function RouteMaskingDemo() {
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [standalone, setStandalone] = useState(false);

  const selected = MASK_POSTS.find((p) => p.id === selectedId) ?? null;
  const currentUrl = selected ? `/posts/${selected.id}` : "/posts";

  function openPost(id: string) {
    setSelectedId(id);
    setStandalone(viewport === "mobile");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant={viewport === "desktop" ? "default" : "outline"}
            onClick={() => {
              setViewport("desktop");
              if (selectedId) setStandalone(false);
            }}
          >
            데스크톱 (모달 마스킹)
          </Button>
          <Button
            size="sm"
            variant={viewport === "mobile" ? "default" : "outline"}
            onClick={() => {
              setViewport("mobile");
              if (selectedId) setStandalone(true);
            }}
          >
            모바일 (전체 페이지)
          </Button>
        </div>
        {selected && !standalone && (
          <Button size="sm" variant="secondary" onClick={() => setStandalone(true)}>
            새로고침 시뮬레이션
          </Button>
        )}
      </div>

      <div className="border-border bg-card relative overflow-hidden rounded-xl border">
        <div className="border-border bg-muted/40 flex items-center justify-between border-b px-3.5 py-2 font-mono text-[0.6875rem]">
          <span className="text-foreground">{currentUrl}</span>
          <Badge variant="outline" className="text-[0.625rem]">
            {!selected ? "목록" : standalone ? "독립 상세 페이지" : "목록 위 모달 (Masked)"}
          </Badge>
        </div>

        <div className="relative min-h-44 p-4">
          {selected && standalone ? (
            <div className="space-y-2.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedId(null);
                  setStandalone(false);
                }}
              >
                ← 목록으로
              </Button>
              <h3 className="text-sm font-semibold">{selected.title}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {selected.summary}. 모바일이나 URL 직접 진입·새로고침 시에는 독립 페이지로
                렌더링됩니다.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {MASK_POSTS.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => openPost(post.id)}
                  className="border-border bg-background hover:bg-accent/50 flex w-full cursor-pointer items-center justify-between rounded-lg border px-3.5 py-2.5 text-left transition-colors"
                >
                  <div>
                    <p className="text-xs font-medium">{post.title}</p>
                    <p className="text-muted-foreground text-[0.6875rem]">{post.summary}</p>
                  </div>
                  <span className="text-muted-foreground font-mono text-[0.6875rem]">
                    /posts/{post.id}
                  </span>
                </button>
              ))}
            </div>
          )}

          {selected && !standalone && (
            <div className="bg-foreground/20 absolute inset-0 flex items-center justify-center p-4 backdrop-blur-[1px]">
              <div className="border-border bg-popover w-full max-w-sm space-y-2.5 rounded-xl border p-4 shadow-lg">
                <p className="text-xs font-semibold">{selected.title}</p>
                <p className="text-muted-foreground text-[0.6875rem] leading-relaxed">
                  배경 목록은 유지되고 주소창만 /posts/{selected.id}로 바뀝니다. 새로고침하면 독립
                  상세 페이지로 열립니다.
                </p>
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" onClick={() => setSelectedId(null)}>
                    닫기
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
