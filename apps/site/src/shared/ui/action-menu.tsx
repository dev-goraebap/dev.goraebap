import { useState } from "react"
import { AdaptivePopover } from "@/shared/ui/adaptive-popover"
import { Button } from "@/shared/ui/button"
import { MoreHorizontalIcon, type Icon } from "@/shared/ui/icon"

export type MenuAction = { label: string; icon: Icon; onSelect: () => void }

/**
 * … 버튼과 그 메뉴(호호코워크 ActionMenu · RowMenu). 데스크톱은 팝오버, 휴대폰은 바텀시트. 모든 항목에 아이콘을 둔다.
 * 페이지 · 상세의 메뉴는 기본 크기, 목록 줄 · 카드 끝은 size="row"(데스크톱 24px, 휴대폰 44px).
 * 메뉴 줄은 데스크톱 36px · 14px 글자 · 16px 아이콘, 휴대폰 48px · 15px 글자 · 20px 아이콘.
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
          // 휴대폰 동작 목록은 48px 줄에 15px 글자 · 20px 아이콘이다(composed-components.md). 시트로 옮긴다고 밀도가 바뀌지 않는다.
          <Button key={action.label} variant="ghost" className="h-9 justify-start max-md:h-12 max-md:gap-3 max-md:text-[0.9375rem]"
            onClick={() => { setIsOpen(false); action.onSelect() }}>
            <action.icon data-icon="inline-start" className="size-4 max-md:size-5" />
            {action.label}
          </Button>
        ))}
      </div>
    </AdaptivePopover>
  )
}
