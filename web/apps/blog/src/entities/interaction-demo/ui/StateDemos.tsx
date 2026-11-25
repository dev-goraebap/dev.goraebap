import { useEffect, useRef, useState } from "react";
import { Button } from "@goraebap/ui-react/components/button";
import { Input } from "@goraebap/ui-react/components/input";
import { ToggleGroup, ToggleGroupItem } from "@goraebap/ui-react/components/toggle-group";
import { useHeightTransition } from "@/shared/lib/use-height-transition";
import { PageState } from "@/shared/ui";

const STATES = [
  {
    id: "empty",
    label: "Empty",
    title: "아직 문서가 없습니다",
    action: "문서 만들기",
  },
  {
    id: "search",
    label: "No Results",
    title: "검색 결과가 없습니다",
    action: "검색어 지우기",
  },
  {
    id: "not-found",
    label: "404",
    title: "페이지를 찾을 수 없습니다",
    description: "주소가 바뀌었거나 없는 문서입니다.",
    action: "처음으로",
  },
  {
    id: "error",
    label: "Error",
    title: "화면을 불러오지 못했습니다",
    description: "잠시 후 다시 시도해 주세요.",
    action: "다시 시도",
  },
] as const;

export function UiStatesDemo() {
  const [stateId, setStateId] = useState<(typeof STATES)[number]["id"]>("empty");
  const current = STATES.find((state) => state.id === stateId) ?? STATES[0];

  return (
    <div className="space-y-4">
      <ToggleGroup
        aria-label="화면 상태"
        value={[stateId]}
        onValueChange={(next) => {
          if (next[0]) setStateId(next[0] as typeof stateId);
        }}
        className="mx-auto grid w-full max-w-md grid-cols-4"
      >
        {STATES.map((state) => (
          <ToggleGroupItem key={state.id} value={state.id} size="sm" className="w-full px-0">
            {state.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div className="border-border bg-card rounded-lg border">
        <PageState
          key={current.id}
          kind={current.id}
          isCompact
          title={current.title}
          description={"description" in current ? current.description : undefined}
          action={
            <Button variant="outline" size="sm">
              {current.action}
            </Button>
          }
        />
      </div>
    </div>
  );
}

const SPINNER_DELAY_MS = 150;
const REQUESTS = [
  { label: "빠른 응답 · 3건", delay: 80, count: 3 },
  { label: "느린 응답 · 7건", delay: 1200, count: 7 },
  { label: "느린 응답 · 1건", delay: 1200, count: 1 },
];

export function LoadingFeedbackDemo() {
  const panelRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const [count, setCount] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  useHeightTransition(panelRef);

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);

  function request(delay: number, nextCount: number) {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    setIsLoading(true);
    setShowSpinner(false);
    timers.current = [
      window.setTimeout(() => setShowSpinner(true), SPINNER_DELAY_MS),
      window.setTimeout(() => {
        setCount(nextCount);
        setIsLoading(false);
        setShowSpinner(false);
      }, delay),
    ];
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-center gap-2">
        {REQUESTS.map((item) => (
          <Button
            key={item.label}
            variant="outline"
            size="sm"
            onClick={() => request(item.delay, item.count)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <div
        ref={panelRef}
        aria-busy={isLoading}
        className="border-border bg-card relative mx-auto max-w-sm overflow-hidden rounded-lg border"
      >
        <ul
          className={`divide-border divide-y text-sm transition-opacity duration-150 ${
            showSpinner ? "opacity-40" : ""
          }`}
        >
          {Array.from({ length: count }, (_, index) => (
            <li key={index} className="px-4 py-2.5">
              검색 결과 {index + 1}
            </li>
          ))}
        </ul>
        {showSpinner && (
          <div
            role="status"
            aria-label="불러오는 중"
            className="absolute inset-0 flex items-center justify-center motion-safe:animate-[page-state-enter_200ms_both]"
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
        )}
      </div>
    </div>
  );
}

const DEBOUNCE_MS = 300;

export function DebounceDemo() {
  const timer = useRef<number | undefined>(undefined);
  const [value, setValue] = useState("");
  const [instantCalls, setInstantCalls] = useState(0);
  const [debouncedCalls, setDebouncedCalls] = useState(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function reset() {
    window.clearTimeout(timer.current);
    setValue("");
    setInstantCalls(0);
    setDebouncedCalls(0);
  }

  return (
    <div className="mx-auto max-w-md space-y-3">
      <div className="flex items-center gap-2">
        <Input
          aria-label="디바운스 예시 입력"
          placeholder="여기에 입력해 보세요"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setInstantCalls((count) => count + 1);
            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(
              () => setDebouncedCalls((count) => count + 1),
              DEBOUNCE_MS,
            );
          }}
        />
        <Button variant="outline" onClick={reset} className="shrink-0">
          초기화
        </Button>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        <div className="border-border bg-card rounded-lg border p-3 text-center">
          <dt className="text-muted-foreground text-xs">입력마다 호출</dt>
          <dd data-testid="instant-calls" className="mt-1 text-2xl font-semibold tabular-nums">
            {instantCalls}
          </dd>
        </div>
        <div className="border-border bg-card rounded-lg border p-3 text-center">
          <dt className="text-muted-foreground text-xs">디바운스 {DEBOUNCE_MS}ms</dt>
          <dd data-testid="debounced-calls" className="mt-1 text-2xl font-semibold tabular-nums">
            {debouncedCalls}
          </dd>
        </div>
      </dl>
    </div>
  );
}
