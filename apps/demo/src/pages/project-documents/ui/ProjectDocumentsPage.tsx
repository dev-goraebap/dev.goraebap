import { Link, useParams } from "@tanstack/react-router"
import { useDocumentLibrary } from "@/entities/document"
import { useCurrentProject } from "@/entities/project"
import { paths, projectPath } from "@/shared/config"
import { Button } from "@/shared/ui/button"
import { FolderWithFilesIcon, ProjectsIcon } from "@/shared/ui/icon"
import { Page } from "@/shared/ui/page"
import { PageState } from "@/shared/ui/page-state"
import { Skeleton } from "@/shared/ui/skeleton"
import { DocumentLibraryView } from "./DocumentLibraryView"
import { DocumentReader } from "./DocumentReader"

/** 상세 면에는 점 무늬가 없다. 읽는 중 · 없음도 같은 바탕에 둔다. */
const PLAIN = "flex flex-1 flex-col bg-background"

/** 문서를 읽는 동안 · 찾을 수 없을 때: 문서 경로까지만 보인다. */
function ReaderPlaceholder({ projectKey, projectName, isPending }: { projectKey: string; projectName: string; isPending: boolean }) {
  const base = projectPath(projectKey, "documents")
  return (
    <Page isFullScreen crumbs={[
      { label: "프로젝트", href: paths.projects }, { label: projectName, icon: ProjectsIcon, href: projectPath(projectKey) },
      { label: "문서", icon: FolderWithFilesIcon, href: base }, { label: isPending ? "문서" : "찾을 수 없음" },
    ]}>
      <div className={PLAIN}>
        {isPending ? (
          <div aria-busy="true" aria-label="문서를 읽는 중" className="mx-auto flex w-full max-w-180 flex-col gap-4 px-4 pt-5 md:pt-8">
            <Skeleton className="h-10 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : (
          <PageState kind="not-found" title="문서를 찾을 수 없습니다" description="삭제했거나 이 프로젝트의 문서가 아닙니다."
            action={<Button variant="secondary" nativeButton={false} render={<Link to={base} />}>문서로</Button>} />
        )}
      </div>
    </Page>
  )
}

/**
 * 프로젝트의 문서(호호코워크 DocumentLibraryPage · ProjectLibrary): 주소에 문서가 없으면 문서함 목록, 있으면 그 문서를 읽는다.
 * 두 라우트(documents · documents/$documentId)가 이 페이지 하나를 그린다.
 */
export function ProjectDocumentsPage() {
  const { key, project } = useCurrentProject()
  const { documentId } = useParams({ strict: false }) as { documentId?: string }
  const { data: library } = useDocumentLibrary(key)
  const projectName = project?.name ?? key
  if (!documentId) return <DocumentLibraryView projectKey={key} projectName={projectName} library={library} />
  const document = library?.documents.find(each => each.id === documentId)
  if (!library || !document) return <ReaderPlaceholder projectKey={key} projectName={projectName} isPending={!library} />
  return <DocumentReader projectKey={key} projectName={projectName} library={library} document={document} />
}
