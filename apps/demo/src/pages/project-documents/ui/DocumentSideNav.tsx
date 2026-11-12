import { Link } from "@tanstack/react-router"
import { useState, type ReactNode } from "react"
import { DocumentIcon, childrenOf, isSectionPage, type ProjectDocument } from "@/entities/document"
import { useStoredWidth } from "@/shared/lib/use-stored-width"
import { cn } from "cn"
import { Button } from "@/shared/ui/button"
import { ChevronDownIcon, ChevronRightIcon, PanelLeftIcon } from "@/shared/ui/icon"
import { PaneResizeHandle } from "@/shared/ui/pane-resize-handle"

const NAV_MIN = 220
const NAV_MAX = 440

/** 맨 위 문서의 하위를 차례대로 묶는다: 구역 페이지는 제목과 그 하위, 나머지는 이어진 것끼리 제목 없는 묶음. */
function groupsOf(documents: readonly ProjectDocument[], root: ProjectDocument) {
  const groups: { section?: ProjectDocument; items: ProjectDocument[] }[] = [{ items: [] }]
  for (const page of childrenOf(documents, root.id)) {
    if (isSectionPage(page, documents)) groups.push({ section: page, items: childrenOf(documents, page.id) })
    else if (groups.at(-1)!.section) groups.push({ items: [page] })
    else groups.at(-1)!.items.push(page)
  }
  return groups
}

/** 앱 사이드바의 메뉴 줄과 같은 모양: 32px(휴대폰 48px), 지금 자리는 진한 바탕과 Bold Duotone 아이콘. */
const ITEM = [
  "flex h-8 min-w-0 flex-1 items-center gap-2 rounded-[0.625rem] px-2 text-sm outline-none hover:bg-sidebar-accent",
  "focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-medium max-md:h-12 max-md:text-base",
].join(" ")

function PageLink({ page, base, currentId, onNavigate }: { page: ProjectDocument; base: string; currentId: string; onNavigate?: () => void }) {
  const isCurrent = page.id === currentId
  return (
    <Link to={`${base}/${page.id}`} aria-current={isCurrent ? "page" : undefined} className={ITEM} onClick={onNavigate}>
      <DocumentIcon document={page} chosen={isCurrent} className={cn("size-4", !isCurrent && "text-icon-muted")} />
      <span className="truncate">{page.title}</span>
    </Link>
  )
}

