import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useDesignConfig } from "../lib/design-config";

const BREAKPOINTS = [
  { label: "Mobile", width: 390, tick: 0 },
  { label: "sm", width: 640, tick: 640 },
  { label: "md", width: 768, tick: 768 },
  { label: "lg", width: 1024, tick: 1024 },
  { label: "xl", width: 1280, tick: 1280 },
];
const MIN_WIDTH = 320;
const MAX_WIDTH = 1440;
const STAGE_HEIGHT = 520;
const HANDLE_GUTTER = 22;
const MIN_DISPLAY_WIDTH = 200;
const MIN_TICK_GAP = 30;
const DESKTOP_MIN_WIDTH = 1024;

function clampWidth(width: number) {
  return Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width)));
}

export function ResizableLayoutStage({
  label = "미리보기 너비",
  height = STAGE_HEIGHT,
  defaultWidth,
  children,
}: {
  label?: string;
  height?: number;
  defaultWidth?: number;
  children: ReactNode;
}) {
  const { rootScale } = useDesignConfig();
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [width, setWidth] = useState(
    // 정적 생성(서버)에는 창이 없어 데스크톱 너비로 그린다.
    () =>
      defaultWidth ??
      (typeof window !== "undefined" && window.innerWidth < DESKTOP_MIN_WIDTH ? 390 : 1280),
  );
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(([entry]) => setTrackWidth(entry.contentRect.width));
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  const available = Math.max(0, trackWidth - HANDLE_GUTTER);
  const minDisplay = Math.min(MIN_DISPLAY_WIDTH, available * 0.6);
  const toDisplay = (value: number) =>
    minDisplay + ((value - MIN_WIDTH) / (MAX_WIDTH - MIN_WIDTH)) * (available - minDisplay);
  const toWidth = (display: number) =>
    MIN_WIDTH + ((display - minDisplay) / (available - minDisplay)) * (MAX_WIDTH - MIN_WIDTH);
  const displayWidth = toDisplay(width);
  // 컨테이너 쿼리의 rem은 화면 크기 설정을 따르므로, 눈금과 전환 지점이 맞도록 실제 폭을 함께 늘린다.
  const layoutWidth = width * rootScale;
  const scale = displayWidth / layoutWidth;
  const ticks = BREAKPOINTS.map((item) => ({
    ...item,
    left: item.tick === 0 ? 0 : toDisplay(item.tick),
  })).filter((item, index, all) => {
    const next = all[index + 1];
    return !next || next.left - item.left >= MIN_TICK_GAP;
  });

  function resizeToPointer(clientX: number) {
    const left = trackRef.current?.getBoundingClientRect().left ?? 0;
    setWidth(clampWidth(toWidth(clientX - left)));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 80 : 16;
    const next = {
      ArrowLeft: width - step,
      ArrowDown: width - step,
      ArrowRight: width + step,
      ArrowUp: width + step,
      Home: MIN_WIDTH,
      End: MAX_WIDTH,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setWidth(clampWidth(next));
  }

  return (
    <div className="bg-dots border-border overflow-hidden rounded-2xl border p-3 sm:p-4">
      <div ref={trackRef} className={`relative ${isDragging ? "select-none" : ""}`}>
        {available > 0 && (
          <>
            <div className="relative mb-2 h-7">
              {ticks.map((item) => {
                const isReached = width >= item.tick;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setWidth(item.width)}
                    style={{ left: item.left }}
                    className={`absolute top-0 h-7 cursor-pointer border-l pl-1.5 font-mono text-[0.6875rem] transition-colors ${
                      isReached
                        ? "border-foreground/60 text-foreground"
                        : "border-border text-muted-foreground/70 hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="relative" style={{ height }}>
              <div
                className="bg-background ring-border h-full overflow-hidden rounded-xl ring-1"
                style={{ width: displayWidth }}
              >
                <div
                  className="@container origin-top-left"
                  style={
                    {
                      width: layoutWidth,
                      height: height / scale,
                      transform: `scale(${scale})`,
                      "--layout-scale": scale,
                    } as CSSProperties
                  }
                >
                  {children}
                </div>
              </div>

              <div
                role="slider"
                tabIndex={0}
                aria-label={label}
                aria-orientation="horizontal"
                aria-valuemin={MIN_WIDTH}
                aria-valuemax={MAX_WIDTH}
                aria-valuenow={width}
                aria-valuetext={`${width}px`}
                onKeyDown={handleKeyDown}
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  setIsDragging(true);
                }}
                onPointerMove={(event) => {
                  if (isDragging) resizeToPointer(event.clientX);
                }}
                onPointerUp={() => setIsDragging(false)}
                onPointerCancel={() => setIsDragging(false)}
                style={{ left: displayWidth + 2 }}
                className="group focus-visible:outline-ring absolute top-1/2 flex h-20 w-5 -translate-y-1/2 cursor-ew-resize touch-none items-center justify-center rounded-md outline-none focus-visible:outline-2"
              >
                <span
                  className={`h-12 w-1.5 rounded-full transition-colors ${
                    isDragging
                      ? "bg-foreground"
                      : "bg-muted-foreground/50 group-hover:bg-muted-foreground"
                  }`}
                />
              </div>
            </div>

            <p className="text-muted-foreground mt-2 text-right font-mono text-[0.6875rem] tabular-nums">
              {width}px
            </p>
          </>
        )}
      </div>
    </div>
  );
}
