import {
  boardGroupsOptions, columnsOptions, typesOptions, viewsInOrder, workingPeopleOptions, workItemsOptions, workItemViewsOptions,
  type WorkItemViewGrouping,
} from '@/entities/work-item';
import { projectOptions } from '@/entities/project';
import { MOBILE_QUERY } from '@/shared/config';
import type { Prep } from '@/shared/lib/prepare';
import {
  groupingOf, isNarrowed, kanbanGroupsInOrder, listGroupPageOptions, listGroupsInOrder, listingForGroup, listingOf, queryFromRoute, queryOf,
  storedLayoutOf,
} from '@/features/work-item-list';

/**
 * 프로젝트 업무 목록의 첫 화면: 고른 보기(?view, 없으면 첫 보기)의 배치대로, 첫 화면에 보일 만큼만 읽는다.
 * 칸반은 화면 폭에 걸치는 칼럼까지, 묶은 목록은 화면 높이에 걸치는 묶음까지다.
 */
export async function prepareWorkItemList({ client, ensure, prime, primeInfinite }: Prep, key: string, searchStr: string) {
  const params = new URLSearchParams(searchStr);
  // 보기와 상관없는 것은 보기를 읽는 동안 함께 읽는다.
  const metadata = Promise.all([prime(columnsOptions(key)), prime(typesOptions()), prime(workingPeopleOptions()), prime(projectOptions(key))]);
  const views = viewsInOrder(await ensure(workItemViewsOptions(key)), true);
  const view = views.find(v => v.id === params.get('view')) ?? views[0]!;
  const query = queryFromRoute(params, queryOf(view));
  const layout = storedLayoutOf(view);
  const listing = listingOf(query, true, layout === 'kanban');
  await metadata;
  const columns = () => client.getQueryData(columnsOptions(key).queryKey) ?? [];
  const types = () => client.getQueryData(typesOptions().queryKey) ?? [];
  if (layout === 'kanban') {
    const grouping = query.display.group as WorkItemViewGrouping;
    const groups = await ensure(boardGroupsOptions(key, listing, grouping));
    const ordered = kanbanGroupsInOrder(groups, grouping, columns(), types(), false, isNarrowed(query), !!query.state.status?.includes('BACKLOG'));
    // 브라우저 폭을 상한으로 잡아 오른쪽에 일부만 보이는 칼럼도 준비한다.
    const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const visible = window.matchMedia(MOBILE_QUERY).matches ? 2 : Math.ceil(window.innerWidth / (18 * rem));
    await Promise.all(ordered.slice(0, visible).filter(group => group.total > 0)
      .map(group => primeInfinite(workItemsOptions(key, listingForGroup(listing, grouping, group), 30))));
  } else if (layout === 'list' && groupingOf(query.display) !== 'NONE') {
    const grouping = groupingOf(query.display);
    const groups = await ensure(boardGroupsOptions(key, listing, grouping));
    const ordered = listGroupsInOrder(groups, grouping, columns(), types(), false);
    // 머리와 행을 각각 24px로 낮게 잡아 첫 화면에 걸칠 그룹까지 포함한다.
    let remaining = window.innerHeight;
    const visible = ordered.filter(group => {
      if (remaining <= 0) return false;
      remaining -= 24 * (1 + Math.min(30, group.total));
      return true;
    });
    await Promise.all(visible.map(group => primeInfinite(listGroupPageOptions(key, listing, grouping, group))));
  } else await Promise.all([primeInfinite(workItemsOptions(key, listing)), prime(boardGroupsOptions(key, listing, 'NONE'))]);
}
