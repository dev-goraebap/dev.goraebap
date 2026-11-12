import { cn } from "cn"
import { Button } from "@/shared/ui/button"
import { Spinner } from "@/shared/ui/spinner"

/**
 * 목록 끝(호호코워크 ListMore, layout-patterns.md의 읽은 수): 조각씩 읽는 목록 아래에 "전체 중 읽은 수"와 더 보기.
 * 전체를 모르면(total 없음) 지금 수만, 다 읽었으면(hasMore 아님) 수만 남긴다. 수는 바뀔 때 읽어 준다(aria-live).
 * 휴대폰 목록 위에 만들기 FAB가 떠 있으면 hasFab으로 그 높이만큼 아래를 비워 마지막 줄이 가리지 않게 한다.
 */
export function ListMore({ shown, total, unit = "건", hasMore, isLoading = false, onMore, hasFab = false, className }: {
  /** 지금 보이는 수. */
  shown: number
  /** 전체 수. 모르면 비운다. */
  total?: number
  /** 세는 말: 건 · 개 · 명. */
  unit?: string
  /** 더 읽을 것이 있다. */
  hasMore: boolean
  /** 다음 조각을 읽는 중: 더 보기에 돌림표를 두고 막는다. */
  isLoading?: boolean
  onMore: () => void
  hasFab?: boolean
  className?: string
}) {
  return (
    <div data-slot="list-more" className={cn("flex flex-col items-center gap-2 px-4 pt-3 pb-10", hasFab && "max-md:pb-24", className)}>
      <p aria-live="polite" className="text-xs text-muted-foreground tabular-nums">
        {total === undefined ? `${shown}${unit}` : `${total}${unit} 중 ${shown}${unit}`}
      </p>
      {hasMore && (
        <Button variant="secondary" className="rounded-full max-md:h-11 max-md:min-w-22 max-md:px-5" disabled={isLoading} onClick={onMore}>
          {isLoading && <Spinner data-icon="inline-start" />}
          더 보기
        </Button>
      )}
    </div>
  )
}
