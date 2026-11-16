import { useLayoutEffect, useState, type KeyboardEvent } from "react"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { AdaptivePopover } from "@/shared/ui/adaptive-popover"
import { Button } from "@/shared/ui/button"
import { MoreHorizontalIcon, type Icon } from "@/shared/ui/icon"
import { useIsInAppBar, usePhoneTools } from "@/shared/ui/layout/phone-tools"
import { MenuItem } from "@/shared/ui/menu-item"

export type MenuAction = { label: string; icon: Icon; onSelect: () => void; /** 주 동작(수정). 펼쳐 둘 때 맨 앞, 접을 때도 밖에 남는다. */ isPrimary?: boolean }

/** 상세 머리의 동작을 몇 개까지 단추로 펼쳐 두는가: 3개까지는 모두, 4개부터는 주 동작만 밖에 두고 나머지는 … 에 넣는다. */
const INLINE_MAX = 3

/**
 * … 버튼과 그 메뉴. 데스크톱은 팝오버, 휴대폰은 바텀시트. 모든 항목에 아이콘을 둔다.
 * 페이지 · 상세의 메뉴는 기본 크기, 목록 줄 · 카드 끝은 size="row"(데스크톱 24px, 휴대폰 44px).
 * 메뉴 줄은 데스크톱 36px · 14px 글자 · 16px 아이콘, 휴대폰 48px · 15px 글자 · 20px 아이콘.
 * 메뉴(role="menu")로 읽히고, 위아래 화살표 · Home · End로 항목 사이를 옮긴다.
 */
export function ActionMenu({ label, title = label, actions, size = "page", isToolsMenu = false, isInline = false }: {
  /** 버튼의 읽기용 이름. */
  label: string
  /** 휴대폰 시트의 제목. */
  title?: string
  actions: MenuAction[]
  size?: "page" | "row"
  /** 휴대폰 머리가 도구만 담으려고 따로 둔 … 메뉴(화면 메뉴를 맡았다고 알리지 않는다). */
  isToolsMenu?: boolean
  /**
   * 상세 머리의 동작: 3개까지는 각각 둥근 단추로 펼치고, 4개부터는 주 동작(isPrimary)만 밖에 두고 나머지를 … 에 넣는다.
   */
  isInline?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  // 휴대폰의 화면 … 메뉴는 도구(검색 · 필터 · 표시)도 아래에 담는다(phone-tools).
  const isMobile = useIsMobile()
  const phone = usePhoneTools()
  // 휴대폰 머리(앱 바)의 … 메뉴만 도구를 담는다. 목록 줄 · 보기 탭 옆의 … 는 아니다.
  const isInAppBar = useIsInAppBar()
  const takesTools = isMobile && !!phone && size === "page" && (isInAppBar || isToolsMenu)
  const claimMenu = phone?.claimMenu
  useLayoutEffect(() => (takesTools && !isToolsMenu && claimMenu ? claimMenu() : undefined), [takesTools, isToolsMenu, claimMenu])
  const tools = takesTools && phone ? phone.tools : []
  const primary = actions.find(action => action.isPrimary)
  const ordered = primary ? [primary, ...actions.filter(action => action !== primary)] : actions
  const inline = !isInline || size !== "page" ? [] : actions.length <= INLINE_MAX ? ordered : primary ? [primary] : []
  const folded = actions.filter(action => !inline.includes(action))
  const moveFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]')]
    const at = items.indexOf(document.activeElement as HTMLElement)
    const to = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: items.length - 1 }[event.key]
    if (to === undefined || items.length === 0) return
    event.preventDefault()
    items[(to + items.length) % items.length]?.focus()
  }
  const menu = folded.length > 0 || tools.length > 0 || isToolsMenu ? (
    <AdaptivePopover title={title} open={isOpen} onOpenChange={setIsOpen} align="end" className="w-52 p-1.5"
      trigger={
        <Button variant="ghost" size={size === "row" ? "icon-xs" : "icon"} aria-label={label} aria-haspopup="menu" className={size === "row" ? "max-md:size-11" : undefined}>
          <MoreHorizontalIcon chosen={isOpen} />
        </Button>
      }>
      <div role="menu" aria-label={title} className="flex flex-col" onKeyDown={moveFocus}>
        {[...folded, ...tools.map(tool => ({ label: tool.label, icon: tool.icon, onSelect: tool.onSelect, isOn: tool.isOn }))].map((action: MenuAction & { isOn?: boolean }, index) => (<div key={action.label} className="contents">
          {index === folded.length && index > 0 ? <div role="separator" className="my-1 h-px bg-border" /> : null}
          <MenuItem onClick={() => { setIsOpen(false); action.onSelect() }}>
            <action.icon />
            {action.label}
            {action.isOn ? <span aria-label="켜짐" className="ml-auto size-2 rounded-full bg-primary" /> : null}
          </MenuItem>
        </div>))}
      </div>
    </AdaptivePopover>
  ) : null
  if (inline.length === 0) return menu
  return (
    <>
      {inline.map(action => (
        <Button key={action.label} variant="tool" size="icon" aria-label={action.label} title={action.label} onClick={action.onSelect}>
          <action.icon />
        </Button>
      ))}
      {menu}
    </>
  )
}
