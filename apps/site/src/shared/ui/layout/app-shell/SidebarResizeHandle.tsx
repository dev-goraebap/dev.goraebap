import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type PointerEvent } from "react"
import { cn } from "cn"

/** 손잡이의 지금 상태: 가리키는 중이면 hover, 끄는 중이거나 키보드 초점이면 active. */
export type HandleEdge = "idle" | "hover" | "active"

const STEP = 16

/** 루트 글자 크기의 배율. 큰 화면(1920px 이상)은 루트를 키우므로 화면 px를 기준 px로 되돌릴 때 쓴다. */
const rootScale = () => parseFloat(getComputedStyle(document.documentElement).fontSize) / 16 || 1

/**
 * 사이드바 오른쪽 가장자리의 너비 손잡이(Linear처럼 가장자리를 끈다). 끌거나, 초점을 두고 ← → (Shift는 4배) · Home · End.
 * inset 바닥에는 선이 없으므로 평소에는 보이지 않고, 가리킬 때 · 끄는 동안 · 키보드 초점에서만 선이 선다.
 * 값은 루트 16px 기준 px이다. 사이드바 너비를 rem으로 두므로 큰 화면에서 루트가 커지면 끄는 거리도 그만큼 나눈다.
 * onEdgeChange를 받으면(inset) 선을 손잡이에 긋지 않고 상태만 알린다: 셸이 본문 면의 왼쪽 가장자리에 표시를 둔다(창 높이 전체에 선이
 * 서지 않게).
 * (PaneResizeHandle은 늘 선을 그리는 칸 구분선이라 따로 둔다.)
 */
export function SidebarResizeHandle({ value, min, max, onChange, onDraggingChange, onEdgeChange }: {
  value: number; min: number; max: number; onChange: (width: number) => void; onDraggingChange: (isDragging: boolean) => void
  onEdgeChange?: (edge: HandleEdge) => void
}) {
  const start = useRef<{ x: number; width: number; scale: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isFocusVisible, setIsFocusVisible] = useState(false)
  const edge: HandleEdge = isDragging || isFocusVisible ? "active" : isHovered ? "hover" : "idle"
  useEffect(() => { onEdgeChange?.(edge) }, [edge, onEdgeChange])
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
      onPointerEnter={() => setIsHovered(true)} onPointerLeave={() => setIsHovered(false)}
      onFocus={(event: FocusEvent<HTMLDivElement>) => setIsFocusVisible(event.currentTarget.matches(":focus-visible"))} onBlur={() => setIsFocusVisible(false)}
      className="group/handle relative z-20 -mx-1 flex w-2 shrink-0 cursor-col-resize touch-none justify-center outline-none">
      {!onEdgeChange && <span className={cn("w-0.5 rounded-full transition-[width,background-color] group-hover/handle:bg-border",
        "group-focus-visible/handle:w-1 group-focus-visible/handle:bg-ring group-data-dragging/handle:bg-ring")} />}
    </div>
  )
}
