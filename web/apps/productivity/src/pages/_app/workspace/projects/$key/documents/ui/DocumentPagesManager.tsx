import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { libraryOptions, saveDocumentOrder, useCreateBoxDocument, useDeleteDocument, useRenameDocument, type DocumentRow } from '@/entities/document';
import { cn } from 'cn';
import { Button } from '@goraebap/ui-react/compact/button';
import { ConfirmDialog } from '@/shared/ui/kit/confirm-dialog';
import { DetailSurface } from '@/shared/ui/kit/detail-surface';
import { PlusIcon } from '@/shared/ui/kit/icon';
import { PageState } from '@/shared/ui/kit/page-state';
import { MarkIcon } from '@/shared/ui/mark-picker';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import { ManagePagesContext, type ManageDraft, type ManagePagesState } from '../model/manage-pages-context';
import type { Crumb } from '../model/page-tools';
import { ManagedPagesList } from './ManagedPagesList';
import { MovePageDialog } from './MovePageDialog';
import type { DetailSurfaceOptions } from './ProjectLibrary';

/**
 * 한 문서의 페이지 트리를 한곳에서 관리한다(문서 사이드바의 톱니에서 라우트 마스킹 다이얼로그로 연다). 손잡이로 같은 층의
 * 순서를 바꾸고, 행의 …에서 하위 페이지 추가·이름 바꾸기·다른 위치로 옮기기·삭제를 한다. 맨 위 문서 자체는 옮기거나 지우지 않는다.
 */
export function DocumentPagesManager({ projectKey, documentId, crumbs, surface = 'page', onClose, onExpand }: DetailSurfaceOptions & { projectKey: string; documentId: string; crumbs: Crumb[] }) {
  const client = useQueryClient();
  const library = useQuery(libraryOptions(projectKey));
  const [draft, setDraft] = useState<ManageDraft>(null);
  const [moving, setMoving] = useState<DocumentRow>();
  const [deleting, setDeleting] = useState<DocumentRow>();
  const [failure, setFailure] = useState<string>();
  const refresh = () => client.invalidateQueries({ queryKey: ['documents'] });
  const create = useCreateBoxDocument(() => { setDraft(null); void refresh(); });
  const rename = useRenameDocument(() => { setDraft(null); void refresh(); });
  const remove = useDeleteDocument(() => { setDeleting(undefined); void refresh(); });
  const data = library.data;
  const byId = new Map((data?.pages ?? []).map(page => [page.id, page]));
  const ordered = [...(data?.order.ids ?? []).filter(id => byId.has(id)), ...(data?.pages ?? []).map(page => page.id).filter(id => !data?.order.ids.includes(id))]
    .map(id => byId.get(id)!);
  let root = byId.get(documentId);
  const seen = new Set<string>();
  while (root?.parentId && !seen.has(root.id)) { seen.add(root.id); const parent = byId.get(root.parentId); if (!parent) break; root = parent; }
  const title = root ? `${root.title} 페이지 관리` : '페이지 관리';
  const said = (reason: unknown) => setFailure(reason instanceof Error ? reason.message : '저장하지 못했습니다.');
  const order = async (ids: string[], parentId: string) => {
    const current = await client.query({ ...libraryOptions(projectKey), staleTime: 0 });
    await saveDocumentOrder(projectKey, ids, current.order.version, parentId);
    await refresh();
  };
  const manage: ManagePagesState = {
    pages: ordered, draft, setDraft, busy: create.isPending || rename.isPending,
    create: (parentId, text, mark) => { if (text.trim()) create.mutate({ projectKey, parentId, kind: 'PAGE', title: text, mark: { icon: mark?.icon ?? 'document', color: mark?.color ?? null } }); },
    rename: (page, text) => { if (text.trim() && text.trim() !== page.title) rename.mutate({ document: page, title: text }); else setDraft(null); },
    onMove: setMoving, onDelete: page => { remove.reset(); setDeleting(page); }, order, onError: said,
  };
  const error = failure ?? create.error?.message ?? rename.error?.message;
  return <DetailSurface surface={surface} onClose={onClose} onExpand={onExpand} crumbs={pageCrumbs([...crumbs, { label: title }])} title={title}>
    <div className={cn('flex flex-1 flex-col', surface !== 'dialog' && 'bg-background')}>
      <div className={cn('mx-auto flex w-full flex-col gap-3', surface !== 'dialog' && 'max-w-180 px-4 pt-4 pb-8')}>
        {library.isError ? <PageState isCompact kind="error" title="페이지를 불러오지 못했습니다" description={library.error.message} />
          : !data ? <p className="text-muted-foreground">페이지를 불러오는 중입니다</p>
            : !root ? <PageState isCompact kind="not-found" title="문서를 찾을 수 없습니다" />
              : !data.canManage ? <PageState isCompact kind="empty" title="페이지를 관리할 권한이 없습니다" />
                : <ManagePagesContext value={manage}>
                  <div className="flex flex-col gap-2">
                    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
                    <div className="flex min-h-10 items-center gap-2 border-b px-2">
                      <MarkIcon name={root.icon ?? 'document'} className="size-4 shrink-0 text-icon-muted" />
                      <span className="min-w-0 flex-1 truncate font-semibold">{root.title}</span>
                      <Button variant="secondary" size="sm" onClick={() => setDraft({ kind: 'new', parentId: root!.id })}><PlusIcon data-icon="inline-start" />새 페이지</Button>
                    </div>
                    <ManagedPagesList parentId={root.id} />
                  </div>
                </ManagePagesContext>}
      </div>
    </div>
    {moving && data ? <MovePageDialog projectKey={projectKey} document={moving} pages={data.pages} onDone={() => { setMoving(undefined); void refresh(); }} onClose={() => setMoving(undefined)} /> : null}
    <ConfirmDialog open={!!deleting} onOpenChange={open => { if (!open) setDeleting(undefined); }}
      title={`'${deleting?.title ?? ''}' 페이지를 삭제할까요?`} description={remove.error?.message ?? '이 페이지와 그 아래의 하위 페이지를 함께 삭제합니다.'}
      action={{ label: '삭제', isPending: remove.isPending, onAction: () => { if (deleting) remove.mutate({ document: deleting }); } }} />
  </DetailSurface>;
}
