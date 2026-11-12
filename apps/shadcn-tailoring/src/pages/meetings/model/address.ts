import { PROJECTS, meetingHref } from "@/entities/meeting"
import { paths } from "@/shared/config"

/** 새 회의록의 페이지. */
export const NEW_PATH = `${paths.meetings}/new`

/** 새 회의록의 주소. 목록을 한 프로젝트로 걸러 두었으면 그 프로젝트를 처음 값으로 싣는다(호호코워크 meetingCreateHref). */
export const newMeetingHref = (project?: string) => (project ? `${NEW_PATH}?${new URLSearchParams({ project })}` : NEW_PATH)

/** 주소의 처음 프로젝트(?project=). 없는 프로젝트는 버린다. */
export const projectFrom = (search: Record<string, unknown>) =>
  PROJECTS.find(project => project === search.project)

/** 회의록 수정의 주소. 호호코워크에는 회의록 수정이 없어 자기 경로가 없으므로 상세 주소에 ?compose를 단다. */
export const editMeetingHref = (id: string) => `${meetingHref(id)}?compose=1`

/** 목록 위 대화상자의 주소: 새 회의록 · 회의록 하나 · 회의록 수정(?compose). */
export function panelTarget(pathname: string | undefined, search: Record<string, unknown>): { kind: "new" } | { kind: "edit" | "detail"; id: string } | undefined {
  if (pathname === NEW_PATH) return { kind: "new" }
  const detail = /^\/meetings\/([^/]+)$/.exec(pathname ?? "")
  if (!detail) return undefined
  return { kind: search.compose === undefined ? "detail" : "edit", id: decodeURIComponent(detail[1]) }
}
