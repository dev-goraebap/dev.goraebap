import { derivedAvatar, drawnAvatarSource } from "@/shared/lib/avatar"
import type { Department, Member, MemberStatus } from "./types"

/** 이 앱의 "나"(앱 셸의 내 박스와 같은 사람). 내 정보 페이지가 이 구성원을 읽고 고친다. */
export const ME_ID = "emp-goh"

/** 부서. 경영진 아래에 팀이 있다(조직도의 위아래). */
export const DEPARTMENTS: readonly Department[] = [
  { id: "dept-exec", name: "경영진", lead: "emp-han" },
  { id: "dept-ops", name: "경영지원팀", lead: "emp-yoon", parent: "dept-exec" },
  { id: "dept-dev", name: "개발팀", lead: "emp-goh", parent: "dept-exec" },
  { id: "dept-design", name: "디자인팀", lead: "emp-kim", parent: "dept-exec" },
  { id: "dept-sales", name: "영업팀", lead: "emp-cho", parent: "dept-exec" },
  { id: "dept-marketing", name: "마케팅팀", lead: "emp-bae", parent: "dept-exec" },
]

export const departmentOf = (id: string) => DEPARTMENTS.find(department => department.id === id)

/** 상태와 그 점의 색(의미 토큰). */
export const STATUSES: readonly { value: MemberStatus; label: string; dot: string }[] = [
  { value: "working", label: "근무 중", dot: "bg-mark-done" },
  { value: "remote", label: "재택", dot: "bg-mark-low" },
  { value: "outside", label: "외근", dot: "bg-mark-medium" },
  { value: "leave", label: "휴가", dot: "bg-mark-high" },
  { value: "away", label: "자리 비움", dot: "bg-mark-backlog" },
]

export const statusMark = (status: MemberStatus) => STATUSES.find(each => each.value === status) ?? STATUSES[0]

/** 줄의 둘째 줄과 프로필의 소속: 직위가 있으면 직위, 없으면 직급. */
export const roleOf = (member: Member) => member.position ?? member.rank

/** 구성원의 그림 주소: 고른 그림, 고르지 않았으면 아이디로 정해지는 그림. */
export const memberPicture = (member: Pick<Member, "id" | "picture">) => drawnAvatarSource(member.picture ?? derivedAvatar(member.id))

/** 부서장을 앞에, 나머지는 직급이 높은 순 · 이름 순(호호코워크 조직도의 순서). */
const RANKS = ["대표", "부장", "차장", "과장", "대리", "사원"]
export function byDepartmentOrder(a: Member, b: Member) {
  const lead = (member: Member) => Number(departmentOf(member.departmentId)?.lead === member.id)
  return lead(b) - lead(a) || RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank) || a.name.localeCompare(b.name, "ko")
}
