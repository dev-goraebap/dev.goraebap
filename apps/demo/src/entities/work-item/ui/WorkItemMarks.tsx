import { cn } from "cn"
import { Badge } from "@/shared/ui/badge"
import { PersonAvatar as SharedPersonAvatar } from "@/shared/ui/person-avatar"
import { CalendarIcon } from "@/shared/ui/icon"
import { useItemColumn } from "../api/use-workflow"
import { formatWorkItemDate } from "../model/format"
import { priorityMark, typeMark, type MarkTone } from "../model/marks"
import type { Person, WorkItem, WorkItemLabel, WorkItemPriority, WorkItemType } from "../model/types"
import { categoryMark, type ColumnCategory, type WorkflowColumn } from "../model/workflow"

/** 표식 색 클래스. 색이 없는 표식은 보조 아이콘 색. */
const toneClass = (tone?: MarkTone) => tone ?? "text-icon-muted"

/** 분류 아이콘(16px, 분류 색). 옆에 이름을 쓰는 자리(설정의 분류 고르기)라 화면 읽기에서는 감춘다. */
export function WorkflowCategoryIcon({ category, className }: { category: ColumnCategory; className?: string }) {
  const mark = categoryMark(category)
  return <mark.icon aria-hidden className={cn("shrink-0", toneClass(mark.tone), className)} />
}

/** 칸(상태) 아이콘: 모양과 색은 칸의 분류가, 화면 읽기의 이름은 칸 이름이 정한다. 보드 머리 · 묶음 · 고르기에 쓴다. */
export function WorkflowColumnIcon({ column, className }: { column: WorkflowColumn; className?: string }) {
  const mark = categoryMark(column.category)
  return <mark.icon role="img" aria-hidden={false} aria-label={column.name} className={cn("shrink-0", toneClass(mark.tone), className)} />
}

/** 업무 한 줄의 상태 아이콘. 업무 키의 프로젝트 워크플로에서 칸을 찾는다(지워진 칸이면 대체 칸). */
export function WorkItemStatusIcon({ item, className }: { item: Pick<WorkItem, "key" | "status">; className?: string }) {
  return <WorkflowColumnIcon column={useItemColumn(item)} className={className} />
}

/** 우선순위 표식: 긴급은 사이렌, 나머지는 세 막대 중 채운 단계, 없음은 점선 세 개. */
export function WorkItemPriorityIcon({ priority, className }: { priority: WorkItemPriority; className?: string }) {
  const mark = priorityMark(priority)
  const label = priority === "none" ? "우선순위 없음" : `우선순위 ${mark.label}`
  const props = { role: "img", "aria-label": label, className: cn("shrink-0", toneClass(mark.tone), className) }
  if (priority === "urgent") return <mark.icon {...props} aria-hidden={false} />
  return (
    <svg viewBox="0 0 24 24" width="1rem" height="1rem" focusable="false" {...props}>
      {priority === "none"
        ? <path d="M3 12h3 M10.5 12h3 M18 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        : [7, 12, 18].map((height, index) => (
          <rect key={height} x={3 + index * 7} y={21 - height} width="4" height={height} rx="1" fill="currentColor" opacity={index < mark.level ? 1 : 0.24} />
        ))}
    </svg>
  )
}

/** 유형: 아이콘과 이름(보조 글자). */
export function WorkItemTypeLabel({ type }: { type: WorkItemType }) {
  const mark = typeMark(type)
  return (
    <span className="flex min-w-0 shrink-0 items-center gap-1 text-xs text-muted-foreground">
      <mark.icon className="shrink-0 text-icon-muted" />
      <span className="truncate">{mark.label}</span>
    </span>
  )
}

/** 라벨 색 점. 저장된 색을 그대로 그린다. */
export function WorkItemLabelDot({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 16 16" width="1rem" height="1rem" aria-hidden="true" focusable="false" className="shrink-0">
      <circle cx="8" cy="8" r="6" fill={color} stroke="color-mix(in srgb, currentColor 20%, transparent)" strokeWidth="0.75" />
    </svg>
  )
}

/** 라벨 알약(radius-full): 색 점 + 이름. */
export function WorkItemLabelPill({ label }: { label: WorkItemLabel }) {
  return (
    <Badge variant="label">
      <WorkItemLabelDot color={label.color} />
      {label.name}
    </Badge>
  )
}

export function WorkItemLabels({ labels, className }: { labels: readonly WorkItemLabel[]; className?: string }) {
  if (labels.length === 0) return null
  return <span className={cn("flex items-center gap-1", className)}>{labels.map(label => <WorkItemLabelPill key={label.id} label={label} />)}</span>
}

/** 사람 아바타(20px): 호호코워크 기본 그림. */
export function PersonAvatar({ person, className }: { person: Person; className?: string }) {
  return <SharedPersonAvatar id={person.id} name={person.name} className={className} />
}

/** 담당자 없음: 점선 원 안의 사람 윤곽. 아바타와 같은 20px 자리. */
export function UnassignedAvatar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" width="1.25rem" height="1.25rem" role="img" aria-label="담당자 없음" focusable="false" className={cn("shrink-0 text-icon-muted", className)}>
      <circle cx="10" cy="10" r="9.25" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
      <circle cx="10" cy="7.5" r="2.25" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <path d="M5.5 14.5a4.75 4.75 0 0 1 9 0" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  )
}

/** 담당자: 아바타와 이름(없으면 미지정). */
export function WorkItemAssignee({ person, className }: { person?: Person; className?: string }) {
  return (
    <span className={cn("flex max-w-24 min-w-0 shrink-0 items-center gap-1.5 text-xs text-muted-foreground", className)}>
      {person ? <PersonAvatar person={person} /> : <UnassignedAvatar />}
      <span className="truncate">{person?.name ?? "미지정"}</span>
    </span>
  )
}

/** 날짜: 달력 아이콘과 10월 22일. */
export function WorkItemDate({ date, label = "마감" }: { date: string; label?: string }) {
  return (
    <span className="flex shrink-0 items-center gap-1 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
      <CalendarIcon role="img" aria-hidden={false} aria-label={label} className="shrink-0 text-icon-muted" />
      {formatWorkItemDate(date)}
    </span>
  )
}
