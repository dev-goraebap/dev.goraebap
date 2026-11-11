import { useState } from "react"
import { AdaptivePopover } from "@/shared/ui/adaptive-popover"
import { Button } from "@/shared/ui/button"
import { MoreHorizontalIcon, type Icon } from "@/shared/ui/icon"

export type MenuAction = { label: string; icon: Icon; onSelect: () => void }

/**
 * … 버튼과 그 메뉴(호호코워크 ActionMenu · RowMenu). 데스크톱은 팝오버, 휴대폰은 바텀시트. 모든 항목에 아이콘을 둔다.
 * 페이지 · 상세의 메뉴는 기본 크기, 목록 줄 · 카드 끝은 size="row"(데스크톱 24px, 휴대폰 44px).
 */
export function ActionMenu({ label, title = label, actions, size = "page" }: {
  /** 버튼의 읽기용 이름. */
  label: string
  /** 휴대폰 시트의 제목. */
  title?: string
  actions: MenuAction[]
  size?: "page" | "row"
}) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <AdaptivePopover title={title} open={isOpen} onOpenChange={setIsOpen} align="end" className="w-52 p-1.5"
      trigger={
        <Button variant="ghost" size={size === "row" ? "icon-xs" : "icon"} aria-label={label} className={size === "row" ? "max-md:size-11" : undefined}>
          <MoreHorizontalIcon chosen={isOpen} />
        </Button>
      }>
      <div className="flex flex-col">
        {actions.map(action => (
          <Button key={action.label} variant="ghost" className="h-9 justify-start max-md:h-12"
            onClick={() => { setIsOpen(false); action.onSelect() }}>
            <action.icon data-icon="inline-start" />
            {action.label}
          </Button>
        ))}
      </div>
    </AdaptivePopover>
  )
}
