import { byDepartmentOrder, DEPARTMENTS, MemberStatusDot, STATUSES, type Member } from "@/entities/member"
import type { FilterDef, FilterState } from "@/shared/ui/filter"
import { StructureIcon, UserIcon } from "@/shared/ui/icon"

export type FilterKey = "department" | "status"

/** 구성원의 필터: 부서(사람 수와 함께) · 상태. */
export function memberFilters(members: readonly Member[]): FilterDef<FilterKey>[] {
  return [
    { key: "department", label: "부서", icon: StructureIcon, isSearchable: true, options: DEPARTMENTS.map(department => ({
      value: department.id, label: department.name, icon: <StructureIcon className="text-icon-muted" />,
      end: <span className="text-xs text-muted-foreground tabular-nums">{members.filter(member => member.departmentId === department.id).length}명</span>,
    })) },
    { key: "status", label: "상태", icon: UserIcon,
      options: STATUSES.map(status => ({ value: status.value, label: status.label, icon: <MemberStatusDot status={status.value} className="mx-1" /> })) },
  ]
}

/** 이름 · 이메일 · 부서 · 직급 · 직위에 찾는 말이 들어 있는지(띄어쓰기 무시). */
const matches = (member: Member, departmentName: string, query: string) => {
  const words = query.replace(/\s+/g, "").toLowerCase()
  return !words || [member.name, member.email, departmentName, member.rank, member.position ?? ""].some(value => value.replace(/\s+/g, "").toLowerCase().includes(words))
}

/** 걸린 필터와 찾는 말을 통과한 구성원을 부서 순서(조직도 순서), 부서 안에서는 부서장 먼저로 늘어놓는다. */
export function visibleMembers(members: readonly Member[], state: FilterState<FilterKey>, query: string) {
  const any = (key: FilterKey, value: string) => !state[key]?.length || state[key].includes(value)
  return DEPARTMENTS.flatMap(department => members
    .filter(member => member.departmentId === department.id && any("department", department.id) && any("status", member.status)
      && matches(member, department.name, query))
    .sort(byDepartmentOrder))
}
