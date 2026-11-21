import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useMemo, useRef } from 'react';
import {
  notificationsOptions, unreadNotificationsOptions, useReadAllNotifications,
  type NotificationItem, type NotificationListing,
} from '@/entities/notification';
import { activitySplit } from '@/features/activity-navigation';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { Button } from '@/shared/ui/kit/button';
import { DetailSurface } from '@/shared/ui/kit/detail-surface';
import type { FilterDef } from '@/shared/ui/kit/filter';
import { BellIcon, CircleCheckIcon } from '@/shared/ui/kit/icon';
import { OpenPageButton, SplitColumn, SplitList, SplitView, type SplitState } from '@/shared/ui/kit/layout/split-view';
import { ListMore } from '@/shared/ui/kit/list-more';
import { PageState } from '@/shared/ui/kit/page-state';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import { useFilters } from '../model/use-filters';
import { inboxFrame, NoticeDetail } from './NoticeDetail';
import { NotificationRow } from './NotificationRow';
import { NotificationsMenu } from './NotificationsMenu';

/** A step of the page's path as the router hands it (its icon a meaning name). */
type Crumb = { label: string; href?: string; icon?: string };

const FILTERS: FilterDef<'read'>[] = [
  { key: 'read', label: '읽음', icon: BellIcon, options: [{ value: 'unread', label: '안 읽음', icon: <BellIcon /> }, { value: 'read', label: '읽음', icon: <CircleCheckIcon /> }] },
];

/** The crumbs handed to the page, the last made a link back to the list, then the notice. */
const crumbsUnder = (crumbs: Crumb[], listHref: string, label: string): Crumb[] =>
  [...crumbs.map((crumb, index) => (index === crumbs.length - 1 ? { ...crumb, href: listHref } : crumb)), { label }];

/**
 * 알림함 (/inbox, /inbox/{id}): the member's notices, newest first, narrowed by read state, read a slice at a time, as an inbox (shared/ui/inbox): the list on the left, the chosen notice (id)
 * on the right showing what it points to in place (NoticeDetail). A phone shows the list alone and the chosen notice
 * as a page of its own, its way back the list (the filters kept, this component staying while the address changes).
 * Opening one marks it read; the page menu reads them all and leads to 알림 설정. A notice not among those read so far
 * (an old one's address) cannot be found, as the API reads no single notice. (client/'s word search waits.)
 */
export function NotificationsPage({ crumbs, id }: { crumbs: Crumb[]; id?: string }) {
  const navigate = useNavigate();
  const isPhone = useIsMobile();
  const hrefOf = (noticeId?: string) => `/inbox${noticeId ? `/${noticeId}` : ''}`;
  const filters = useFilters(FILTERS);
  const listing: NotificationListing = { read: filters.one('read') as NotificationListing['read'] };
  const list = useInfiniteQuery(notificationsOptions(listing));
  const unread = useQuery(unreadNotificationsOptions()).data?.count ?? 0;
  const readAll = useReadAllNotifications();
  const pages = list.isPlaceholderData ? undefined : list.data?.pages;
  const items = useMemo(() => pages?.flatMap(page => page.items) ?? [], [pages]);
  // Each row tells when it came against the clock read with the notices, so 오늘 and 어제 turn over with a new read.
  const now = useMemo(() => (pages ? Date.now() : 0), [pages]);
  // The chosen notice stays shown when the list read again no longer holds it (read, under 안 읽음).
  const seen = useRef<NotificationItem | undefined>(undefined);
  const found = id ? items.find(item => item.id === id) : undefined;
  if (found) seen.current = found;
  const chosen = found ?? (seen.current?.id === id ? seen.current : undefined);
  const notices = items;
  const missing = <PageState kind="not-found" title="알림을 찾을 수 없습니다" description="목록에서 알림을 다시 골라 주세요." />;
  if (id && isPhone) {
    if (!chosen) return <DetailSurface surface="page" title="알림" crumbs={pageCrumbs(crumbsUnder(crumbs, hrefOf(), '알림'))}>{list.isPending ? null : missing}</DetailSurface>;
    return <NoticeDetail key={chosen.id} item={chosen} frame={view => <DetailSurface surface="page" title="알림"
      crumbs={pageCrumbs(crumbsUnder(crumbs, hrefOf(), view.title))}
      actions={<>{view.menu}{view.href ? <OpenPageButton href={view.href} /> : null}</>}>
      {view.column ? <SplitColumn title={view.title} description={view.description}>{view.content}</SplitColumn> : view.content}
    </DetailSurface>} />;
  }
  const state = (): SplitState | undefined => {
    if (list.isError) return { kind: 'error', title: '알림을 불러오지 못했습니다', description: list.error.message,
      action: <Button variant="secondary" onClick={() => void list.refetch()}>다시 시도</Button> };
    if (!pages || notices.length > 0 || list.hasNextPage) return undefined;
    return filters.count > 0
      ? { kind: 'search', title: '조건에 맞는 알림이 없습니다',
        action: <Button variant="secondary" onClick={filters.clear}>조건 지우기</Button> }
      : { kind: 'empty', title: '새로 확인할 활동이 없습니다' };
  };
  const rows = <>
    {notices.length ? <section aria-label="최근 소식">
      <SplitList label="최근 소식">
        {notices.map(item => <NotificationRow key={item.id} item={item} now={now} isChosen={item.id === id} href={hrefOf(item.id)} />)}
      </SplitList>
    </section> : null}
    {/* 다른 목록과 같은 목록 끝: 읽은 수와 더 보기(알림은 전체 수를 받지 않아 읽은 수만). */}
    {notices.length ? <ListMore shown={notices.length} hasMore={!!list.hasNextPage && !list.isPlaceholderData}
      isLoading={list.isFetchingNextPage} onMore={() => void list.fetchNextPage()} className="pl-5.5" /> : null}
  </>;
  return <SplitView {...activitySplit} crumbs={pageCrumbs(crumbs)} pageActions={<NotificationsMenu unread={unread} onReadAll={() => readAll.mutate(undefined)} />}
    tools={filters.tools} applied={filters.applied} label="알림함" list={rows} state={state()}
    detail={!id ? undefined : chosen ? <NoticeDetail key={chosen.id} item={chosen} frame={inboxFrame} /> : list.isPending ? false : missing}
    onClose={() => void navigate({ href: hrefOf() })} />;
}
