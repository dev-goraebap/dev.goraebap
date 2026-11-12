/** 앱의 주소(호호코워크와 같은 이름). 라우터(app)와 메뉴(widgets)가 함께 읽는다. 프로젝트 안의 주소는 projectPath로 만든다. */
export const paths = {
  notifications: "/notifications",
  schedule: "/schedule",
  weeklyReports: "/weekly-reports",
  members: "/members",
  projects: "/projects",
  leaves: "/leaves",
  meetings: "/meetings",
  announcements: "/announcements",
  profile: "/profile",
  display: "/profile/display",
  search: "/search",
  login: "/login",
} as const

/** 프로젝트 메뉴의 페이지(호호코워크 projectSpace). 관리는 settings/ 아래에 있다. */
export type ProjectPage =
  | "work-items" | "work-items/new" | "cycles" | "documents" | "members"
  | "settings/general" | "settings/workflow" | "settings/cycles" | "settings/integrations"

/** 프로젝트 안의 주소. 키는 주소에서 소문자로 쓴다: projectPath("COWORK") → /projects/cowork/work-items */
export const projectPath = (projectKey: string, page: ProjectPage = "work-items") =>
  `${paths.projects}/${projectKey.toLowerCase()}/${page}`

/** 업무 상세의 주소. 업무 키는 프로젝트 키와 번호다: cowork-14 → /projects/cowork/work-items/14 */
export function workItemPath(workItemKey: string) {
  const at = workItemKey.lastIndexOf("-")
  return `${projectPath(workItemKey.slice(0, at))}/${workItemKey.slice(at + 1)}`
}
