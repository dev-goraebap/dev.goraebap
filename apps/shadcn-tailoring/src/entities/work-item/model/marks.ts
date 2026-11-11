import { ChartNoAxesColumnIcon, CircleCheckIcon, CirclePauseIcon, ClockIcon, ListChecksIcon, RefreshCwIcon, SirenIcon, type Icon } from "@/shared/ui/icon"
import type { Person, WorkItemLabel, WorkItemPriority, WorkItemStatus, WorkItemType } from "./types"

/** 표식 색: app/styles/index.css의 --mark-* 토큰(라이트 · 다크)을 쓰는 글자색 클래스. 상태와 우선순위는 모양과 함께 색으로도 구분한다. */
export type MarkTone = "text-mark-backlog" | "text-mark-progress" | "text-mark-done" | "text-mark-urgent" | "text-mark-high" | "text-mark-medium" | "text-mark-low"

type Mark<T> = { value: T; label: string; icon: Icon; tone?: MarkTone }

/** 상태: 보드 칸 순서. 원 모양 아이콘 한 가족(멈춤 · 시계 · 회전 · 체크). */
export const STATUSES: readonly Mark<WorkItemStatus>[] = [
  { value: "backlog", label: "백로그", icon: CirclePauseIcon, tone: "text-mark-backlog" },
  { value: "todo", label: "할 일", icon: ClockIcon },
  { value: "in_progress", label: "진행 중", icon: RefreshCwIcon, tone: "text-mark-progress" },
  { value: "done", label: "완료", icon: CircleCheckIcon, tone: "text-mark-done" },
]

/** 우선순위: 긴급은 사이렌, 나머지는 막대 단계, 없음은 점선. */
export const PRIORITIES: readonly (Mark<WorkItemPriority> & { level: number })[] = [
  { value: "urgent", label: "긴급", level: 4, icon: SirenIcon, tone: "text-mark-urgent" },
  { value: "high", label: "높음", level: 3, icon: ChartNoAxesColumnIcon, tone: "text-mark-high" },
  { value: "medium", label: "보통", level: 2, icon: ChartNoAxesColumnIcon, tone: "text-mark-medium" },
  { value: "low", label: "낮음", level: 1, icon: ChartNoAxesColumnIcon, tone: "text-mark-low" },
  { value: "none", label: "없음", level: 0, icon: ChartNoAxesColumnIcon },
]

export const TYPES: readonly Mark<WorkItemType>[] = [
  { value: "task", label: "업무", icon: ListChecksIcon },
  { value: "feature", label: "기능", icon: ListChecksIcon },
  { value: "bug", label: "버그", icon: ListChecksIcon },
  { value: "epic", label: "에픽", icon: ListChecksIcon },
]

/** 프로젝트 라벨과 그 색(사용자가 고른 hex). 작은 고정 팔레트다. */
export const LABELS: readonly WorkItemLabel[] = ([
  ["디자인", "#8b5cf6"], ["서버", "#3b82f6"], ["화면", "#14b8a6"], ["버그", "#ef4444"],
  ["기능", "#22c55e"], ["성능", "#f97316"], ["문서", "#6b7280"], ["모바일", "#06b6d4"],
] as const).map(([name, color], index) => ({ id: `label-${index}`, name, color }))

export const PEOPLE: readonly Person[] = ["고재범", "김하늘", "이도윤", "박서준"].map((name, index) => ({ id: `person-${index}`, name }))
/** 이 앱의 "나". 내 업무 뷰와 담당자 필터의 "나"가 쓴다. */
export const ME: Person = PEOPLE[0]

const find = <T extends { value: string }>(list: readonly T[], value: string) => list.find(each => each.value === value) ?? list[0]
export const statusMark = (status: WorkItemStatus) => find(STATUSES, status)
export const priorityMark = (priority: WorkItemPriority) => find(PRIORITIES, priority)
export const typeMark = (type: WorkItemType) => find(TYPES, type)
