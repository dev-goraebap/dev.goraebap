import { copyWorkItemKey, copyWorkItemLink, type WorkItem } from "@/entities/work-item"
import { ActionMenu } from "@/shared/ui/action-menu"
import { CopyIcon, LinkIcon } from "@/shared/ui/icon"
import { toast } from "@/shared/ui/toast"

/** 업무 줄 · 카드 끝의 … 메뉴. 줄을 덮는 링크 위에 떠 있어서 눌러도 상세로 가지 않는다. */
export function WorkItemMenu({ item }: { item: WorkItem }) {
  return (
    <span className="relative z-1 flex">
      <ActionMenu label={`${item.key} 메뉴`} title={item.key} size="row" actions={[
        { label: "업무 키 복사", icon: CopyIcon, onSelect: () => void copyWorkItemKey(item) },
        { label: "링크 복사", icon: LinkIcon, onSelect: () => void copyWorkItemLink(item) },
      ]} />
    </span>
  )
}

/** 머리 줄의 페이지 메뉴(…). */
export function WorkItemsPageMenu() {
  return (
    <ActionMenu label="업무 메뉴" actions={[
      {
        label: "링크 복사", icon: LinkIcon, onSelect: () => void navigator.clipboard.writeText(location.href).then(
          () => toast.add({ type: "success", title: "링크를 복사했습니다" }),
          () => toast.add({ type: "error", title: "복사하지 못했습니다" }),
        ),
      },
    ]} />
  )
}
