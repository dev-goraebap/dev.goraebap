import type { WorkItemQuery } from './use-work-item-filters';

const keys = ['project', 'status', 'assignee', 'label', 'type', 'priority', 'cycle'];
const sorts = ['BOARD', 'UPDATED', 'CREATED'];
const groups = ['STATUS', 'ASSIGNEE', 'PRIORITY', 'TYPE', 'PROJECT', 'NONE'];

/** custom이 있으면 빈 필터도 명시적 변경이다. 없으면 저장 뷰의 현재 조건을 따른다. */
export function queryFromRoute(params: URLSearchParams, base: WorkItemQuery): WorkItemQuery {
  if (params.get('custom') !== '1') return base;
  const state = Object.fromEntries(keys.flatMap(key => {
    const value = params.get(`filter.${key}`);
    return value && value.length <= 1000 && /^[A-Za-z0-9_-]+(,[A-Za-z0-9_-]+)*$/.test(value) ? [[key, value.split(',')]] : [];
  }));
  const sort = params.get('sort') ?? '';
  const group = params.get('group') ?? '';
  const direction = params.get('direction');
  return { state, display: { sort: sorts.includes(sort) ? sort : base.display.sort,
    group: groups.includes(group) ? group : base.display.group, direction: direction === 'asc' || direction === 'desc' ? direction : base.display.direction } };
}

export function viewRoute(search: string, view: string, query?: WorkItemQuery) {
  const params = new URLSearchParams(search);
  for (const key of ['view', 'custom', 'sort', 'direction', 'group', ...keys.map(key => `filter.${key}`)]) params.delete(key);
  params.set('view', view);
  if (query) {
    params.set('custom', '1');
    for (const key of keys) if (query.state[key]?.length) params.set(`filter.${key}`, query.state[key].join(','));
    params.set('sort', query.display.sort);
    params.set('direction', query.display.direction);
    params.set('group', query.display.group);
  }
  return params.toString();
}
