import { createRootRoute, createRoute, createRouter, Outlet, redirect } from "@tanstack/react-router"
import { useCurrentProject } from "@/entities/project"
import { AnnouncementComposePage, AnnouncementPage, AnnouncementsPage } from "@/pages/announcements"
import { LeaveNewPage, LeavesPage } from "@/pages/leaves"
import { LoginPage } from "@/pages/login"
import { MeetingCreatePage, MeetingPage, MeetingsPage } from "@/pages/meetings"
import { MemberProfilePage, MembersPage } from "@/pages/members"
import { NotFoundPage } from "@/pages/not-found"
import { NotificationsPage } from "@/pages/notifications"
import { ProjectCyclesPage } from "@/pages/project-cycles"
import { ProjectDocumentsPage } from "@/pages/project-documents"
import { ProjectMembersPage } from "@/pages/project-members"
import { ProjectSettingsPage } from "@/pages/project-settings"
import { ProfilePage } from "@/pages/profile"
import { ProjectsPage } from "@/pages/projects"
import { ScheduleDayPage, ScheduleEventPage, SchedulePage } from "@/pages/schedule"
import { SearchDialog, SearchPage } from "@/pages/search"
import { SettingsPage } from "@/pages/settings"
import { WorkItemDetailPage } from "@/pages/work-item-detail"
import { WorkItemNewPage } from "@/pages/work-item-new"
import { WeeklyReportPage, WeeklyReportsPage, WeeklyReportWritePage } from "@/pages/weekly-reports"
import { WorkItemsPage } from "@/pages/work-items"
import { paths, projectPath, workItemPath } from "@/shared/config"
import { isSignedIn, safeRedirect } from "@/shared/lib/session"
import { AppShell } from "@/widgets/app-shell"

// 로그인은 셸 밖, 나머지 화면은 셸(경로 없는 레이아웃) 안에 둔다. 들어오지 않았으면 셸 대신 로그인으로 보내고, 들어온 뒤 원래 주소로 돌아온다.
const root = createRootRoute()
const shell = createRoute({
  getParentRoute: () => root, id: "shell", component: () => <AppShell search={SearchDialog} />,
  beforeLoad: ({ location }) => {
    if (!isSignedIn()) throw redirect({ to: paths.login, search: { redirect: location.href }, replace: true })
  },
})
const login = createRoute({
  getParentRoute: () => root, path: paths.login, component: LoginPage,
  beforeLoad: ({ search }) => {
    if (isSignedIn()) throw redirect({ href: safeRedirect((search as Record<string, unknown>).redirect) ?? paths.notifications, replace: true })
  },
})
const route = (path: string, component: () => React.ReactNode) => createRoute({ getParentRoute: () => shell, path, component })
const moved = (path: string, to: (params: Record<string, string>) => string) =>
  createRoute({ getParentRoute: () => shell, path, beforeLoad: ({ params }) => { throw redirect({ href: to(params as Record<string, string>), replace: true }) } })

/** 프로젝트 안의 페이지들을 감싼다. 없는 키면 그 아래 어느 주소든 찾을 수 없음이다. */
function ProjectLayout() {
  return useCurrentProject().project === null ? <NotFoundPage /> : <Outlet />
}

// 프로젝트 안(호호코워크 projectSpace): /projects/$projectKey는 업무로 보낸다. 키는 주소에서 소문자다.
const project = createRoute({ getParentRoute: () => shell, path: `${paths.projects}/$projectKey`, component: ProjectLayout })
const inProject = (path: string, component: () => React.ReactNode) => createRoute({ getParentRoute: () => project, path, component })
const projectRoutes = project.addChildren([
  createRoute({ getParentRoute: () => project, path: "/", beforeLoad: ({ params }) => { throw redirect({ href: projectPath(params.projectKey), replace: true }) } }),
  inProject("work-items", WorkItemsPage),
  inProject("work-items/new", WorkItemNewPage),
  inProject("work-items/$number", WorkItemDetailPage),
  inProject("cycles", ProjectCyclesPage),
  inProject("documents", ProjectDocumentsPage),
  inProject("documents/$documentId", ProjectDocumentsPage),
  inProject("members", ProjectMembersPage),
  inProject("settings/$section", ProjectSettingsPage),
])

// 예전 업무 주소(전체 업무)는 cowork 프로젝트의 업무로 옮겼다.
const movedRoutes = [
  moved("/work-items", () => projectPath("cowork")),
  moved("/work-items/new", () => projectPath("cowork", "work-items/new")),
  moved("/work-items/$workItemKey", ({ workItemKey }) => workItemPath(workItemKey)),
]

export const router = createRouter({
  routeTree: root.addChildren([shell.addChildren([
    createRoute({ getParentRoute: () => shell, path: "/", beforeLoad: () => { throw redirect({ to: paths.notifications }) } }),
    route(paths.notifications, NotificationsPage),
    route(`${paths.notifications}/$notificationId`, NotificationsPage),
    route(paths.schedule, SchedulePage),
    route(`${paths.schedule}/days/$day`, ScheduleDayPage),
    route(`${paths.schedule}/events/$eventId`, ScheduleEventPage),
    route(paths.display, SettingsPage),
    route(paths.profile, ProfilePage),
    route(paths.members, MembersPage),
    route(`${paths.members}/$memberId`, MemberProfilePage),
    route(paths.announcements, AnnouncementsPage),
    route(`${paths.announcements}/new`, AnnouncementComposePage),
    route(`${paths.announcements}/$announcementId`, AnnouncementPage),
    route(`${paths.announcements}/$announcementId/edit`, AnnouncementComposePage),
    route(paths.meetings, MeetingsPage),
    route(`${paths.meetings}/new`, MeetingCreatePage),
    route(`${paths.meetings}/$meetingId`, MeetingPage),
    route(paths.weeklyReports, WeeklyReportsPage),
    route(`${paths.weeklyReports}/write`, WeeklyReportWritePage),
    route(`${paths.weeklyReports}/write/$weekStart`, WeeklyReportWritePage),
    route(`${paths.weeklyReports}/$reportId`, WeeklyReportPage),
    route(paths.leaves, LeavesPage),
    route(`${paths.leaves}/new`, LeaveNewPage),
    route(paths.projects, ProjectsPage),
    projectRoutes,
    ...movedRoutes,
    route(paths.search, SearchPage),
    route("$", NotFoundPage),
  ]), login]),
  defaultNotFoundComponent: NotFoundPage,
})

declare module "@tanstack/react-router" {
  interface Register { router: typeof router }
}
