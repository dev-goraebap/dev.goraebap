import type { Display, DisplayChoice, SortKey } from '@kit/composites/filter/DisplayMenu';
import type { ListFilter } from '@kit/composites/filter/types';
import { authors, collections, kinds, type Resource } from '../../entities/resource';

/** 목록 주소의 검증. 표시 외의 조건(검색·필터·컬렉션)은 여기서, 표시는 useAddressDisplay가 읽는다. */
export type LibrarySearch = { q?: string; collection?: string; starred?: boolean; panel?: string };
export function validateLibrarySearch(raw: Record<string, unknown>): Record<string, unknown> & LibrarySearch {
  return {
    ...raw,
    q: typeof raw.q === 'string' && raw.q ? raw.q : undefined,
    collection: collections.some(item => item.id === raw.collection) ? String(raw.collection) : undefined,
    starred: raw.starred === true || raw.starred === 'true' || undefined,
    panel: typeof raw.panel === 'string' && /^\/resources\/(new|[a-zA-Z0-9-]+(\/edit)?)$/.test(raw.panel) ? raw.panel : undefined,
  };
}

export const filters: ListFilter[] = [
  { key: 'kind', label: '종류', icon: 'document', isMultiple: true, options: kinds.map(kind => ({ value: kind.id, label: kind.label })) },
  { key: 'author', label: '작성자', icon: 'user', isMultiple: true, options: authors.map(name => ({ value: name, label: name })) },
];

export const layouts: DisplayChoice[] = [
  { id: 'list', label: '리스트', icon: 'layout-list' },
  { id: 'grid', label: '그리드', icon: 'layout-grid' },
  { id: 'table', label: '표', icon: 'layout-table' },
];
export const sorts: SortKey[] = [{ id: 'updated', label: '수정일', kind: 'date' }, { id: 'title', label: '제목', kind: 'text' }];
export const groups: DisplayChoice[] = [{ id: 'none', label: '없음' }, { id: 'kind', label: '종류' }, { id: 'collection', label: '컬렉션' }];
export const initialDisplay: Display = { layout: 'list', sort: 'updated', direction: 'desc', group: 'none' };

/** 화면 상태가 아닌 조회 결과에 조건을 적용한다. 큰 목록은 서버가 거른다. */
export function visibleResources(items: Resource[], { q, collection, starred }: LibrarySearch, state: Record<string, string[]>, display: Display) {
  const needle = q?.trim().toLowerCase();
  const kept = items.filter(item => (!collection || item.collection === collection) && (!starred || item.starred)
    && (!needle || `${item.title} ${item.summary}`.toLowerCase().includes(needle))
    && (!state.kind?.length || state.kind.includes(item.kind)) && (!state.author?.length || state.author.includes(item.author)));
  const sorted = [...kept].sort((a, b) => display.sort === 'title' ? a.title.localeCompare(b.title, 'ko') : a.updatedAt.localeCompare(b.updatedAt));
  return display.direction === 'desc' ? sorted.reverse() : sorted;
}
