import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react"

const STEP = 16

/**
 * 두 칸 사이의 구분선이자 너비 손잡이. 끌거나, 초점을 두고 ← → (Shift는 4배) · Home · End로 앞 칸의 너비를 바꾼다.
 * 평소에는 가는 선이고, 가리키거나 끄는 동안 · 키보드 초점에서 진해진다. 너비는 useStoredWidth와 함께 쓴다.
 * 너비를 정하는 칸이 손잡이 뒤(오른쪽)에 있으면 pane="after": 값은 그 칸의 너비 그대로이고, 선을 왼쪽으로 옮기면(끌기 · ← · Home) 넓어진다.
 */
export function PaneResizeHandle({ label, value, min, max, onChange, pane = "before" }: {
  label: string; value: number; min: number; max: number; onChange: (width: number) => void
  /** 너비를 정하는 칸이 손잡이 앞(before, 기본)인지 뒤(after)인지. */
  pane?: "before" | "after"
}) {
  const sign = pane === "after" ? -1 : 1
  const start = useRef<{ x: number; width: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    start.current = { x: event.clientX, width: value }
    setIsDragging(true)
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (start.current) onChange(start.current.width + sign * (event.clientX - start.current.x))
  }
  const onPointerEnd = () => {
    start.current = null
    setIsDragging(false)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? STEP * 4 : STEP
    const [left, right] = sign > 0 ? [min, max] : [max, min]
    const next = { ArrowLeft: value - sign * step, ArrowRight: value + sign * step, Home: left, End: right }[event.key]
    if (next === undefined) return
    event.preventDefault()
    onChange(next)
  }

  return (
    <div role="separator" aria-orientation="vertical" aria-label={label} aria-valuenow={value} aria-valuemin={min} aria-valuemax={max}
      tabIndex={0} data-dragging={isDragging || undefined}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd} onKeyDown={onKeyDown}
      className="group/handle relative z-10 -mx-1 flex w-2 shrink-0 cursor-col-resize touch-none justify-center outline-none">
      <span className="w-px bg-border transition-[width,background-color] group-hover/handle:w-0.5 group-hover/handle:bg-ring group-focus-visible/handle:w-0.5 group-focus-visible/handle:bg-ring group-data-dragging/handle:w-0.5 group-data-dragging/handle:bg-ring" />
    </div>
  )
}
