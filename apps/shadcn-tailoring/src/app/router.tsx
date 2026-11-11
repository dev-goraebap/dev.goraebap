import { createRootRoute, createRoute, createRouter, redirect } from "@tanstack/react-router"
import { AnnouncementPage, AnnouncementsPage } from "@/pages/announcements"
import { LeaveNewPage, LeavesPage } from "@/pages/leaves"
import { LoginPage } from "@/pages/login"
import { MeetingPage, MeetingsPage } from "@/pages/meetings"
import { MemberProfilePage, MembersPage } from "@/pages/members"
import { NotFoundPage } from "@/pages/not-found"
import { NotificationsPage } from "@/pages/notifications"
import { ProfilePage } from "@/pages/profile"
import { ProjectsPage } from "@/pages/projects"
import { SchedulePage } from "@/pages/schedule"
import { SearchDialog, SearchPage } from "@/pages/search"
import { SettingsPage } from "@/pages/settings"
import { WorkItemDetailPage } from "@/pages/work-item-detail"
import { WorkItemNewPage } from "@/pages/work-item-new"
import { WeeklyReportsPage } from "@/pages/weekly-reports"
import { WorkItemsPage } from "@/pages/work-items"
import { paths } from "@/shared/config"
import { AppShell } from "@/widgets/app-shell"

// 로그인은 셸 밖, 나머지 화면은 셸(경로 없는 레이아웃) 안에 둔다.
const root = createRootRoute()
const shell = createRoute({ getParentRoute: () => root, id: "shell", component: () => <AppShell search={SearchDialog} /> })
const route = (path: string, component: () => React.ReactNode) => createRoute({ getParentRoute: () => shell, path, component })

export const router = createRouter({
  routeTree: root.addChildren([shell.addChildren([
    createRoute({ getParentRoute: () => shell, path: "/", beforeLoad: () => { throw redirect({ to: paths.notifications }) } }),
    route(paths.notifications, NotificationsPage),
    route(`${paths.notifications}/$notificationId`, NotificationsPage),
    route(paths.workItems, WorkItemsPage),
    route(`${paths.workItems}/new`, WorkItemNewPage),
    route(`${paths.workItems}/$workItemKey`, WorkItemDetailPage),
    route(paths.schedule, SchedulePage),
    route(paths.display, SettingsPage),
    route(paths.profile, ProfilePage),
    route(paths.members, MembersPage),
    route(`${paths.members}/$memberId`, MemberProfilePage),
    route(paths.announcements, AnnouncementsPage),
    route(`${paths.announcements}/$announcementId`, AnnouncementPage),
    route(paths.meetings, MeetingsPage),
    route(`${paths.meetings}/$meetingId`, MeetingPage),
    route(paths.weeklyReports, WeeklyReportsPage),
    route(paths.leaves, LeavesPage),
    route(`${paths.leaves}/new`, LeaveNewPage),
    route(paths.projects, ProjectsPage),
    route(paths.search, SearchPage),
    route("$", NotFoundPage),
  ]), createRoute({ getParentRoute: () => root, path: paths.login, component: LoginPage })]),
  defaultNotFoundComponent: NotFoundPage,
})

declare module "@tanstack/react-router" {
  interface Register { router: typeof router }
}
