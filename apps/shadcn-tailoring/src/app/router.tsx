import { createRootRoute, createRoute, createRouter, redirect } from "@tanstack/react-router"
import { ComingSoonPage } from "@/pages/coming-soon"
import { NotificationsPage } from "@/pages/notifications"
import { SchedulePage } from "@/pages/schedule"
import { SettingsPage } from "@/pages/settings"
import { WorkItemDetailPage } from "@/pages/work-item-detail"
import { WorkItemsPage } from "@/pages/work-items"
import { paths } from "@/shared/config"
import {
  ClockIcon, FileTextIcon, MeetingIcon, MegaphoneIcon, ProjectsIcon, UserIcon, UsersIcon,
} from "@/shared/ui/icon"
import { AppShell } from "@/widgets/app-shell"

const root = createRootRoute({ component: AppShell })
const route = (path: string, component: () => React.ReactNode) => createRoute({ getParentRoute: () => root, path, component })

/** 아직 옮기지 않은 메뉴. 주소는 살려 두고 "옮기는 중"을 보인다. */
const comingSoon = [
  { path: paths.weeklyReports, title: "주간보고", icon: FileTextIcon },
  { path: paths.members, title: "구성원", icon: UsersIcon },
  { path: paths.projects, title: "프로젝트", icon: ProjectsIcon },
  { path: paths.leaves, title: "근태 · 휴가", icon: ClockIcon },
  { path: paths.meetings, title: "회의록", icon: MeetingIcon },
  { path: paths.announcements, title: "공지사항", icon: MegaphoneIcon },
  { path: paths.profile, title: "내 정보", icon: UserIcon },
]

export const router = createRouter({
  routeTree: root.addChildren([
    createRoute({ getParentRoute: () => root, path: "/", beforeLoad: () => { throw redirect({ to: paths.notifications }) } }),
    route(paths.notifications, NotificationsPage),
    route(`${paths.notifications}/$notificationId`, NotificationsPage),
    route(paths.workItems, WorkItemsPage),
    route(`${paths.workItems}/$workItemKey`, WorkItemDetailPage),
    route(paths.schedule, SchedulePage),
    route(paths.display, SettingsPage),
    ...comingSoon.map(item => route(item.path, () => <ComingSoonPage title={item.title} icon={item.icon} />)),
  ]),
})

declare module "@tanstack/react-router" {
  interface Register { router: typeof router }
}
