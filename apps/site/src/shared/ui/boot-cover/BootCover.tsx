import { useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/shared/lib/utils"
import { BOOT_MARK, tintBootMark } from "./boot-mark"

/** 너무 빨리 걷혀 깜빡이지 않도록 보이는 최소 시간(ms). 걷힐 때는 0.7초에 걸쳐 사라진다. */
const MIN_SHOWN = 300

/**
 * 첫 방문 덮개. index.html에 미리 넣은 덮개(bootCover Vite 플러그인)와 같은 모양으로 그 자리를 이어받고, 첫 경로의 데이터가
 * 준비되면(isReady) 걷는다. 덮개 아래의 첫 화면은 이미 다 그려져 있어 걷히는 동안 두 화면이 반쯤 섞이지 않는다.
 * 걷히는 동안은 누름을 받지 않고, 이후 화면 전환에는 쓰지 않는다. 바탕 · 잉크 · 면은 토큰(라이트 · 다크)을 따른다.
 *
 *   // TanStack Router: 첫 경로가 풀리면 준비됨
 *   const [isReady, setReady] = useState(false)
 *   useEffect(() => router.subscribe("onResolved", () => setReady(true)), [router])
 */
export function BootCover({ isReady, mark, label = "불러오는 중입니다" }: {
  isReady: boolean
  /** 제품의 표시(SVG 원문 또는 요소). 원문은 rgb(0,0,0) · rgb(254,254,255) 약속을 따르면 토큰 색이 된다. 없으면 중립 기본 그림. */
  mark?: string | ReactNode
  label?: string
}) {
  const shownAt = useRef(performance.now())
  const [isVisible, setVisible] = useState(true)
  const [isGone, setGone] = useState(false)
  useEffect(() => {
    if (!isReady) return undefined
    const lift = window.setTimeout(() => setVisible(false), Math.max(0, MIN_SHOWN - (performance.now() - shownAt.current)))
    return () => window.clearTimeout(lift)
  }, [isReady])
  if (isGone) return null
  const svg = typeof mark === "string" || mark === undefined ? tintBootMark(mark ?? BOOT_MARK) : undefined
  return (
    <div data-slot="boot-cover" data-visible={isVisible || undefined} aria-hidden={isVisible ? undefined : true}
      role={isVisible ? "status" : undefined} aria-label={isVisible ? label : undefined}
      onTransitionEnd={event => { if (!isVisible && event.target === event.currentTarget) setGone(true) }}
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background text-xs text-muted-foreground",
        "invisible pointer-events-none opacity-0 transition-[opacity,visibility] duration-700 ease-out motion-reduce:transition-none",
        "data-visible:visible data-visible:pointer-events-auto data-visible:opacity-100 data-visible:transition-none",
      )}>
      {svg
        ? <span aria-hidden className="block size-40 [&_svg]:block [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} />
        : <span aria-hidden className="block size-40 [&_svg]:block [&_svg]:size-full">{mark}</span>}
      <span>{label}</span>
    </div>
  )
}
