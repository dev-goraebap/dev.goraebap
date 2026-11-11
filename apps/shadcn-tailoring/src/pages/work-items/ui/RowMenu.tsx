import { useState } from "react"
import type { WorkItem } from "@/entities/work-item"
import { AdaptivePopover } from "@/shared/ui/adaptive-popover"
import { Button } from "@/shared/ui/button"
import { CopyIcon, LinkIcon, MoreHorizontalIcon } from "@/shared/ui/icon"
import { toast } from "@/shared/ui/toast"
import { OptionList } from "./OptionList"

const copy = async (text: string, title: string) => {
  try {
    await navigator.clipboard.writeText(text)
    toast.add({ type: "success", title })
  } catch {
    toast.add({ type: "error", title: "복사하지 못했습니다" })
  }
}

/** 줄 · 카드 끝의 … 메뉴. 데스크톱은 팝오버, 휴대폰은 바텀시트. */
export function RowMenu({ item, className }: { item: WorkItem; className?: string }) {
  const [isOpen, setOpen] = useState(false)
  const pick = (action: string) => {
    setOpen(false)
    if (action === "key") void copy(item.key, `${item.key}를 복사했습니다`)
    else void copy(`${location.origin}/work-items/${item.key}`, "링크를 복사했습니다")
  }
  return (
    <AdaptivePopover title={item.key} align="end" className="w-48 p-1.5" open={isOpen} onOpenChange={setOpen}
      trigger={<Button variant="ghost" size="icon-xs" aria-label={`${item.key} 메뉴`} className={className}><MoreHorizontalIcon /></Button>}>
      <OptionList label={`${item.key} 메뉴`} onPick={pick} options={[
        { value: "key", label: "업무 키 복사", icon: <CopyIcon /> },
        { value: "link", label: "링크 복사", icon: <LinkIcon /> },
      ]} />
    </AdaptivePopover>
  )
}
