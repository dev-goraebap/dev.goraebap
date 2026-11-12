import type { ProjectMember } from "../model/types"

/*
 * 프로젝트마다 멤버(모의). 첫 사람이 리드로, 프로젝트 목의 리드(PROJECT_PEOPLE)와 같은 사람이다. 사람 수는 프로젝트 목의
 * memberCount에 맞췄다. 참여한 날은 앞사람부터 차례로 늦어진다.
 */
const SEEDS: Record<string, { since: string; ids: string[] }> = {
  COWORK: { since: "2025-03-03", ids: ["emp-goh", "emp-lee", "emp-oh", "emp-park", "emp-lim", "emp-noh", "emp-kim", "emp-seo", "emp-moon", "emp-yoon", "emp-jung", "emp-bae"] },
  MOBILE: { since: "2025-06-02", ids: ["emp-kim", "emp-lim", "emp-song", "emp-park", "emp-moon", "emp-hong"] },
  AGENT: { since: "2025-09-01", ids: ["emp-lee", "emp-goh", "emp-oh", "emp-noh"] },
  TOWN: { since: "2025-10-13", ids: ["emp-park", "emp-seo", "emp-song", "emp-ahn", "emp-namgung"] },
  DESIGN: { since: "2025-01-06", ids: ["emp-kim", "emp-baek", "emp-seo", "emp-moon", "emp-goh", "emp-lee", "emp-bae"] },
  SEC: { since: "2026-02-02", ids: ["emp-lee", "emp-kang", "emp-yoon"] },
  SITE25: { since: "2024-11-04", ids: ["emp-goh", "emp-kim", "emp-bae", "emp-ahn"] },
  ONBOARD: { since: "2024-12-02", ids: ["emp-park", "emp-yoon"] },
}

const dayAfter = (start: string, days: number) => {
  const date = new Date(`${start}T00:00:00`)
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export const mockProjectMembers: ProjectMember[] = Object.entries(SEEDS).flatMap(([projectKey, { since, ids }]) =>
  ids.map((memberId, index) => ({ projectKey, memberId, role: index === 0 ? "lead" : "member", joinedAt: dayAfter(since, index * 9) })))
