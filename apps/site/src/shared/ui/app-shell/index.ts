// 앱 셸: 메뉴는 데이터(NavSpace)로, 로고 · 나 · 도구 · 바닥 줄은 자리로 받는다.
export { AppShell, type AppShellProps, type SidebarWidth } from "./AppShell"
export { AgentBar } from "./AgentBar"
export { MeAvatar, MeBox, MeButton, MeMenu, type ShellMe } from "./MeMenu"
export { badgeText, contains, currentEntry, entriesOf, flattenEntries, phoneEntriesOf, type NavEntry, type NavSection, type NavSpace } from "./nav"
export type { FoldSlot, OpenGroups, ShellLayout } from "./ShellSidebar"
