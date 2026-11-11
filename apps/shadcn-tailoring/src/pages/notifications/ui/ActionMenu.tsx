import { useState } from "react"
import { AdaptivePopover } from "@/shared/ui/adaptive-popover"
import { Button } from "@/shared/ui/button"
import { MoreHorizontalIcon, type Icon } from "@/shared/ui/icon"

export type MenuAction = { label: string; icon: Icon; onSelect: () => void }

/** … 버튼과 그 메뉴(호호코워크 ActionMenu). 데스크톱은 팝오버, 휴대폰은 바텀시트. 모든 항목에 아이콘을 둔다. */
export function ActionMenu({ label, actions }: { label: string; actions: MenuAction[] }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <AdaptivePopover title={label} open={isOpen} onOpenChange={setIsOpen} align="end"
      trigger={<Button variant="ghost" size="icon" aria-label={label}><MoreHorizontalIcon chosen={isOpen} /></Button>}>
      <div className="flex flex-col">
        {actions.map(action => (
          <Button key={action.label} variant="ghost" size="lg" className="justify-start"
            onClick={() => { setIsOpen(false); action.onSelect() }}>
            <action.icon data-icon="inline-start" />
            {action.label}
          </Button>
        ))}
      </div>
    </AdaptivePopover>
  )
}
