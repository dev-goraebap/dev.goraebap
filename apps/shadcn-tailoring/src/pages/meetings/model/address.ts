import { PROJECTS } from "@/entities/meeting"
import { paths } from "@/shared/config"

/** 새 회의록의 페이지. */
export const NEW_PATH = `${paths.meetings}/new`

/** 새 회의록의 주소. 목록을 한 프로젝트로 걸러 두었으면 그 프로젝트를 처음 값으로 싣는다(호호코워크 meetingCreateHref). */
export const newMeetingHref = (project?: string) => (project ? `${NEW_PATH}?${new URLSearchParams({ project })}` : NEW_PATH)

/** 주소의 처음 프로젝트(?project=). 없는 프로젝트는 버린다. */
export const projectFrom = (search: Record<string, unknown>) =>
  PROJECTS.find(project => project === search.project)
