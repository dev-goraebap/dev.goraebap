import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

const MIN_WIDTH = 160;
const MAX_WIDTH = 560;
const KEY_STEP = 16;

const clampWidth = (width: number) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width));

export function ContainerPreview({ children }: { children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; width: number } | null>(null);
  const [width, setWidth] = useState(320);
  const [measured, setMeasured] = useState(320);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const observer = new ResizeObserver(() => setMeasured(Math.round(box.offsetWidth)));
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, width: measured };
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    // 가운데 정렬이라 핸들이 포인터를 따라가려면 이동량의 두 배만큼 너비가 변한다.
    setWidth(clampWidth(dragRef.current.width + (event.clientX - dragRef.current.x) * 2));
  }

  return (
    <div
      ref={boxRef}
      style={{ width }}
      className="border-foreground/30 relative max-w-full rounded-lg border border-dashed p-4 pt-8"
    >
      <span className="text-muted-foreground absolute top-2 left-3 text-[0.6875rem] font-medium tabular-nums">
        부모 컨테이너 · {measured}px
      </span>
      {children}
      <div
        role="separator"
        tabIndex={0}
        aria-orientation="vertical"
        aria-label="부모 컨테이너 너비 조절"
        aria-valuemin={MIN_WIDTH}
        aria-valuemax={MAX_WIDTH}
        aria-valuenow={measured}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={() => {
          dragRef.current = null;
        }}
        onPointerCancel={() => {
          dragRef.current = null;
        }}
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          const step = event.key === "ArrowRight" ? KEY_STEP : -KEY_STEP;
          const current = boxRef.current?.offsetWidth ?? measured;
          setWidth(clampWidth(current + step));
        }}
        className="border-border bg-card hover:border-foreground/40 focus-visible:outline-ring absolute top-1/2 -right-1.5 flex h-10 w-3 -translate-y-1/2 cursor-ew-resize touch-none items-center justify-center rounded-full border shadow-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <span className="bg-muted-foreground/50 h-4 w-px" />
      </div>
    </div>
  );
}
