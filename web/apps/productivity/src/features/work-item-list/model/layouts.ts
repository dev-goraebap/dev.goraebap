import { useState } from 'react';
import type { WorkItemListView } from '@/entities/work-item';
import type { ViewLayout } from '@/shared/ui/views';

/*
 * 서버는 전역·프로젝트의 목록과 칸반을 저장한다. 표 보기와 예전 브라우저별 보기 선택은 로컬에 유지한다.
 */
const KEY = 'cowork-issue-view-layouts';

function read(): Record<string, ViewLayout> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, ViewLayout>; } catch { return {}; }
}

/** How the server keeps a layout, as the screens name it. */
const ownLayout = (view: WorkItemListView): ViewLayout => (view.layout === 'BOARD' ? 'kanban' : view.layout === 'TIMELINE' ? 'timeline' : 'list');

export const storedLayoutOf = (view: WorkItemListView): ViewLayout => read()[view.id] ?? ownLayout(view);

/** How a view lays work items out here: the table or board this browser keeps for it, else the view's own. */
export function useViewLayouts() {
  const [kept, setKept] = useState(read);
  const keep = (id: string, layout: ViewLayout | undefined) => setKept(current => {
    const next = { ...current };
    if (layout) next[id] = layout; else delete next[id];
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* the choice lasts this visit */ }
    return next;
  });
  return {
    layoutOf: (view: WorkItemListView): ViewLayout => kept[view.id] ?? ownLayout(view),
    keep,
  };
}

/** A layout as the server keeps it, and what this browser keeps beside it when the server cannot. */
export function serverLayoutOf(layout: ViewLayout): { layout: WorkItemListView['layout']; kept?: ViewLayout } {
  if (layout === 'kanban') return { layout: 'BOARD' };
  if (layout === 'timeline') return { layout: 'TIMELINE' };
  if (layout === 'table') return { layout: 'LIST', kept: 'table' };
  return { layout: 'LIST' };
}
