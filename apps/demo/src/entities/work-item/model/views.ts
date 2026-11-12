import { KanbanSquareIcon, ListIcon, TableIcon, UserIcon, type Icon } from "@/shared/ui/icon"

/**
 * 업무의 뷰(호호코워크 workItemViewsOptions). 주소에 남겨(?view=board) 새로고침 · 링크 · 사이드바의 업무 아래 줄이 같은 뷰를 연다.
 * 업무 페이지와 사이드바가 함께 읽는다. 기본인 전체 업무는 주소에 두지 않는다.
 */
export type WorkItemView = "all" | "board" | "table" | "mine"

export const ALL_VIEW: WorkItemView = "all"

export const WORK_ITEM_VIEWS: readonly { value: WorkItemView; label: string; icon: Icon }[] = [
  { value: "all", label: "전체 업무", icon: ListIcon },
  { value: "board", label: "보드", icon: KanbanSquareIcon },
  { value: "table", label: "표", icon: TableIcon },
  { value: "mine", label: "내 업무", icon: UserIcon },
]
