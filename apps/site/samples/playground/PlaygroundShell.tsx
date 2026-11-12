import { useRef } from "react"
import { AppShell, type AppShellProps, type NavEntry } from "@/shared/ui/app-shell"
import { FileTextIcon, FolderIcon, UserIcon } from "@/shared/ui/icon"

/**
 * Playground 견본의 앱 셸(shadcn 키트). 견본 하나는 앱의 한 구역만 보이므로, 처음 연 구역 밖의 메뉴는 누를 수 없게 하고
 * 실제 앱처럼 보이도록 누를 수 없는 "작업 공간" 묶음을 덧붙인다.
 * 링크는 키트 셸이 라우터 Link로 그리므로 견본 앱의 라우터 안에 둔다.
 */
export function PlaygroundShell({ space, pathname, ...props }: AppShellProps) {
  const scope = useRef(pathname.split("/")[1])
  const allowed = (path: string) => {
    const base = path.split("/")[1]?.split("?")[0]
    const pair = (a: string, b: string) => [a, b].includes(scope.current) && [a, b].includes(base)
    return base === scope.current || pair("inbox", "archive") || pair("requests", "inbox")
  }
  const limit = (entry: NavEntry): NavEntry => ({ ...entry, isDisabled: !allowed(entry.path), children: entry.children?.map(limit) })
  const mock: NavEntry[] = [
    { path: "/__projects", label: "프로젝트", icon: FolderIcon, isDisabled: true },
    { path: "/__documents", label: "문서", icon: FileTextIcon, isDisabled: true },
    { path: "/__team", label: "팀", icon: UserIcon, isDisabled: true },
  ]
  return (
    <AppShell {...props} pathname={pathname}
      space={{ ...space, sections: [...space.sections.map(section => ({ ...section, entries: section.entries.map(limit) })), { title: "작업 공간", entries: mock }] }} />
  )
}
