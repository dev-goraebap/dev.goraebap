import type { WorkItem } from "@/entities/work-item"
import { ActionMenu } from "@/shared/ui/action-menu"
import { CopyIcon, LinkIcon } from "@/shared/ui/icon"
import { toast } from "@/shared/ui/toast"

const copy = async (text: string, title: string) => {
  try {
    await navigator.clipboard.writeText(text)
    toast.add({ type: "success", title })
  } catch {
    toast.add({ type: "error", title: "복사하지 못했습니다" })
  }
}

/** 업무 줄 · 카드 끝의 … 메뉴. */
export function WorkItemMenu({ item }: { item: WorkItem }) {
  return (
    <ActionMenu label={`${item.key} 메뉴`} title={item.key} size="row" actions={[
      { label: "업무 키 복사", icon: CopyIcon, onSelect: () => void copy(item.key, `${item.key}를 복사했습니다`) },
      { label: "링크 복사", icon: LinkIcon, onSelect: () => void copy(`${location.origin}/work-items/${item.key}`, "링크를 복사했습니다") },
    ]} />
  )
}

/** 머리 줄의 페이지 메뉴(…). */
export function WorkItemsPageMenu() {
  return (
    <ActionMenu label="업무 메뉴" actions={[
      { label: "링크 복사", icon: LinkIcon, onSelect: () => void copy(location.href, "링크를 복사했습니다") },
    ]} />
  )
}
