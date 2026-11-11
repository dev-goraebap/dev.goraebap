import { cn } from "cn"
import { WorkItemAssignee, WorkItemDate, WorkItemLabels, WorkItemPriorityIcon, WorkItemStatusIcon, WorkItemTypeLabel, type WorkItem } from "@/entities/work-item"
import { RowMenu } from "./RowMenu"

/** 줄은 자기 바탕을 칠해 페이지의 점 무늬를 가리고, 가리키면 옅게 덮는다. */
export const ROW_SURFACE = "bg-background hover:bg-[color-mix(in_srgb,var(--foreground)_4%,var(--background))]"

/** 제목 앞 묶음: 우선순위 · 키 · 상태. */
function Lead({ item }: { item: WorkItem }) {
  return (
    <span className="flex shrink-0 items-center gap-2">
      <WorkItemPriorityIcon priority={item.priority} />
      <span className="max-w-20 truncate text-muted-foreground tabular-nums md:max-w-30">{item.key}</span>
      <WorkItemStatusIcon status={item.status} />
    </span>
  )
}

/**
 * 업무 한 줄(호호코워크 WorkItemListRow). 데스크톱: 우선순위 · 키 · 상태 · 제목, 오른쪽에 유형 · 라벨 · 담당자 · 마감 · 메뉴.
 * 줄 높이는 목록 높이 설정을 따른다(넉넉하게 49px, 촘촘하게 41px).
 * 휴대폰: 첫 줄에 키 · 상태 · 제목, 제목 아래 줄의 왼쪽은 유형, 오른쪽은 담당자와 메뉴.
 */
export function WorkItemRow({ item, isCompact }: { item: WorkItem; isCompact: boolean }) {
  if (isCompact) {
    return (
      <li className={cn("grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 gap-y-1 border-b px-4 py-3 text-sm", ROW_SURFACE)}>
        <Lead item={item} />
        <span className="truncate">{item.title}</span>
        <span className="col-start-2 flex min-w-0 items-center justify-between gap-2">
          <WorkItemTypeLabel type={item.type} />
          <span className="flex min-w-0 items-center gap-1">
            <WorkItemAssignee person={item.assignee} />
            <RowMenu item={item} className="size-11" />
          </span>
        </span>
      </li>
    )
  }
  return (
    <li className={cn("flex items-center gap-2 border-b px-4 py-3 text-sm compact:py-2", ROW_SURFACE)}>
      <Lead item={item} />
      <span className="min-w-0 flex-1 truncate">{item.title}</span>
      <span className="flex shrink-0 items-center gap-2.5">
        <WorkItemTypeLabel type={item.type} />
        <WorkItemLabels labels={item.labels} />
        <WorkItemAssignee person={item.assignee} />
        {item.dueDate && <WorkItemDate date={item.dueDate} />}
        <RowMenu item={item} />
      </span>
    </li>
  )
}
