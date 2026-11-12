import { Link, useNavigate } from "@tanstack/react-router"
import { useRef, useState } from "react"
import {
  DocumentLabelDot, ancestorsOf, childrenOf, fullDateText, headingsOf, isSectionPage, readingOrderOf, rootOf, useDeleteDocument,
  type DocumentLibrary, type ProjectDocument,
} from "@/entities/document"
import { paths, projectPath } from "@/shared/config"
import { useComposeParam } from "@/shared/lib/use-compose-param"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { cn } from "@/shared/lib/utils"
import { ActionMenu, type MenuAction } from "@/shared/ui/action-menu"
import { Button } from "@/shared/ui/button"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer"
import {
  CalendarIcon, ChevronLeftIcon, ChevronRightIcon, FolderWithFilesIcon, HistoryIcon, LinkIcon, ListIcon, PencilIcon, PlusIcon, ProjectsIcon, Trash2Icon,
} from "@/shared/ui/icon"
import { InfoPill } from "@/shared/ui/info-pill"
import { Page, type Crumb } from "@/shared/ui/page"
import { PersonAvatar } from "@/shared/ui/person-avatar"
import { DetailLayout, MarkdownBody, type DetailSection } from "@/shared/ui/reading"
import { toast } from "@/shared/ui/toast"
import { DocumentCompose } from "./DocumentCompose"
import { DocumentSideNav, DocumentTree } from "./DocumentSideNav"

/** 본문의 소제목 목차(호호코워크 BodyOutline): 넓은 옆 칸에서만 보이고, 누르면 그 소제목으로 내려간다. */
function Outline({ headings, onPick }: { headings: ReturnType<typeof headingsOf>; onPick: (index: number) => void }) {
  return (
    <nav aria-label="본문 목차" className="hidden w-full flex-col @min-[60rem]/detail:flex">
      {headings.map((heading, index) => (
        <button key={index} type="button" onClick={() => onPick(index)}
          className={cn("flex min-h-8 w-full items-center rounded-lg px-2 py-1 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
            heading.level === 3 && "pl-5")}>
          <span className="line-clamp-2">{heading.text}</span>
        </button>
      ))}
    </nav>
  )
}

/** 속성 칸: 목차(소제목이 있으면, 맨 위) · 라벨(맨 위 문서만) · 정보(작성자 · 작성일 · 마지막 수정). */
function sectionsOf(document: ProjectDocument, library: DocumentLibrary, onPick: (index: number) => void): DetailSection[] {
  const headings = headingsOf(document.body)
  const labels = library.labels.filter(label => document.labelIds.includes(label.id))
  return [
    ...(headings.length > 0 ? [{ title: "목차", items: <Outline headings={headings} onPick={onPick} /> }] : []),
    ...(labels.length > 0 ? [{
      title: "문서 라벨",
      items: labels.map(label => <InfoPill key={label.id} label="문서 라벨" icon={<DocumentLabelDot color={label.color} />}>{label.name}</InfoPill>),
    }] : []),
    {
      title: "정보",
      items: (
        <>
          <InfoPill label="작성자" icon={<PersonAvatar id={document.author.id} name={document.author.name} className="size-4" />}>{document.author.name}</InfoPill>
          <InfoPill label="작성일" icon={<CalendarIcon />}>{fullDateText(document.createdAt)}</InfoPill>
          <InfoPill label="마지막 수정" icon={<HistoryIcon />}>{`${document.updatedBy.name} · ${fullDateText(document.updatedAt)}`}</InfoPill>
        </>
      ),
    },
  ]
}

/** 하위 페이지가 있는 문서의 이전 · 다음 페이지(읽을 차례, 구역 페이지는 건너뛴다). */
function ReadingNavigation({ base, previous, next }: { base: string; previous?: ProjectDocument; next?: ProjectDocument }) {
  const step = (page: ProjectDocument | undefined, label: string, isNext: boolean) => page ? (
    <Button variant="secondary" nativeButton={false} render={<Link to={`${base}/${page.id}`} />}
      className={cn("h-auto min-w-0 max-w-[48%] flex-col gap-0.5 px-3 py-2 md:h-auto", isNext ? "items-end" : "items-start")}>
      <span className="text-xs font-normal text-muted-foreground">{label}</span>
      <span className="flex min-w-0 max-w-full items-center gap-1">
        {!isNext && <ChevronLeftIcon />}
        <span className="truncate">{page.title}</span>
        {isNext && <ChevronRightIcon />}
      </span>
    </Button>
  ) : <span />
  return (
    <nav aria-label="페이지 이동" className="flex items-stretch justify-between gap-2 border-t pt-5">
      {step(previous, "이전 페이지", false)}
      {step(next, "다음 페이지", true)}
    </nav>
  )
}

/**
 * 문서 읽기(호호코워크 ProjectLibrary의 문서 자리 · DocumentReader): 데스크톱은 하위 페이지가 있으면 왼쪽에 페이지 목차 칸,
 * 오른쪽은 다른 본문 상세와 같은 DetailLayout(제목 · Markdown 본문 · 속성 칸)과 이전 · 다음 페이지.
 * 휴대폰은 자기 화면(← 문서)이고, 페이지 목차는 … 메뉴의 목차가 여는 바텀시트다.
 * 수정은 데스크톱에서 이 문서 위 대화상자, 휴대폰에서는 이 자리를 대신하는 양식 페이지다(?compose). 하위 페이지 만들기도 같다.
 */
