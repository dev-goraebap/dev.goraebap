import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react"

const STEP = 16

/** 루트 글자 크기의 배율. 큰 화면(1920px 이상)은 루트를 키우므로 화면 px를 기준 px로 되돌릴 때 쓴다. */
const rootScale = () => parseFloat(getComputedStyle(document.documentElement).fontSize) / 16 || 1

/**
 * 사이드바 오른쪽 가장자리의 너비 손잡이(Linear처럼 가장자리를 끈다). 끌거나, 초점을 두고 ← → (Shift는 4배) · Home · End.
 * inset 바닥에는 선이 없으므로 평소에는 보이지 않고, 가리킬 때 · 끄는 동안 · 키보드 초점에서만 선이 선다.
 * 값은 루트 16px 기준 px이다. 사이드바 너비를 rem으로 두므로 큰 화면에서 루트가 커지면 끄는 거리도 그만큼 나눈다.
 * (PaneResizeHandle은 늘 선을 그리는 칸 구분선이라 따로 둔다.)
 */
export function SidebarResizeHandle({ value, min, max, onChange, onDraggingChange }: {
  value: number; min: number; max: number; onChange: (width: number) => void; onDraggingChange: (isDragging: boolean) => void
}) {
  const start = useRef<{ x: number; width: number; scale: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const resize = (width: number) => onChange(Math.round(Math.min(max, Math.max(min, width))))
  const drag = (next: boolean) => {
    setIsDragging(next)
    onDraggingChange(next)
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    start.current = { x: event.clientX, width: value, scale: rootScale() }
    drag(true)
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const at = start.current
    if (at) resize(at.width + (event.clientX - at.x) / at.scale)
  }
  const onPointerEnd = () => {
    start.current = null
    drag(false)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? STEP * 4 : STEP
    const next = { ArrowLeft: value - step, ArrowRight: value + step, Home: min, End: max }[event.key]
    if (next === undefined) return
    event.preventDefault()
    resize(next)
  }

  return (
    <div role="separator" aria-orientation="vertical" aria-label="사이드바 너비" aria-valuenow={value} aria-valuemin={min} aria-valuemax={max}
      tabIndex={0} data-dragging={isDragging || undefined}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd} onKeyDown={onKeyDown}
      className="group/handle relative z-20 -mx-1 flex w-2 shrink-0 cursor-col-resize touch-none justify-center outline-none">
      <span className="w-0.5 transition-colors group-hover/handle:bg-border group-focus-visible/handle:bg-ring group-data-dragging/handle:bg-ring" />
    </div>
  )
}
