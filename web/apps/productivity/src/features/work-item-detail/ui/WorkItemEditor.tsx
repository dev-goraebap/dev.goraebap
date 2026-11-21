import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Suspense, useMemo } from 'react';
import { documentLinks, libraryOptions } from '@/entities/document';
import { workItemOptions, workItemPath, type WorkItemView } from '@/entities/work-item';
import { isNotFound } from '@/shared/api';
import { sessionOptions } from '@/shared/auth';
import { Button } from '@/shared/ui/kit/button';
import { useOwnPageTitle } from '@/shared/ui/kit/layout/page';
import { PageState } from '@/shared/ui/kit/page-state';
import { BodyEditContext, BodyTitle, BodyToolsContext, RichBody, serverBodyStore, useBodyEdit } from '@/shared/ui/rich-body';
import { Spinner } from '@/shared/ui/kit/spinner';
import { useWorkItemChange } from '../model/use-work-item-change';
import { useBodyToolPlaces } from './body-tool-places';

/**
 * 업무의 수정 화면: 제목과 본문만 놓고 고치는 데 집중한다(상세의 속성·하위 업무·활동은 두지 않는다). 저장은 머리 줄의 저장 ·
 * Ctrl+S, 완료는 저장하고 상세로 돌아가며, 취소는 저장하지 않고 돌아간다(고친 것이 있으면 먼저 묻는다). 상세의 편집 단추가
 * 이 화면을 연다. onLeave는 상세로 돌아가는 길이다.
 */
export function WorkItemEditor({ projectKey, number, onLeave }: { projectKey: string; number: number; onLeave: () => void }) {
  const query = useQuery(workItemOptions(projectKey, number));
  if (query.isLoadingError) return isNotFound(query.error)
    ? <PageState kind="not-found" title="업무를 찾을 수 없습니다" description="지워졌거나 주소가 바뀌었을 수 있습니다." />
    : <PageState kind="error" title="업무를 불러오지 못했습니다" description={query.error.message}
      action={<Button variant="outline" onClick={() => void query.refetch()}>다시 시도</Button>} />;
  if (!query.data) return <div aria-busy="true" aria-label="업무를 불러오는 중" className="min-h-0 flex-1 bg-background" />;
  if (!query.data.canWrite) return <PageState kind="empty" title="이 업무는 고칠 수 없습니다" description="보관한 프로젝트의 업무는 읽기만 할 수 있습니다."
    action={<Button variant="outline" onClick={onLeave}>돌아가기</Button>} />;
  return <Loaded view={query.data} onLeave={onLeave} />;
}

function Loaded({ view, onLeave }: { view: WorkItemView; onLeave: () => void }) {
  const client = useQueryClient();
  const session = useQuery(sessionOptions()).data;
  const workItem = view.issue;
  const edit = useWorkItemChange(workItem);
  const editing = useBodyEdit({ title: workItem.title, subject: workItem.id, version: workItem.version, placeholder: '업무 제목', isEditor: true, onLeave,
    onSaveTitle: (title, expectedVersion) => edit.changeAsync({ title }, expectedVersion) });
  const places = useBodyToolPlaces();
  // 제목 칸(BodyTitle)이 이 화면의 h1이라 페이지 머리 줄은 h1을 두지 않는다.
  useOwnPageTitle();
  const author = session?.name ?? '나';
  // 링크 입력 칸에서 이름으로 찾아 걸 문서들: 이 업무가 속한 프로젝트의 문서.
  const library = useQuery(libraryOptions(workItem.projectKey)).data;
  const links = useMemo(() => documentLinks(library?.pages ?? []), [library]);
  const store = useMemo(() => serverBodyStore({ base: `${workItemPath(workItem.projectKey, workItem.number)}/body`, author, canWrite: true, client, readerId: session?.id }),
    [workItem.projectKey, workItem.number, author, client, session?.id]);
  // 상세의 읽기 단(45rem)과 같은 자리에 제목과 본문만 둔다. 속성 칸이 없으니 상세 틀(DetailLayout)을 쓰지 않는다.
  return <BodyEditContext value={editing}>
    <BodyToolsContext value={places.tools}>
      <section aria-label={`${workItem.ref} 수정`} className="min-w-0 flex-1 bg-background">
        <article className="mx-auto flex max-w-180 flex-col gap-4 px-4 pt-5 pb-10 md:pt-8 md:pb-12">
          <header className="flex min-w-0 items-center gap-2">
            <p className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground">
              <span className="truncate">{workItem.projectName}</span>
              <span className="shrink-0 tabular-nums">{workItem.ref}</span>
            </p>
            <div ref={places.setSlot} className="flex shrink-0 items-center gap-1" />
          </header>
          <BodyTitle title={workItem.title} />
          <Suspense fallback={<div className="flex justify-center p-6"><Spinner aria-label="본문을 불러오는 중" /></div>}>
            <RichBody key={workItem.id} store={store} canEdit title={workItem.title} links={links} />
          </Suspense>
        </article>
      </section>
      {places.foot}
    </BodyToolsContext>
  </BodyEditContext>;
}
