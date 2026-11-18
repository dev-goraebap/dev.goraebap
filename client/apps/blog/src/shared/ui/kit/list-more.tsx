import type { ReactNode } from "react"
import { cn } from "cn"
import { Button } from "@/shared/ui/kit/button"
import { StarAngleIcon, type Icon } from "@/shared/ui/kit/icon"
import { Spinner } from "@/shared/ui/kit/spinner"

/**
 * 목록 끝 줄(모든 목록 · 표의 공통): 마지막 줄 바로 아래에 붙어 좌 · 가운데 · 우 세 자리를 갖는다.
 * - 왼쪽: 아이콘(별)과 수("전체 12건", 조각씩 읽는 중이면 "40건 중 20건", 전체를 모르면 지금 수), 그 뒤에 덧붙일 것(meta).
 *   목록의 첫 내용과 같은 자리에서 시작한다(줄의 왼쪽 여백이 16px가 아닌 목록은 className으로 맞춘다).
 * - 가운데: 더 읽을 것이 있으면 더 보기. 목록 폭의 한가운데에 선다.
 * - 오른쪽: 페이지가 둘 것(end). 없으면 비운다.
 * 화면 아래에 고정하지 않는다: 목록을 끝까지 내려야 보인다. 수는 바뀔 때 읽어 준다(aria-live).
 * 휴대폰 목록 위에 떠 있는 단추(목차 · 지도 확대 등)가 있으면 hasFab으로 그 자리만큼 오른쪽을 비워 가리지 않게 한다.
 */
export function ListMore({ shown, total, unit = "건", icon, meta, end, hasMore = false, isLoading = false, onMore, hasFab = false, className }: {
  /** 지금 보이는 수. */
  shown: number
  /** 전체 수. 모르면 비운다. */
  total?: number
  /** 세는 말: 건 · 개 · 명. */
  unit?: string
  /** 수 앞의 아이콘. 비우면 별(Solar star-angle, Bold Duotone). */
  icon?: Icon
  /** 수 뒤에 덧붙이는 것(걸러 본 조건, 기간 등). */
  meta?: ReactNode
  /** 오른쪽 끝에 두는 것. */
  end?: ReactNode
  /** 더 읽을 것이 있다. */
  hasMore?: boolean
  /** 다음 조각을 읽는 중: 더 보기에 돌림표를 두고 막는다. */
  isLoading?: boolean
  onMore?: () => void
  hasFab?: boolean
  className?: string
}) {
  const CountIcon = icon ?? StarAngleIcon
  const count = total === undefined ? `${shown}${unit}` : total > shown ? `${total}${unit} 중 ${shown}${unit}` : `전체 ${total}${unit}`
  return (
    <div data-slot="list-more"
      className={cn("grid min-h-12 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 py-2", hasFab && "max-md:pr-20", className)}>
      <p aria-live="polite" className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
        <CountIcon chosen className="size-4 shrink-0 text-icon-muted" />
        <span className="truncate">{count}</span>
        {meta ? <span className="flex min-w-0 items-center gap-1.5 truncate before:content-['·']">{meta}</span> : null}
      </p>
      <div className="flex justify-center">
        {hasMore && onMore && (
          <Button variant="secondary" size="sm" className="rounded-full max-md:h-11 max-md:min-w-22 max-md:px-5" disabled={isLoading} onClick={onMore}>
            {isLoading && <Spinner data-icon="inline-start" />}
            더 보기
          </Button>
        )}
      </div>
      <div className="flex min-w-0 items-center justify-end gap-2 text-xs text-muted-foreground">{end}</div>
    </div>
  )
}
