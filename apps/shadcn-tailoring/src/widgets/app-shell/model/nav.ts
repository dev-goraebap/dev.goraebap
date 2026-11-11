import { paths } from "@/shared/config"
import {
  CalendarIcon, ClockIcon, FileTextIcon, InboxIcon, KanbanSquareIcon, MeetingIcon, MegaphoneIcon,
  MonitorIcon, ProjectsIcon, UserIcon, UsersIcon, type Icon,
} from "@/shared/ui/icon"

/** 메뉴의 목적지 하나. */
export type NavEntry = { path: string; label: string; icon: Icon }
/** 제목이 있는 항목 묶음. 첫 묶음은 제목을 숨긴다. */
export type NavSection = { title: string; isHeaderHidden?: boolean; entries: NavEntry[] }
/** 주소에 따라 사이드바(휴대폰은 하단 탭)가 보이는 메뉴 하나. 메인이 아니면 맨 위에 돌아가기가 있다. */
export type NavSpace = { id: "main" | "account"; title: string; back?: { label: string; path: string }; sections: NavSection[] }

/** 메인 메뉴: 알림함, 워크스페이스, 더보기(호호코워크 메뉴 순서). */
export const MAIN: NavSpace = {
  id: "main", title: "cowork", sections: [
    { title: "알림함", isHeaderHidden: true, entries: [{ path: paths.notifications, label: "알림함", icon: InboxIcon }] },
    { title: "워크스페이스", entries: [
      { path: paths.schedule, label: "일정", icon: CalendarIcon },
      { path: paths.workItems, label: "업무", icon: KanbanSquareIcon },
      { path: paths.weeklyReports, label: "주간보고", icon: FileTextIcon },
      { path: paths.members, label: "구성원", icon: UsersIcon },
      { path: paths.projects, label: "프로젝트", icon: ProjectsIcon },
    ] },
    { title: "더보기", entries: [
      { path: paths.leaves, label: "근태 · 휴가", icon: ClockIcon },
      { path: paths.meetings, label: "회의록", icon: MeetingIcon },
      { path: paths.announcements, label: "공지사항", icon: MegaphoneIcon },
    ] },
  ],
}

/** 내 계정: 내 박스의 메뉴에서 연다. */
export const ACCOUNT: NavSpace = {
  id: "account", title: "내 계정", back: { label: "돌아가기", path: paths.notifications }, sections: [
    { title: "내 계정", isHeaderHidden: true, entries: [
      { path: paths.profile, label: "내 정보", icon: UserIcon },
      { path: paths.display, label: "화면 설정", icon: MonitorIcon },
    ] },
  ],
}

/** 주소가 속한 메뉴 구역. */
export function spaceOf(pathname: string): NavSpace {
  return pathname.startsWith(paths.profile) ? ACCOUNT : MAIN
}

export const entriesOf = (space: NavSpace) => space.sections.flatMap(section => section.entries)

/** 주소에 맞는 항목: 항목 주소이거나 그 아래인 것 중 가장 긴 것. */
export function currentEntry(space: NavSpace, pathname: string) {
  return entriesOf(space)
    .filter(entry => pathname === entry.path || pathname.startsWith(`${entry.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]
}
