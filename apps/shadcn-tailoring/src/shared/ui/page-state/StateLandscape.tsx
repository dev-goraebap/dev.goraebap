import { useId, useState } from "react"
import { cn } from "@/shared/lib/utils"
import empty01 from "./landscapes/empty-01.webp"
import empty02 from "./landscapes/empty-02.webp"
import empty03 from "./landscapes/empty-03.webp"
import error40401 from "./landscapes/error-404-01.webp"
import error40402 from "./landscapes/error-404-02.webp"
import error40403 from "./landscapes/error-404-03.webp"
import error50001 from "./landscapes/error-500-01.webp"
import error50002 from "./landscapes/error-500-02.webp"
import error50003 from "./landscapes/error-500-03.webp"
import search01 from "./landscapes/search-01.webp"
import search02 from "./landscapes/search-02.webp"
import search03 from "./landscapes/search-03.webp"

/** 상태가 말하는 것: 아직 없음, 맞는 것 없음, 그런 것 없음, 실패. */
export type StateKind = "empty" | "search" | "not-found" | "error"
/** 상태마다 세 장 중 하나(확인 · 스크린숏에서 고정할 때). */
export type StateVariant = 0 | 1 | 2

/**
 * 상태마다 펜 선 풍경 세 장(호호코워크 StateLandscape)과 그림이 끝나는 줄. 그림 아래 종이를 같은 여백으로 잘라
 * 어느 그림이든 제목이 같은 거리에 놓인다.
 */
const DRAWINGS: Record<StateKind, readonly [file: string, end: number][]> = {
  empty: [[empty01, 894], [empty02, 902], [empty03, 916]],
  search: [[search01, 865], [search02, 915], [search03, 913]],
  "not-found": [[error40401, 846], [error40402, 951], [error40403, 894]],
  error: [[error50001, 879], [error50002, 914], [error50003, 838]],
}
const TOP = 110
const MARGIN = 16
const SIZE = { width: 1536, height: 1024 }

/** 이 페이지에서 보인 그림: 다시 보일 때는 기다리지 않는다. */
const shown = new Set<string>()
function isAtHand(file: string) {
  if (shown.has(file)) return true
  const probe = new Image()
  probe.src = file
  return probe.complete && probe.naturalWidth > 0
}

export const pickVariant = () => Math.floor(Math.random() * 3) as StateVariant

/**
 * 상태의 풍경 그림. 파일의 검은 선과 파란 표시를 두 마스크로 나눠 테마 색(보조 아이콘 색 · 그림 강조색)으로 칠하므로
 * 라이트와 다크에서 같이 그려진다. 자리는 처음부터 잡고, 받아야 하는 그림은 도착하면 나타난다. 장식이라 숨긴다.
 */
export function StateLandscape({ kind, variant }: { kind: StateKind; variant?: StateVariant }) {
  // 마스크와 필터는 페이지 전체에서 id로 찾으므로 그림마다 자기 id를 쓴다.
  const id = `landscape${useId().replace(/[^\w-]/g, "")}`
  const [picked] = useState(pickVariant)
  const [file, end] = DRAWINGS[kind][variant ?? picked]
  const [arrived, setArrived] = useState(() => (isAtHand(file) ? file : undefined))
  const layer = (part: "ink" | "accent") => (
    <mask id={`${id}-${part}`} className="[mask-type:alpha]" maskUnits="userSpaceOnUse" x="0" y="0" {...SIZE}>
      <use href={`#${id}-image`} filter={`url(#${id}-${part}-filter)`} />
    </mask>
  )
  return (
    <svg viewBox={`0 ${TOP} ${SIZE.width} ${end + MARGIN - TOP}`} preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false"
      data-arrived={arrived === file || undefined}
      className={cn("block h-44 w-80 max-w-full translate-y-1 opacity-0 transition-[opacity,translate] duration-600 ease-[cubic-bezier(0.2,0,0,1)]",
        "data-arrived:translate-y-0 data-arrived:opacity-100 motion-reduce:translate-y-0 motion-reduce:transition-none")}>
      <defs>
        <image id={`${id}-image`} href={file} {...SIZE} onLoad={() => { shown.add(file); setArrived(file) }} />
        {/* 선은 검정(빨강이 파랑만큼 낮음), 표시는 파랑(파랑이 빨강보다 높음): 필터마다 하나를 알파로 남긴다. */}
        <filter id={`${id}-ink-filter`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1 0 -1 0 1" />
          <feComposite in2="SourceAlpha" operator="in" />
        </filter>
        <filter id={`${id}-accent-filter`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -1 0 1 0 0" />
          <feComposite in2="SourceAlpha" operator="in" />
        </filter>
        {layer("ink")}
        {layer("accent")}
      </defs>
      <rect {...SIZE} className="fill-icon-muted" mask={`url(#${id}-ink)`} />
      <rect {...SIZE} className="fill-illustration-accent" mask={`url(#${id}-accent)`} />
    </svg>
  )
}
