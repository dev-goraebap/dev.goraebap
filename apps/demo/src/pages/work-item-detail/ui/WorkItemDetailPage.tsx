import { Link, useNavigate, useParams } from "@tanstack/react-router"
import { useState } from "react"
import {
  copyWorkItemKey, copyWorkItemLink, projectKeyOf, typeMark, useDeleteWorkItem, useStatusColumns, useUpdateWorkItem, useWorkItem, type WorkItem,
} from "@/entities/work-item"
import { useCurrentProject } from "@/entities/project"
import { paths, projectPath } from "@/shared/config"
import { ActionMenu } from "@/shared/ui/action-menu"
import { Button } from "@/shared/ui/button"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { PageState } from "@/shared/ui/page-state"
import { CopyIcon, KanbanSquareIcon, LinkIcon, ProjectsIcon, Trash2Icon } from "@/shared/ui/icon"
import { Page, type Crumb } from "@/shared/ui/page"
import { DetailLayout, MarkdownBody } from "@/shared/ui/reading"
import { Skeleton } from "@/shared/ui/skeleton"
import { toast } from "@/shared/ui/toast"
import { WorkItemActivity } from "./WorkItemActivity"
import { workItemSections } from "./WorkItemProperties"

/** 머리 줄 끝의 페이지 메뉴(…): 링크 복사 · 키 복사 · 삭제. 삭제는 확인을 받고, 지우면 목록으로 돌아간다. */
function WorkItemPageMenu({ item }: { item: WorkItem }) {
  const navigate = useNavigate()
  const remove = useDeleteWorkItem()
  const [isConfirming, setConfirming] = useState(false)
  const confirm = () => remove.mutate(item.key, {
    onSuccess: () => {
      toast.add({ type: "success", title: `${item.key}를 지웠습니다` })
      void navigate({ to: projectPath(item.key.slice(0, item.key.lastIndexOf("-"))) })
    },
  })
  return (
    <>
      <ActionMenu label="업무 메뉴" title={item.key} actions={[
        { label: "링크 복사", icon: LinkIcon, onSelect: () => void copyWorkItemLink(item) },
        { label: "키 복사", icon: CopyIcon, onSelect: () => void copyWorkItemKey(item) },
        { label: "삭제", icon: Trash2Icon, onSelect: () => setConfirming(true) },
      ]} />
      <ConfirmDialog open={isConfirming} onOpenChange={setConfirming} title={`${item.key} 업무를 지울까요?`}
        description="업무가 목록과 보드에서 사라집니다. 번호는 다시 쓰지 않습니다."
        action={{ label: "삭제", onAction: confirm, isPending: remove.isPending }} />
    </>
  )
}

/** 읽어 온 업무: 소속 줄 · 제목 · 본문 · 활동, 속성 알약. */
function WorkItemDetail({ item, projectName }: { item: WorkItem; projectName: string }) {
  const update = useUpdateWorkItem()
  const columns = useStatusColumns(projectKeyOf(item.key))
  return (
    <DetailLayout label={`${item.key} ${item.title}`} title={item.title}
      head={
        <p className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <span className="truncate">{projectName}</span>
          <span className="shrink-0 tabular-nums">{item.key}</span>
        </p>
      }
      sections={workItemSections(item, columns, patch => update.mutate({ key: item.key, patch }))}
      after={<WorkItemActivity itemKey={item.key} />}>
      {item.body ? <MarkdownBody source={item.body} /> : <p className="text-muted-foreground">설명이 없습니다.</p>}
    </DetailLayout>
  )
}

/** 상세 면에는 점 무늬가 없다. 읽는 중 · 없음도 같은 바탕에 둔다. */
const PLAIN = "flex flex-1 flex-col bg-background"

/** 읽는 동안의 자리: 읽기 단 폭의 제목과 본문 줄. */
function DetailSkeleton() {
  return (
    <div className={PLAIN}>
      <div aria-busy="true" aria-label="업무를 읽는 중" className="mx-auto flex w-full max-w-180 flex-col gap-4 px-4 pt-5 md:pt-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  )
}

function NotFound({ projectKey }: { projectKey: string }) {
  return (
    <div className={PLAIN}>
      <PageState kind="not-found" title="업무를 찾을 수 없습니다" description="지워졌거나 주소가 바뀌었을 수 있습니다."
        action={<Button variant="outline" nativeButton={false} render={<Link to={projectPath(projectKey)} />}>업무 목록으로</Button>} />
    </div>
  )
}

/**
 * 업무 상세(호호코워크 업무 페이지, /projects/$projectKey/work-items/$number): 경로 프로젝트 › 프로젝트 이름 › 업무 › 키, 머리 줄 끝에 페이지 메뉴.
 * 휴대폰은 앱 바의 ← 가 업무 목록으로 가고, 속성 알약은 화면 아래에 고정된다(DetailLayout).
 */
export function WorkItemDetailPage() {
  const { number = "" } = useParams({ strict: false }) as { number?: string }
  const { key: projectKey, project } = useCurrentProject()
  const workItemKey = `${projectKey}-${number}`
  const { data: item } = useWorkItem(workItemKey)
  const crumbs: Crumb[] = [
    { label: "프로젝트", href: paths.projects },
    { label: project?.name ?? projectKey, href: projectPath(projectKey), icon: ProjectsIcon },
    { label: "업무", href: projectPath(projectKey) },
    { label: workItemKey, icon: item ? typeMark(item.type).icon : KanbanSquareIcon },
  ]
  return (
    <Page crumbs={crumbs} actions={item && <WorkItemPageMenu item={item} />} isFullScreen>
      {item === undefined ? <DetailSkeleton /> : item === null ? <NotFound projectKey={projectKey} /> : <WorkItemDetail item={item} projectName={project?.name ?? projectKey} />}
    </Page>
  )
}
