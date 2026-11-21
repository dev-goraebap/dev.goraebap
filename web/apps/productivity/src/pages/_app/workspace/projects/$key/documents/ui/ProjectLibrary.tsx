import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { deleteDocumentView, orderDocumentViews, documentsOptions, libraryOptions, saveDocumentOrder, type DocumentRow, type LibrarySort } from '@/entities/document';
import { projectOptions } from '@/entities/project';
import { useAddressWords, useAddressWriter } from '@/shared/lib/list-address';
import { useOpenPanel } from '@/shared/lib/panel';
import { usePendingPathname } from '@/shared/lib/route-location';
import { rowReorderStyles as rows, useRowReorder } from '@/shared/lib/row-reorder';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { cn } from 'cn';
import { Badge } from '@/shared/ui/kit/badge';
import { Button } from '@/shared/ui/kit/button';
import { Dialog, DialogBar, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/kit/dialog';
import { DisplayChoice, DisplayMenu } from '@/shared/ui/kit/display-menu';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/shared/ui/kit/drawer';
import { FilterBar, FilterChips, FilterMenu, useFilters, type FilterDef } from '@/shared/ui/kit/filter';
import { GripIcon, TagIcon } from '@/shared/ui/kit/icon';
import { LabelDot } from '@/shared/ui/label-dot/LabelDot';
import { MarkIcon } from '@/shared/ui/mark-picker';
import { Page } from '@/shared/ui/kit/layout/page';
import { PageState } from '@/shared/ui/kit/page-state';
import { SearchTool } from '@/shared/ui/kit/search-tool';
import { ViewBar } from '@/shared/ui/views';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import type { Crumb } from '../model/page-tools';
import { DocumentCard } from './DocumentCard';
import { DocumentPages, TREE_LINK } from './DocumentPages';
import { DocumentReader } from './DocumentReader';
import { DocumentSideNav, isSectionPage } from './DocumentSideNav';
import { LabelsDialog, NewDocumentDialog, ViewDialog } from './LibraryDialogs';
import { MovePageDialog } from './MovePageDialog';
import { isNotFound } from '@/shared/api';

/** 라우터 · 목록 위 대화상자가 문서 상세에 넘기는 놓일 곳(PanelHost의 detail). */
export type DetailSurfaceOptions = { surface?: 'page' | 'dialog'; onClose?: () => void; onExpand?: () => void };

type Dialog = 'new' | 'view' | 'new-view' | 'labels' | 'move' | null;
type Sort = 'custom' | 'title' | 'updated' | 'created';
type Layout = 'GRID' | 'LIST';
type Display = { layout: Layout; sort: Sort; direction: 'asc' | 'desc' };
const SORTS: { value: Sort; label: string; kind: 'rank' | 'text' | 'date' }[] = [
  { value: 'custom', label: '사용자 지정', kind: 'rank' }, { value: 'title', label: '제목', kind: 'text' },
  { value: 'updated', label: '수정일', kind: 'date' }, { value: 'created', label: '작성일', kind: 'date' },
];
const LAYOUTS: { value: Layout; label: string }[] = [{ value: 'GRID', label: '그리드' }, { value: 'LIST', label: '리스트' }];
/** 방향의 말은 정렬 기준에 맞춘다. 앞이 오름차순이다. */
const DIRECTIONS = { rank: ['처음 → 끝', '끝 → 처음'], text: ['가 → 하', '하 → 가'], date: ['오래된 → 최신', '최신 → 오래된'] } as const;
const isSort = (value: unknown): value is Sort => SORTS.some(sort => sort.value === value);

export function ProjectLibrary({ crumbs, projectKey, documentId, ...surface }: { crumbs: Crumb[]; projectKey: string; documentId?: string } & DetailSurfaceOptions) {
  const client = useQueryClient(), navigate = useNavigate();
  const open = useOpenPanel();
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const write = useAddressWriter();
  const [words, setWords] = useAddressWords('q');
  const base = `/workspace/projects/${encodeURIComponent(projectKey)}/documents`;
  // 같은 문서함의 다른 페이지로 가는 중이면 사이드바 선택을 응답 전에 옮긴다. 화면은 준비될 때까지 그대로 둔다.
  const pending = usePendingPathname();
  const movingTo = pending?.startsWith(`${base}/`) ? pending.slice(base.length + 1) : undefined;
  const library = useQuery(libraryOptions(projectKey));
  const project = useQuery(projectOptions(projectKey));
  const data = library.data;
  const canManage = !!data?.canManage && !project.data?.archivedAt;
  const canCreate = !!project.data?.can.edit;
  const [dialog, setDialog] = useState<Dialog>(null);
  const [contents, setContents] = useState(false);
  // 페이지 사이드바를 접어 두었는지(이 브라우저에 기억). 본문 폭을 넓힐 때 접는다.
  const isPhone = useIsMobile();
  const [failure, setFailure] = useState<string>();
  const view = data?.views.find(each => each.id === search.view);
  const q = typeof search.q === 'string' ? search.q : '';
  const routeLabels = typeof search.label === 'string' ? (search.label === '-' ? [] : search.label.split(',').filter(Boolean)) : view?.labels ?? [];
  const routeLabelKey = routeLabels.join(',');
  const [pendingLabels, setPendingLabels] = useState<{ view: string; ids: string[] } | null>(null);
  const viewKey = view?.id ?? 'all';
  const chosen = pendingLabels?.view === viewKey ? pendingLabels.ids : routeLabels;
  useEffect(() => { if (pendingLabels?.view === viewKey && pendingLabels.ids.join(',') === routeLabelKey) setPendingLabels(null); }, [routeLabelKey, viewKey, pendingLabels]);
  useEffect(() => { const reset = () => setPendingLabels(null); window.addEventListener('popstate', reset); return () => window.removeEventListener('popstate', reset); }, []);
  const initial: Display = {
    layout: view?.layout === 'LIST' ? 'LIST' : 'GRID',
    sort: isSort(view?.sort.toLowerCase()) ? view!.sort.toLowerCase() as Sort : 'custom',
    direction: view?.direction === 'DESC' ? 'desc' : 'asc',
  };
  const display: Display = {
    layout: search.layout === 'LIST' || search.layout === 'GRID' ? search.layout : initial.layout,
    sort: isSort(search.sort) ? search.sort : initial.sort,
    direction: search.direction === 'desc' ? 'desc' : search.direction === 'asc' ? 'asc' : initial.direction,
  };
  const layout = display.layout;
  const isTweaked = display.layout !== initial.layout || display.sort !== initial.sort || display.direction !== initial.direction;
  const [asc, desc] = DIRECTIONS[SORTS.find(sort => sort.value === display.sort)?.kind ?? 'rank'];
  const matched = useInfiniteQuery({ ...documentsOptions({ project: projectKey, q: q || undefined }), enabled: !!q });
  const { hasNextPage, isFetching, isError, fetchNextPage } = matched;
  useEffect(() => { if (q && hasNextPage && !isFetching && !isError) void fetchNextPage(); }, [q, hasNextPage, isFetching, isError, fetchNextPage]);
  // Old chapter links now open the same page in its owning tree.
  useEffect(() => { if (typeof search.chapter === 'string') void navigate({ href: `${base}/${search.chapter}`, replace: true }); }, [search.chapter, base, navigate]);
  const matchedIds = new Set(matched.data?.pages.flatMap(page => page.items.map(item => item.id)) ?? []);
  const filterDefs: FilterDef<'label'>[] = [{
    key: 'label', label: '문서 라벨', icon: TagIcon, isSearchable: true,
    options: (data?.labels ?? []).map(label => ({ value: label.id, label: label.name, icon: <LabelDot color={label.color} /> })),
  }];
  const filters = useFilters(filterDefs, {
    state: { label: chosen },
    onStateChange: next => {
      setPendingLabels({ view: viewKey, ids: next.label ?? [] });
      write({ label: next.label?.length ? next.label.join(',') : view?.labels.length ? '-' : undefined });
    },
  });
  const pages = data?.pages ?? [];
  const byId = new Map(pages.map(page => [page.id, page]));
  const orderedIds = [...(data?.order.ids ?? []).filter(id => byId.has(id)), ...pages.map(page => page.id).filter(id => !data?.order.ids.includes(id))];
  const ordered = orderedIds.map(id => byId.get(id)!);
  const roots = ordered.filter(page => !page.parentId);
  const document = documentId ? byId.get(documentId) : undefined;
  let root = document;
  const ancestors: DocumentRow[] = [];
  const seen = new Set<string>();
  while (root?.parentId && !seen.has(root.id)) { seen.add(root.id); const parent = byId.get(root.parentId); if (!parent) break; ancestors.unshift(parent); root = parent; }
  const hasTree = !!root && pages.some(page => page.parentId === root.id);
  const refresh = async () => { await client.invalidateQueries({ queryKey: ['documents'] }); };
  const done = async () => { await refresh(); setDialog(null); };
  const go = (id?: string, params?: Record<string, string>) => {
    setContents(false); setPendingLabels(null);
    const href = `${base}${id ? `/${id}` : ''}${params ? `?${new URLSearchParams(params)}` : ''}`;
    if (id) open(href, { surface: documentId ? 'inherit' : 'dialog' });
    else if (surface.onClose) surface.onClose();
    else void navigate({ href });
  };
  const error = (reason: unknown) => setFailure(reason instanceof Error ? reason.message : '순서를 저장하지 못했습니다.');
  const saveOrder = async (ids: string[], parentId: string | null) => {
    const current = await client.query({ ...libraryOptions(projectKey), staleTime: 0 });
    await saveDocumentOrder(projectKey, ids, current.order.version, parentId);
    await refresh();
  };
  const matches = roots.filter(page => (chosen.length === 0 || chosen.some(label => data?.assignments[page.id]?.includes(label))) && (!q || matchedIds.has(page.id)));
  const rootReorder = useRowReorder(matches.map(page => ({ id: page.id, name: page.title })), { word: '문서', object: '문서를', topic: '문서는' }, rows.ghost,
    ids => { const moved = new Set(ids); let at = 0; return saveOrder(roots.map(page => moved.has(page.id) ? ids[at++]! : page.id), null); }, error);
  const canReorder = canManage && display.sort === 'custom' && display.direction === 'asc' && (!q || !matched.isFetching);
  const visible = rootReorder.order.map(id => byId.get(id)!);
  if (display.sort !== 'custom') visible.sort((a, b) => {
    const comparison = display.sort === 'title' ? a.title.localeCompare(b.title, 'ko') : display.sort === 'created' ? a.createdAt.localeCompare(b.createdAt) : a.updatedAt.localeCompare(b.updatedAt);
    return comparison * (display.direction === 'asc' ? 1 : -1);
  });
  else if (display.direction === 'desc') visible.reverse();
  const labelsOf = (page: DocumentRow) => (data?.assignments[page.id] ?? []).flatMap(id => data?.labels.find(each => each.id === id) ?? []);
  const labelBadges = (page: DocumentRow, className?: string) => {
    const labels = labelsOf(page);
    return labels.length ? <span className={cn('flex flex-wrap items-center gap-1', className)}>
      {labels.map(label => <Badge key={label.id} variant="label"><LabelDot color={label.color} />{label.name}</Badge>)}
    </span> : null;
  };
  const grip = (page: DocumentRow) => canReorder ? <button type="button" className={rows.grip} {...rootReorder.gripProps({ id: page.id, name: page.title })}><GripIcon /></button> : null;
  const openLink = (id: string) => (event: MouseEvent) => { if (event.ctrlKey || event.metaKey || event.shiftKey) return; event.preventDefault(); go(id); };
  // 휴대폰의 목차 시트: 같은 트리를 손잡이 없이 읽기만 한다. 순서·생성·삭제는 데스크톱의 페이지 관리에서 한다.
  const tree = root ? <div className="flex flex-col gap-0.5">
    <a className={TREE_LINK} href={`${base}/${root.id}`} aria-current={root.id === documentId ? 'page' : undefined} onClick={openLink(root.id)}>{root.title}</a>
    <DocumentPages pages={ordered} parentId={root.id} currentId={documentId ?? ''} base={base} canManage={false} onOpen={id => go(id)} onOrder={saveOrder} onError={error} />
  </div> : null;
  const managePages = root && canManage ? () => open(`${base}/${root!.id}/pages`, { surface: 'dialog' }) : undefined;
  const readingOrder: string[] = [];
  // 구역 페이지(본문 없이 하위만 묶음)는 읽을 차례에 넣지 않아 이전·다음이 빈 화면으로 가지 않는다.
  const collect = (id: string) => { if (!isSectionPage(byId.get(id)!, pages)) readingOrder.push(id); ordered.filter(page => page.parentId === id).forEach(page => collect(page.id)); };
  if (root) collect(root.id);
  const readingAt = documentId ? readingOrder.indexOf(documentId) : -1;
  // 뷰 메뉴는 업무와 같다(ViewBar): 현재 조건을 새 뷰로 저장 · 고른 뷰 편집 · 순서 편집 · 고른 뷰 삭제.
  const viewPills = (data?.views ?? []).map(each => ({ id: each.id, label: each.name, icon: each.icon ?? 'filter', color: each.color }));
  const viewActions = canManage ? {
    onSaveNew: () => setDialog('new-view'),
    onEdit: view ? () => setDialog('view') : undefined,
    order: { views: viewPills, onSave: async (ids: string[]) => { await orderDocumentViews(projectKey, ids); await refresh(); } },
    onDelete: view ? async () => { await deleteDocumentView(projectKey, view.id, view.version); await refresh(); go(); } : undefined,
    deleteNote: '문서는 삭제하지 않습니다.',
  } : {};
  const isFiltered = !!q || chosen.length > 0;
  const listBody = library.isError ? isNotFound(library.error) ? <PageState kind="not-found" title="프로젝트를 찾을 수 없습니다" /> : <PageState kind="error" title="문서를 불러오지 못했습니다" description={library.error.message} />
    : library.isPending ? <p className="p-4 text-muted-foreground">문서를 불러오는 중입니다</p>
      : visible.length === 0 ? <PageState kind={isFiltered ? 'search' : 'empty'} title={isFiltered ? '조건에 맞는 문서가 없습니다' : '문서가 없습니다'} />
        : <div ref={rootReorder.list} className={rows.list}>
          {layout === 'LIST'
            ? <ul aria-label="문서" className="flex flex-col">{visible.map(page => <li key={page.id} {...rootReorder.rowProps(page.id)}
              className={cn(rows.row, 'flex min-h-14 items-center gap-3 border-b bg-background px-4 py-2.5 hover:bg-row-hover max-md:items-start max-md:py-3')}>
              {grip(page) ? <span className="relative z-1 flex">{grip(page)}</span> : null}
              <MarkIcon name={page.icon ?? 'document'} className="size-4 shrink-0 text-icon-muted max-md:mt-0.5 max-md:size-5" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <a href={`${base}/${page.id}`} onClick={openLink(page.id)}
                  className="truncate font-medium outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring">{page.title}</a>
                <p className="truncate text-sm text-muted-foreground">{page.excerpt || '내용 없음'}</p>
                {labelBadges(page, 'pt-1 md:hidden')}
              </div>
              {labelBadges(page, 'shrink-0 justify-end max-md:hidden')}
            </li>)}</ul>
            : <div className="mx-auto grid w-full max-w-288 grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-3 p-4">
              {visible.map(page => <DocumentCard key={page.id} document={page} labels={(data?.labels ?? []).filter(label => data?.assignments[page.id]?.includes(label.id))}
                href={`${base}/${page.id}`} onOpen={() => go(page.id)}
                rowProps={{ ...rootReorder.rowProps(page.id), ...(canReorder ? rootReorder.surfaceProps(page.id) : {}) }} grip={grip(page)} />)}
            </div>}
        </div>;
  return <>
    {documentId ? <DocumentSurface {...surface} title={document?.title ?? '문서'}>
      <div className="flex min-h-0 min-w-0 flex-1">
        {/* 목차는 늘 펼쳐 둔다(접기는 뺐다, 2026-11-15). */}
        {hasTree && !isPhone
          ? <DocumentSideNav root={root!} pages={ordered} currentId={movingTo ?? documentId} base={base} onOpen={id => go(id)} onManage={managePages} />
          : null}
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          {failure ? <p role="alert" className="px-4 py-2 text-sm text-destructive">{failure}</p> : null}
          <DocumentReader key={documentId} id={documentId} created={document ? { createdAt: document.createdAt, createdByName: document.createdByName } : undefined}
            projectKey={project.data?.key ?? projectKey} onDeleted={surface.onClose}
            crumbs={[...crumbs.slice(0, -1), { label: '문서', href: base }, ...ancestors.map(page => ({ label: page.title, href: `${base}/${page.id}` }))]}
            onLabels={() => setDialog('labels')} onMove={canManage ? () => setDialog('move') : undefined} onManagePages={managePages}
            onContents={hasTree ? () => setContents(true) : undefined}
            readingNavigation={hasTree ? <nav aria-label="페이지 이동" className="flex items-center justify-between gap-2 border-t pt-5">
              <Button variant="secondary" disabled={readingAt <= 0} onClick={() => go(readingOrder[readingAt - 1])}>이전 페이지</Button>
              <Button variant="secondary" disabled={readingAt < 0 || readingAt >= readingOrder.length - 1} onClick={() => go(readingOrder[readingAt + 1])}>다음 페이지</Button>
            </nav> : undefined} />
        </div>
      </div>
    </DocumentSurface>
      : <Page crumbs={pageCrumbs(crumbs)}
        views={<ViewBar views={[{ id: 'all', label: '전체 문서', icon: 'document' }, ...viewPills]} value={view?.id ?? 'all'}
          onChange={id => go(undefined, id === 'all' ? undefined : { view: id })} actions={viewActions} />}
        tools={<>
          <SearchTool label="문서 검색" placeholder="제목 · 내용으로 찾기" value={words} onChange={setWords} />
          <FilterMenu filters={filters} />
          <DisplayMenu isTweaked={isTweaked} onReset={() => write({ layout: undefined, sort: undefined, direction: undefined })}>
            <DisplayChoice title="보기" items={LAYOUTS} value={display.layout} onChange={next => write({ layout: next })} />
            <DisplayChoice title="정렬 기준" items={SORTS} value={display.sort} onChange={next => write({ sort: next, direction: display.direction })} />
            <DisplayChoice title="방향" items={[{ value: 'asc', label: asc }, { value: 'desc', label: desc }] as const} value={display.direction}
              onChange={next => write({ sort: display.sort, direction: next })} />
          </DisplayMenu>
        </>}
        below={isPhone ? <FilterChips filters={filters} /> : <FilterBar filters={filters} />}
        create={canCreate ? { label: '새 문서', onClick: () => setDialog('new') } : undefined}>
        {failure ? <p role="alert" className="px-4 pt-3 text-sm text-destructive">{failure}</p> : null}
        <p id={rootReorder.hint} className={rows.spoken}>손잡이를 끌거나 Alt와 위아래 화살표로 순서를 바꿉니다.</p>
        <p role="status" aria-live="polite" className={rows.spoken}>{rootReorder.said}</p>
        {listBody}
      </Page>}
    {isPhone
      ? <Drawer open={contents} onOpenChange={setContents}>
        <DrawerContent>
          <DrawerHeader><DrawerTitle>페이지 목차</DrawerTitle></DrawerHeader>
          <div className="flex max-h-[70dvh] flex-col gap-3 overflow-y-auto px-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            {tree}
            <Button className="h-11" onClick={() => setContents(false)}>완료</Button>
          </div>
        </DrawerContent>
      </Drawer>
      : <Dialog open={contents} onOpenChange={setContents}>
        <DialogContent className="overflow-y-auto">
          <DialogHeader><DialogTitle>페이지 목차</DialogTitle></DialogHeader>
          {tree}
        </DialogContent>
      </Dialog>}
    {dialog === 'new' && data ? <NewDocumentDialog projectKey={projectKey} labels={data.labels} canManageLabels={!!data.canManage} onClose={() => setDialog(null)} onDone={id => { void done(); go(id); }} /> : null}
    {(dialog === 'view' || dialog === 'new-view') && data ? <ViewDialog projectKey={projectKey} labels={data.labels}
      initial={dialog === 'view' && view
        ? { ...view, icon: view.icon ?? 'filter', color: view.color ?? null, labels: chosen, layout, sort: display.sort.toUpperCase() as LibrarySort, direction: display.direction.toUpperCase() as 'ASC' | 'DESC' }
        : { name: '', icon: 'filter', color: null, labels: chosen, layout, sort: display.sort.toUpperCase() as LibrarySort, direction: display.direction.toUpperCase() as 'ASC' | 'DESC' }}
      onClose={() => setDialog(null)} onDone={id => { void done(); go(undefined, id ? { view: id } : undefined); }} /> : null}
    {dialog === 'labels' && data && document && !document.parentId ? <LabelsDialog projectKey={projectKey} document={document} labels={data.labels} canManageLabels={!!data.canManage}
      initial={data.assignments[document.id] ?? []} onDone={() => void done()} onClose={() => setDialog(null)} /> : null}
    {dialog === 'move' && document ? <MovePageDialog projectKey={projectKey} document={document} pages={pages} onDone={() => void done()} onClose={() => setDialog(null)} /> : null}
  </>;
}

/** 목록이 연 문서는 데스크톱에서 목록 위 대화상자(머리에 이름 · 크게 보기 · 닫기)에 놓이고, 자기 주소로 열면 페이지 그대로다. */
function DocumentSurface({ surface, onClose, onExpand, title, children }: DetailSurfaceOptions & { title: string; children: ReactNode }) {
  const isPhone = useIsMobile();
  if (surface !== 'dialog' || isPhone) return children;
  return <Dialog open onOpenChange={isOpen => { if (!isOpen) onClose?.(); }}>
    <DialogContent showCloseButton={false}
      className="flex h-[min(74dvh,58rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(76rem,calc(100vw-3rem))]">
      {/* 문서 보기는 페이지 폭이 필요해 대화상자 기본 폭(45rem)보다 넓다. 머리는 같은 모양(구분선 없음). */}
      <div className="shrink-0 px-6 pt-5"><DialogBar title={title} onExpand={onExpand} /></div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </DialogContent>
  </Dialog>;
}
