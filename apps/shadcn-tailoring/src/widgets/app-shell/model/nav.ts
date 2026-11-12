import { paths, projectPath } from "@/shared/config"
import {
  BranchIcon, CalendarIcon, ClockIcon, FileTextIcon, FolderWithFilesIcon, InboxIcon, KanbanSquareIcon, MeetingIcon, MegaphoneIcon,
  MonitorIcon, ProjectsIcon, RepeatIcon, SettingsIcon, UserIcon, UsersIcon, WorkflowIcon, type Icon,
} from "@/shared/ui/icon"

/** 메뉴의 목적지 하나. */
export type NavEntry = { path: string; label: string; icon: Icon }
/** 제목이 있는 항목 묶음. 첫 묶음은 제목을 숨긴다. */
export type NavSection = { title: string; isHeaderHidden?: boolean; entries: NavEntry[] }
/** 주소에 따라 사이드바(휴대폰은 하단 탭)가 보이는 메뉴 하나. 메인이 아니면 맨 위에 돌아가기가 있다. */
export type NavSpace = { id: "main" | "account" | "project"; title: string; back?: { label: string; path: string }; sections: NavSection[] }

/** 메인 메뉴: 알림함, 워크스페이스, 더보기(호호코워크 메뉴 순서). 업무는 프로젝트마다 보므로 프로젝트 메뉴에 있다. */
export const MAIN: NavSpace = {
  id: "main", title: "cowork", sections: [
    { title: "알림함", isHeaderHidden: true, entries: [{ path: paths.notifications, label: "알림함", icon: InboxIcon }] },
    { title: "워크스페이스", entries: [
      { path: paths.schedule, label: "일정", icon: CalendarIcon },
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

/**
 * 프로젝트 하나의 메뉴(호호코워크 projectSpace): 업무 · 사이클 · 문서 · 멤버, 그 아래 관리(설정 네 쪽).
 * 목업에는 권한이 없어 관리를 늘 보인다(호호코워크는 프로젝트 관리자에게만).
 */
export function projectSpace(key: string, name: string): NavSpace {
  const at = (page: Parameters<typeof projectPath>[1]) => projectPath(key, page)
  return {
    id: "project", title: name, back: { label: "프로젝트 목록", path: paths.projects }, sections: [
      { title: name, isHeaderHidden: true, entries: [
        { path: at("work-items"), label: "업무", icon: KanbanSquareIcon },
        { path: at("cycles"), label: "사이클", icon: RepeatIcon },
        { path: at("documents"), label: "문서", icon: FolderWithFilesIcon },
        { path: at("members"), label: "멤버", icon: UsersIcon },
      ] },
      { title: "관리", entries: [
        { path: at("settings/general"), label: "일반", icon: SettingsIcon },
        { path: at("settings/workflow"), label: "워크플로", icon: WorkflowIcon },
        { path: at("settings/cycles"), label: "사이클", icon: RepeatIcon },
        { path: at("settings/integrations"), label: "저장소 연동", icon: BranchIcon },
      ] },
    ],
  }
}

/** 주소가 들어 있는 프로젝트의 키(/projects/cowork/work-items → cowork). 목록(/projects)은 없다. */
export function projectKeyOf(pathname: string) {
  return /^\/projects\/([^/]+)/.exec(pathname)?.[1]
}

/** 주소가 속한 메뉴 구역. 프로젝트 메뉴는 이름(projectName)이 필요하고, 읽는 동안은 키가 대신한다. */
export function spaceOf(pathname: string, projectName?: string): NavSpace {
  if (pathname.startsWith(paths.profile)) return ACCOUNT
  const projectKey = projectKeyOf(pathname)
  return projectKey ? projectSpace(projectKey, projectName ?? projectKey) : MAIN
}

export const entriesOf = (space: NavSpace) => space.sections.flatMap(section => section.entries)

/** 메뉴의 목적지와 그 자리(묶음 이름, 내 계정은 "나"). 전역 검색이 페이지로 찾는다. */
export type NavPlace = NavEntry & { where: string }
export const NAV_PLACES: readonly NavPlace[] = [MAIN, ACCOUNT].flatMap(space => space.sections.flatMap(section =>
  section.entries.map(entry => ({ ...entry, where: space === ACCOUNT ? "나" : section.title }))))

/** 주소에 맞는 항목: 항목 주소이거나 그 아래인 것 중 가장 긴 것. */
export function currentEntry(space: NavSpace, pathname: string) {
  return entriesOf(space)
    .filter(entry => pathname === entry.path || pathname.startsWith(`${entry.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]
}