/** 페이지 하나와 그 하위. 하위가 있으면 끝에 접기 단추가 있고, 처음에는 펼쳐 둔다. */
function PageItem({ page, documents, base, currentId, onNavigate }: {
  page: ProjectDocument; documents: readonly ProjectDocument[]; base: string; currentId: string; onNavigate?: () => void
}) {
  const [isOpen, setOpen] = useState(true)
  const children = childrenOf(documents, page.id)
  return (
    <li className="flex flex-col gap-0.5">
      <div className="flex items-center gap-0.5">
        <PageLink page={page} base={base} currentId={currentId} onNavigate={onNavigate} />
        {children.length > 0 && (
          <Button variant="ghost" size="icon-xs" aria-expanded={isOpen} aria-label={`${page.title} 하위 페이지 ${isOpen ? "접기" : "펼치기"}`}
            className="text-icon-muted max-md:size-11" onClick={() => setOpen(!isOpen)}>
            {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </Button>
        )}
      </div>
      {children.length > 0 && isOpen && (
        <ul className="flex flex-col gap-0.5 pl-4">
          {children.map(child => <PageItem key={child.id} page={child} documents={documents} base={base} currentId={currentId} onNavigate={onNavigate} />)}
        </ul>
      )}
    </li>
  )
}

/**
 * 하위 페이지가 있는 문서의 페이지 목차(호호코워크 DocumentSideNav). 맨 위 문서가 첫 항목이고, 본문 없이 하위만 묶는
 * 1단계 페이지는 구역 제목(앱 사이드바의 '관리'처럼)이 되어 그 하위를 들여쓰기 없이 늘어놓는다. 휴대폰 목차 시트도 같은 줄을 쓴다.
 */
export function DocumentTree({ documents, root, base, currentId, onNavigate }: {
  documents: readonly ProjectDocument[]; root: ProjectDocument; base: string; currentId: string
  /** 휴대폰 시트: 고르면 닫는다. */
  onNavigate?: () => void
}) {
  const groups = groupsOf(documents, root)
  const item = (page: ProjectDocument): ReactNode =>
    <PageItem key={page.id} page={page} documents={documents} base={base} currentId={currentId} onNavigate={onNavigate} />
  return (
    <nav aria-label={`${root.title} 페이지`} className="flex flex-col gap-4">
      {groups.map((group, index) => index > 0 && group.items.length === 0 ? null : (
        <section key={group.section?.id ?? `pages-${index}`} aria-label={group.section?.title ?? root.title} className="flex flex-col gap-0.5">
          {group.section && <h3 className="flex h-8 items-center px-2 text-xs font-medium text-muted-foreground">{group.section.title}</h3>}
          <ul className="flex flex-col gap-0.5">
            {index === 0 && <li className="flex"><PageLink page={root} base={base} currentId={currentId} onNavigate={onNavigate} /></li>}
            {group.items.map(item)}
          </ul>
        </section>
      ))}
    </nav>
  )
}

/**
 * 데스크톱의 페이지 목차 칸: 머리 줄은 옆 페이지 머리 줄과 같은 높이 · 아래 선으로 한 줄을 이루고, 끌어서 너비를 바꾼다.
 * 접으면 펼치기 단추만 있는 얇은 줄이 된다(접은 것은 이 브라우저에 남는다).
 */
export function DocumentSideNav({ documents, root, base, currentId }: {
  documents: readonly ProjectDocument[]; root: ProjectDocument; base: string; currentId: string
}) {
  const [width, resize] = useStoredWidth({ key: "document-nav-width", min: NAV_MIN, max: NAV_MAX, initial: 288 })
  const [isFolded, setFolded] = useStoredFlag("document-nav-folded")
  if (isFolded) {
    return (
      <aside aria-label={`${root.title} 페이지`} className="flex shrink-0 flex-col items-center border-r bg-sidebar px-1 py-2.5">
        <Button variant="ghost" size="icon-sm" aria-label="목차 펼치기" title="목차 펼치기" onClick={() => setFolded(false)}><PanelLeftIcon /></Button>
      </aside>
    )
  }
  return (
    <>
      {/* check-ui: allow-style 목차 칸의 너비는 사용자가 끌어 정한 값이다. */}
      <aside aria-label={`${root.title} 페이지`} style={{ width }} className="flex min-h-0 shrink-0 flex-col bg-sidebar">
        <header className="flex h-13 shrink-0 items-center justify-between gap-2 border-b pr-2 pl-4">
          <h2 className="text-sm font-semibold">목차</h2>
          <Button variant="ghost" size="icon-sm" aria-label="목차 접기" title="목차 접기" onClick={() => setFolded(true)}><PanelLeftIcon /></Button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          <DocumentTree documents={documents} root={root} base={base} currentId={currentId} />
        </div>
      </aside>
      <PaneResizeHandle label="목차 너비" value={width} min={NAV_MIN} max={NAV_MAX} onChange={resize} />
    </>
  )
}

/** 이 브라우저에 남기는 켬 · 끔. 저장할 수 없으면 이 화면에서만 기억한다. */
function useStoredFlag(key: string) {
  const [value, setValue] = useState(() => {
    try {
      return localStorage.getItem(key) === "1"
    } catch {
      return false
    }
  })
  const change = (next: boolean) => {
    setValue(next)
    try {
      localStorage.setItem(key, next ? "1" : "0")
    } catch {
      // 저장할 수 없어도 이번 화면에는 반영한다.
    }
  }
  return [value, change] as const
}
