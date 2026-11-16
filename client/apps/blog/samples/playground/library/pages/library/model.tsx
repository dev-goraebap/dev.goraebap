import type { FilterDef } from '@/shared/ui/filter';
import { FileTextIcon, UserIcon } from '@/shared/ui/icon';
import { PersonAvatar } from '@/shared/ui/person-avatar';
import { authors, collections, kinds, type Resource } from '../../entities/resource';

/** 목록 주소의 검증. 표시 외의 조건(검색 · 필터 · 컬렉션)은 여기서, 필터 · 표시 값은 키트의 useAddressFilters · useAddressChoices가 읽는다. */
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

export type FilterKey = 'kind' | 'author';
export const filterKeys: FilterKey[] = ['kind', 'author'];
export const filters: FilterDef<FilterKey>[] = [
  { key: 'kind', label: '종류', icon: FileTextIcon, options: kinds.map(kind => ({ value: kind.id, label: kind.label, icon: <kind.icon className="text-icon-muted" /> })) },
  { key: 'author', label: '작성자', icon: UserIcon, options: authors.map(name => ({ value: name, label: name, icon: <PersonAvatar name={name} /> })) },
];

/** 표시(하나씩 고르는 묶음). 주소에는 처음과 다른 값만 남는다(?layout=grid&sort=title). */
export type Display = { layout: 'list' | 'grid' | 'table'; sort: 'updated' | 'title'; direction: 'desc' | 'asc'; group: 'none' | 'kind' | 'collection' };
export const initialDisplay: Display = { layout: 'list', sort: 'updated', direction: 'desc', group: 'none' };
export const layouts: { value: Display['layout']; label: string }[] = [{ value: 'list', label: '리스트' }, { value: 'grid', label: '그리드' }, { value: 'table', label: '표' }];
export const sorts: { value: Display['sort']; label: string }[] = [{ value: 'updated', label: '수정일' }, { value: 'title', label: '제목' }];
export const directions: { value: Display['direction']; label: string }[] = [{ value: 'desc', label: '내림차순' }, { value: 'asc', label: '오름차순' }];
export const groups: { value: Display['group']; label: string }[] = [{ value: 'none', label: '없음' }, { value: 'kind', label: '종류' }, { value: 'collection', label: '컬렉션' }];
export const allowedDisplay = {
  layout: layouts.map(each => each.value), sort: sorts.map(each => each.value), direction: directions.map(each => each.value), group: groups.map(each => each.value),
};

/** 화면 상태가 아닌 조회 결과에 조건을 적용한다. 큰 목록은 서버가 거른다. */
export function visibleResources(items: Resource[], { q, collection, starred }: LibrarySearch, state: Partial<Record<FilterKey, string[]>>, display: Display) {
  const needle = q?.trim().toLowerCase();
  const kept = items.filter(item => (!collection || item.collection === collection) && (!starred || item.starred)
    && (!needle || `${item.title} ${item.summary}`.toLowerCase().includes(needle))
    && (!state.kind?.length || state.kind.includes(item.kind)) && (!state.author?.length || state.author.includes(item.author)));
  const sorted = [...kept].sort((a, b) => display.sort === 'title' ? a.title.localeCompare(b.title, 'ko') : a.updatedAt.localeCompare(b.updatedAt));
  return display.direction === 'desc' ? sorted.reverse() : sorted;
}