export function DocumentReader({ projectKey, projectName, library, document }: {
  projectKey: string; projectName: string; library: DocumentLibrary; document: ProjectDocument
}) {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const compose = useComposeParam()
  const remove = useDeleteDocument(projectKey)
  const [isAddingPage, setAddingPage] = useState(false)
  const [isContentsOpen, setContentsOpen] = useState(false)
  const [isConfirming, setConfirming] = useState(false)
  const body = useRef<HTMLDivElement>(null)

  const base = projectPath(projectKey, "documents")
  const { documents } = library
  const root = rootOf(documents, document)
  const hasTree = childrenOf(documents, root.id).length > 0
  const order = hasTree ? readingOrderOf(documents, root) : []
  const at = order.indexOf(document.id)
  const byId = (id?: string) => documents.find(each => each.id === id)
  const subpages = childrenOf(documents, document.id).length

  const crumbs: Crumb[] = [
    { label: "프로젝트", href: paths.projects },
    { label: projectName, icon: ProjectsIcon, href: projectPath(projectKey) },
    { label: "문서", icon: FolderWithFilesIcon, href: base },
    // 구역 페이지는 본문이 없어 갈 곳이 아니다. 휴대폰의 ←도 그 위 문서로 간다.
    ...ancestorsOf(documents, document.id).map(page => ({ label: page.title, href: isSectionPage(page, documents) ? undefined : `${base}/${page.id}` })),
    { label: document.title },
  ]

  const pickHeading = (index: number) => body.current?.querySelectorAll("h2, h3")[index]?.scrollIntoView({ behavior: "smooth", block: "start" })
  const confirmDelete = () => remove.mutate(document.id, {
    onSuccess: () => {
      toast.add({ type: "success", title: "문서를 삭제했습니다", description: document.title })
      void navigate({ to: document.parentId ? `${base}/${document.parentId}` : base, replace: true })
    },
  })
  const actions: MenuAction[] = [
    ...(isMobile && hasTree ? [{ label: "목차", icon: ListIcon, onSelect: () => setContentsOpen(true) }] : []),
    { label: "하위 페이지 만들기", icon: PlusIcon, onSelect: () => setAddingPage(true) },
    {
      label: "링크 복사", icon: LinkIcon, onSelect: () => void navigator.clipboard.writeText(location.href).then(
        () => toast.add({ type: "success", title: "링크를 복사했습니다" }),
        () => toast.add({ type: "error", title: "복사하지 못했습니다" }),
      ),
    },
    { label: "수정", icon: PencilIcon, onSelect: compose.open },
    { label: "삭제", icon: Trash2Icon, onSelect: () => setConfirming(true) },
  ]

  const surface = isMobile ? "page" : "dialog"
  const editor = compose.isOpen && (
    <DocumentCompose key={document.id} projectKey={projectKey} projectName={projectName} labels={library.labels} document={document}
      surface={surface} onClose={compose.close} onSaved={compose.close} />
  )
  const pageComposer = isAddingPage && (
    <DocumentCompose projectKey={projectKey} projectName={projectName} labels={library.labels} parent={document}
      surface={surface} onClose={() => setAddingPage(false)}
      onSaved={id => { setAddingPage(false); void navigate({ to: `${base}/${id}` }) }} />
  )
  // 휴대폰의 양식은 문서 대신 이 자리를 채운다.
  if (isMobile && (editor || pageComposer)) return editor || pageComposer

  return (
    <div className="flex min-h-0 flex-1">
      {/* 본문 쪽(Page)만 문서마다 새로 그려 스크롤을 맨 위로 돌리고, 목차 칸은 접기 · 너비를 그대로 둔다. */}
      {!isMobile && hasTree && <DocumentSideNav documents={documents} root={root} base={base} currentId={document.id} />}
      <div className="flex min-w-0 flex-1 flex-col">
        <Page key={document.id} crumbs={crumbs} isFullScreen actions={<ActionMenu label="문서 메뉴" title={document.title} actions={actions} />}>
          <DetailLayout label={document.title} title={document.title} sections={sectionsOf(document, library, pickHeading)}
            after={hasTree && order.length > 1 && <ReadingNavigation base={base} previous={byId(order[at - 1])} next={byId(order[at + 1])} />}>
            <div ref={body} className="flex flex-col gap-5">
              {document.body.trim()
                ? <MarkdownBody source={document.body} />
                : <p className="text-muted-foreground">아직 작성한 내용이 없습니다.</p>}
            </div>
          </DetailLayout>
        </Page>
      </div>
      {isMobile && hasTree && (
        <Drawer open={isContentsOpen} onOpenChange={setContentsOpen}>
          <DrawerContent>
            <DrawerHeader><DrawerTitle>페이지 목차</DrawerTitle></DrawerHeader>
            <div className="max-h-[70dvh] overflow-y-auto px-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
              <DocumentTree documents={documents} root={root} base={base} currentId={document.id} onNavigate={() => setContentsOpen(false)} />
            </div>
          </DrawerContent>
        </Drawer>
      )}
      <ConfirmDialog open={isConfirming} onOpenChange={setConfirming} title="문서를 삭제할까요?"
        description={subpages > 0 ? `'${document.title}'과 그 아래의 하위 페이지를 함께 삭제합니다.` : `'${document.title}' 문서를 삭제합니다.`}
        action={{ label: "삭제", onAction: confirmDelete, isPending: remove.isPending }} />
      {editor}
      {pageComposer}
    </div>
  )
}
