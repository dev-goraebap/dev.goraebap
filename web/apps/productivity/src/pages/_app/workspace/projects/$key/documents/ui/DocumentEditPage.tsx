import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Suspense, useMemo, type ReactNode } from 'react';
import { documentBodyStore, documentLinks, documentOptions, libraryOptions, useRenameDocument, type DocumentRow } from '@/entities/document';
import { sessionOptions } from '@/shared/auth';
import { useLeaveEditor } from '@/shared/lib/panel';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { Button } from '@/shared/ui/kit/button';
import { DetailSurface } from '@/shared/ui/kit/detail-surface';
import { Page, useOwnPageTitle } from '@/shared/ui/kit/layout/page';
import { PageState } from '@/shared/ui/kit/page-state';
import { DocumentEditorHost } from '@/shared/ui/paged-document';
import { BodyEditContext, BodyTitle, BodyToolsContext, RichBody, useBodyEdit } from '@/shared/ui/rich-body';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import { usePageTools, type Crumb } from '../model/page-tools';

/**
 * 문서 수정 화면(/projects/{key}/documents/{id}/edit): 제목과 본문만 놓고 고치는 데 집중한다(페이지 목록·목차·활동은 두지
 * 않는다). 화면 맨 위 전체 폭에 서식 막대가 붙는다. 쪽 나눔과 문서 설정(용지·여백·머리말·바닥글)은 PDF 미리보기에서 정한다. 저장은 머리 줄의 저장 · Ctrl+S, 완료는 저장하고 문서로 돌아가며, 취소는 저장하지 않고 돌아간다. 문서 상세의 편집
 * 단추가 이 화면을 연다. 휴대폰은 저장 · 완료를 바닥 줄에 둔다(본문 도구 자리, BodyToolsContext).
 */
export function DocumentEditPage({ crumbs, projectKey, documentId }: { crumbs: Crumb[]; projectKey: string; documentId: string }) {
  const leave = useLeaveEditor();
  const isPhone = useIsMobile();
  const page = usePageTools();
  const view = useQuery(documentOptions(documentId));
  const doc = view.data?.document;
  const base = `/workspace/projects/${projectKey}/documents`;
  const detailHref = `${base}/${documentId}`;
  const back = () => leave(detailHref);
  const isEditing = !!doc && !!view.data?.canWrite;
  const path = pageCrumbs([...crumbs.slice(0, -1), { label: '문서', href: base }, { label: doc?.title ?? '문서', href: detailHref }, { label: '수정' }]);
  const actions = <div ref={page.setSlot} className="flex shrink-0 items-center gap-1.5 empty:hidden" />;
  // 데스크톱은 다른 상세 · 수정과 같은 뒤로가기 틀(2026-11-15, 둥근 ← 는 그 문서로). 휴대폰은 앱 바와 바닥의 저장 · 완료 줄.
  const frame = (children: ReactNode) => (isPhone
    ? <Page isFullScreen crumbs={path} actions={actions}
      footer={isEditing ? <div ref={page.setFoot} className="flex flex-1 items-center gap-2 *:min-w-22 *:flex-1" /> : undefined}>{children}</Page>
    : <DetailSurface surface="page" title={`${doc?.title ?? '문서'} 수정`} crumbs={path} actions={actions}>{children}</DetailSurface>);
  return <BodyToolsContext value={page.tools}>
    {frame(view.isError ? <PageState kind="not-found" title="문서를 찾을 수 없습니다" description={view.error.message} />
        : !doc ? <p className="p-4 text-muted-foreground">문서를 불러오는 중…</p>
          : !view.data?.canWrite ? <PageState kind="empty" title="이 문서는 고칠 수 없습니다" description="읽기 권한만 있습니다."
            action={<Button variant="secondary" onClick={back}>돌아가기</Button>} />
            : <Loaded key={documentId} doc={doc} onLeave={back} />)}
  </BodyToolsContext>;
}

/** 수정 화면의 제목: 이 제목이 페이지의 h1이라 Page 머리 줄은 h1을 두지 않는다. */
function EditTitle({ title }: { title: string }) {
  useOwnPageTitle();
  return <BodyTitle title={title} />;
}

function Loaded({ doc, onLeave }: { doc: DocumentRow; onLeave: () => void }) {
  const client = useQueryClient();
  // 링크 입력 칸에서 이름으로 찾아 걸 문서들: 같은 프로젝트의 문서(이 문서는 뺀다).
  const library = useQuery({ ...libraryOptions(doc.projectKey ?? ''), enabled: !!doc.projectKey }).data;
  const links = useMemo(() => documentLinks(library?.pages ?? [], doc.id), [library, doc.id]);
  const session = useQuery(sessionOptions()).data;
  const rename = useRenameDocument();
  const editing = useBodyEdit({ title: doc.title, placeholder: '문서 제목', subject: doc.id, version: doc.version, isEditor: true, onLeave,
    onSaveTitle: (title, expectedVersion) => rename.mutateAsync({ document: { ...doc, version: expectedVersion ?? doc.version }, title }) });
  const store = useMemo(() => documentBodyStore({ id: doc.id, author: session?.name ?? '나', canWrite: true, client, readerId: session?.id }),
    [doc.id, session?.name, session?.id, client]);
  return <BodyEditContext value={editing}>
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <DocumentEditorHost>
        <section aria-label={`${doc.title} 수정`} className="mx-auto flex w-full max-w-180 flex-col gap-4 px-4 pt-5 pb-10 md:pt-8 md:pb-12">
          <EditTitle title={doc.title} />
          <Suspense fallback={<p className="text-muted-foreground">본문을 불러오는 중…</p>}>
            <RichBody key={doc.id} store={store} canEdit title={doc.title} links={links} />
          </Suspense>
        </section>
      </DocumentEditorHost>
    </div>
  </BodyEditContext>;
}
