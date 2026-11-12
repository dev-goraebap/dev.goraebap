import type { ReactNode } from "react"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { ChevronDownIcon, PlusIcon } from "@/shared/ui/icon"

/**
 * 목록의 그룹 머리(호호코워크 ListGroupHeader): 접기 꺾쇠 · 표식 · 이름 · 개수, 오른쪽 +. 스크롤해도 위에 붙는다.
 * 데스크톱 36px, 휴대폰 52px. 띠 색(bg-band)은 불투명해 지나가는 줄이 비치지 않는다.
 */
export function ListGroupHeader({ label, icon, count, isOpen, onToggle, createLabel, onCreate }: {
  label: string; icon?: ReactNode; count: number; isOpen: boolean; onToggle: () => void
  /** +의 읽기용 이름(예: "백로그에 업무 만들기"). onCreate가 있을 때만 + 를 둔다. */
  createLabel?: string; onCreate?: () => void
}) {
  return (
    <header className="sticky top-0 z-10 flex h-13 shrink-0 items-center justify-between gap-2 border-b bg-band px-2 md:h-9">
      <button type="button" aria-expanded={isOpen} aria-label={`${label} ${count}개`} onClick={onToggle}
        className="flex h-6 items-center gap-2 rounded-full px-2 text-sm font-medium outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 max-md:h-11">
        <ChevronDownIcon className={cn("shrink-0 transition-transform", !isOpen && "-rotate-90")} />
        {icon}
        <span>{label}</span>
        <span className="font-normal text-muted-foreground tabular-nums">{count}</span>
      </button>
      {onCreate && (
        <Button variant="ghost" size="icon-xs" aria-label={createLabel ?? `${label}에 만들기`} onClick={onCreate} className="max-md:size-11">
          <PlusIcon />
        </Button>
      )}
    </header>
  )
}
