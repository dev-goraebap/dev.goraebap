import { usePageLocation } from '@/shared/lib/route-location';
import { useNavigate } from '@tanstack/react-router';
import { queryFromRoute, viewRoute } from './view-route';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  changeWorkItemViews, workItemsOptions, workItemViewsOptions, markColorOf, MY_WORK_VIEW, viewKeys, viewsInOrder,
  type WorkItemListView, type WorkItemViewChange, type WorkItemViewInput,
} from '@/entities/work-item';
import type { ViewDraft, ViewLayout, ViewPill } from '@/shared/ui/views';
import { isChangedFrom, listingOf, queryOf, viewFiltersOf } from './filters';
import { serverLayoutOf, useViewLayouts } from './layouts';
import { useWorkItemFilters, type WorkItemQuery } from './use-work-item-filters';


/**
 * A work item list under its saved views, as client/'s saved-views hook (but what is changed over a view stays on the page, not
 * in the address): the scope's views (the workspace's, no key, or a project's) in the pills' order, the one in view, its
 * filters and display with what was changed over them, and the work items they read a slice at a time (a project board's
 * slice holds every card). The bar's commands go to the server: a view made from what the list shows, changed, moved,
 * copied or deleted. Shared views and their order are Workspace administrators'; anyone keeps their own (나만 보기).
 */
export function useWorkItemViews(scopeKey: string | undefined) {
  const isProject = !!scopeKey;
  const client = useQueryClient();
  const list = useQuery(workItemViewsOptions(scopeKey));
  const views = useMemo(() => viewsInOrder(list.data, isProject), [list.data, isProject]);
  const location = usePageLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.searchStr);
  const currentId = params.get('view');
  const setCurrentId = (id: string, query?: WorkItemQuery, replace = false) => {
    void navigate({ href: `${location.pathname}?${viewRoute(location.searchStr, id, query)}`, replace });
  };
  const view = views.find(each => each.id === currentId) ?? views[0]!;
  const layouts = useViewLayouts();
  const layout = layouts.layoutOf(view);
  const query = queryFromRoute(params, queryOf(view));
  const filters = useWorkItemFilters(query, next => setCurrentId(view.id, next, true));
  const isBoard = layout === 'kanban';
  const isGroupPaged = isBoard || (layout === 'list' && query.display.group !== 'NONE');
  const listing = listingOf(query, isProject, isBoard);
  const workItems = useInfiniteQuery({
    ...workItemsOptions(scopeKey, listing),
    enabled: !list.isPending && !isGroupPaged,
  });
  const canOrder = !!list.data?.canOrder;
  const [problem, setProblem] = useState<string>();
  const change = useMutation({
    mutationFn: (each: WorkItemViewChange) => changeWorkItemViews(scopeKey, each),
    onMutate: () => setProblem(undefined),
    onError: error => setProblem(error.message),
    onSettled: () => client.invalidateQueries({ queryKey: viewKeys.scope(scopeKey) }),
  });
  const pick = (target: WorkItemListView) => { filters.setShown([]); setCurrentId(target.id); };
  const byId = (id: string) => views.find(each => each.id === id);
  const inputOf = (draft: ViewDraft, from: WorkItemListView): { input: WorkItemViewInput; kept?: ViewLayout } => {
    const placed = serverLayoutOf(draft.layout);
    return {
      input: {
        name: draft.label, icon: draft.icon, color: draft.color || markColorOf(from, views), layout: placed.layout, filters: viewFiltersOf(query, isProject),
        sort: filters.display.sort as WorkItemViewInput['sort'], direction: filters.display.direction === 'asc' ? 'ASC' : 'DESC',
        grouping: filters.display.group as WorkItemViewInput['grouping'], isPersonal: !!draft.isPrivate || !canOrder,
      },
      kept: placed.kept,
    };
  };
  const pill = (each: WorkItemListView): ViewPill => ({ id: each.id, label: each.name, icon: each.icon || 'layout-list', color: each.color || undefined });
  const canChange = !view.isBuiltIn && view.canEdit;
  // 순서는 모두의 뷰(전체 포함)만 정한다. 나만 보기 뷰는 그 뒤에 만든 차례로 선다.
  const orderable = views.filter(each => !each.isPersonal && each.id !== MY_WORK_VIEW);
  const bar = {
    views: views.map(pill),
    value: view.id,
    onChange: (id: string) => { const target = byId(id); if (target) pick(target); },
    /** What the new-view dialog starts from: the list as it is shown now. */
    newDraft: (): ViewDraft => ({ label: '', icon: 'layout-list', layout, isPrivate: !canOrder }),
    /** What the edit dialog starts from, when the view in view may be changed. */
    editDraft: canChange ? { label: view.name, icon: view.icon || 'layout-list', color: view.color || undefined, layout, isPrivate: view.isPersonal } as ViewDraft : undefined,
    onCreate: (draft: ViewDraft) => {
      const { input, kept } = inputOf(draft, view);
      change.mutate({ kind: 'create', input }, { onSuccess: made => { if (made) { layouts.keep(made, kept); setCurrentId(made); } } });
    },
    onUpdate: (draft: ViewDraft) => {
      if (!canChange) return;
      const { input, kept } = inputOf(draft, view);
      change.mutate({ kind: 'edit', view, input }, { onSuccess: () => layouts.keep(view.id, kept) });
    },
    order: canOrder ? { views: orderable.map(pill), onSave: async (ids: string[]) => { await change.mutateAsync({ kind: 'order', keys: ids }); } } : undefined,
    onDelete: canChange ? async () => { await change.mutateAsync({ kind: 'delete', view }); layouts.keep(view.id, undefined); pick(views[0]!); } : undefined,
  };
  const isChanged = isChangedFrom(view, query, isProject);
  return {
    board: { projectKey: scopeKey, listing },
    list, view, views, layout, isGroupPaged,
    /** Lays the list out another way here (the 표시 menu); kept in this browser until the view is saved. */
    setLayout: (next: ViewLayout) => layouts.keep(view.id, next), filters, query, workItems, bar, problem, isChanged,
    /** Whether what is changed can be kept as the view's own: the member may change the view. */
    canSave: isChanged && !view.isBuiltIn && view.canEdit,
    isSaving: change.isPending,
    dismiss: () => setProblem(undefined),
    /** Back to the view as it is kept. */
    revert: () => { filters.setShown([]); setCurrentId(view.id, undefined, true); },
    /** What the list shows now, kept as the view's own. */
    save: () => change.mutate({ kind: 'edit', view,
      input: inputOf({ label: view.name, icon: view.icon || 'layout-list', layout, isPrivate: view.isPersonal }, view).input }),
  };
}
export type WorkItemViewsState = ReturnType<typeof useWorkItemViews>;
