import { cn } from "@/shared/lib/utils"
import { WorkItemAssignee, WorkItemDate, WorkItemLabels, WorkItemPriorityIcon, WorkItemStatusIcon, WorkItemTypeLabel, type WorkItem } from "@/entities/work-item"
import { WorkItemLink } from "./WorkItemLink"
import { WorkItemMenu } from "./WorkItemMenu"

/** 줄은 자기 바탕을 칠해 페이지의 점 무늬를 가리고, 가리키면 옅게 덮는다. */
export const ROW_SURFACE = "relative bg-background hover:bg-row-hover"

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
 * 줄 높이는 목록 높이 설정을 따른다(넉넉하게 49px, 촘촘하게 41px). 줄 어디를 눌러도 상세로 간다(메뉴는 빼고).
 * 휴대폰: 첫 줄에 키 · 상태 · 제목, 제목 아래 줄의 왼쪽은 유형, 오른쪽은 담당자와 메뉴.
 */
export function WorkItemRow({ item, isCompact }: { item: WorkItem; isCompact: boolean }) {
  if (isCompact) {
    return (
      <li className={cn("grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 gap-y-1 border-b px-4 py-3 text-sm", ROW_SURFACE)}>
        <Lead item={item} />
        <WorkItemLink itemKey={item.key} className="truncate">{item.title}</WorkItemLink>
        <span className="col-start-2 flex min-w-0 items-center justify-between gap-2">
          <WorkItemTypeLabel type={item.type} />
          <span className="flex min-w-0 items-center gap-1">
            <WorkItemAssignee person={item.assignee} />
            <WorkItemMenu item={item} />
          </span>
        </span>
      </li>
    )
  }
  return (
    <li className={cn("flex items-center gap-2 border-b px-4 py-3 text-sm compact:py-2", ROW_SURFACE)}>
      <Lead item={item} />
      <WorkItemLink itemKey={item.key} className="min-w-0 flex-1 truncate">{item.title}</WorkItemLink>
      <span className="flex shrink-0 items-center gap-2.5">
        <WorkItemTypeLabel type={item.type} />
        <WorkItemLabels labels={item.labels} />
        <WorkItemAssignee person={item.assignee} />
        {item.dueDate && <WorkItemDate date={item.dueDate} />}
        <WorkItemMenu item={item} />
      </span>
    </li>
  )
}
