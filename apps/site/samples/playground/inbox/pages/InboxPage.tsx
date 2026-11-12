import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAddressFilters } from '@/shared/lib/list-address';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { usePeek } from '@/shared/lib/use-peek';
import { Alert, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { FilterBar, FilterChips, FilterMenu, useFilters, type FilterDef, type FilterState } from '@/shared/ui/filter';
import { ArchiveIcon, BellIcon, CircleCheckIcon, InboxIcon, TriangleAlertIcon } from '@/shared/ui/icon';
import { Page } from '@/shared/ui/page';
import { PageState } from '@/shared/ui/page-state';
import { InboxLayout, InboxPane, usePeekRows } from '@/shared/ui/peek';
import { PersonAvatar } from '@/shared/ui/person-avatar';
import { Skeleton } from '@/shared/ui/skeleton';
import { kinds, notificationQueries, timeText, useNotificationApi, useNotificationRead, type Notification } from '../entities/notification';
import { useArchiveToggle } from './archive';
import { NotificationView } from './NotificationView';

type FilterKey = 'kind' | 'read';
const filterKeys: FilterKey[] = ['kind', 'read'];
const filters: FilterDef<FilterKey>[] = [
  { key: 'kind', label: '종류', icon: BellIcon, options: Object.entries(kinds).map(([value, item]) => ({ value, label: item.label })) },
  { key: 'read', label: '읽음', icon: CircleCheckIcon, options: [{ value: 'unread', label: '안 읽음' }, { value: 'read', label: '읽음' }] },
];
/** 읽음은 둘 중 하나만 고른다: 새로 고른 값이 앞의 값을 바꾼다(둘 다 고르면 거르지 않는 것과 같아서). */
const oneRead = (next: FilterState<FilterKey>, current: FilterState<FilterKey>): FilterState<FilterKey> =>
  ({ ...next, read: (next.read ?? []).length > 1 ? next.read!.filter(value => !current.read?.includes(value)) : next.read });

export const pageOf = (id: string) => `/inbox/${id}`;

/**
 * 알림 목록(받은 알림 · 보관함): 처리 목록. 행 어디를 눌러도 오른쪽 칸에 그 알림이 열리고(목록 주소 + ?peek=ID), 고른 것이
 * 없으면 오른쪽은 고르라는 빈 상태다. 처음 열 때만 기록을 쌓고 옮길 때는 바꾼다. 위 · 아래 키로 옮기고 Esc · ←로 닫는다(usePeekRows).
 * 열면 읽음이 된다. 안 읽음은 옅은 바탕과 굵은 제목, "안 읽음" 글자로 구분한다. 휴대폰은 목록만 보이고 행은 자기 페이지로 간다.
 */
export function InboxPage({ scope }: { scope: 'inbox' | 'archive' }) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [state, setState] = useAddressFilters(filterKeys);
  const list = useFilters(filters, { state, onStateChange: next => setState(oneRead(next, state)) });
  const api = useNotificationApi();
  const { read, markRead } = useNotificationRead();
  const query = useQuery(notificationQueries.all(api));
  const peek = usePeek(pageOf);
  const rows = usePeekRows(peek, { openOnClick: true });
  const isArchive = scope === 'archive';
  const items = (query.data ?? []).filter(each => each.archived === isArchive && (!state.kind?.length || state.kind.includes(each.kind))
    && (!state.read?.length || (state.read[0] === 'read') === read.has(each.id)));
  const chosen = peek.id ? items.find(each => each.id === peek.id) : undefined;
  useEffect(() => { if (chosen) markRead(chosen.id); }, [chosen, markRead]);
  const toggle = useArchiveToggle(peek.close);
  const unread = items.filter(each => !read.has(each.id)).length;
  const label = isArchive ? '보관함' : '받은 알림';
  const content = () => {
    if (query.isPending) return <ListSkeleton />;
    if (query.isError && !query.data) return <PageState kind="error" title="알림을 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
      action={<Button variant="secondary" onClick={() => void query.refetch()}>다시 시도</Button>} />;
    if (items.length === 0 && list.active.length > 0) return <PageState kind="search" title="조건에 맞는 알림이 없습니다" description="필터를 바꾸거나 지워 보세요."
      action={<Button variant="secondary" onClick={list.clear}>조건 지우기</Button>} />;
    if (items.length === 0) return isArchive
      ? <PageState kind="empty" title="보관한 알림이 없습니다" description="처리한 알림을 보관하면 여기에 모입니다." />
      : <PageState kind="empty" title="받은 알림이 없습니다" description="새 알림이 오면 여기에 모입니다." />;
    return <ul aria-label={unread ? `${label}, 안 읽음 ${unread}개` : label} className="flex flex-col" {...rows}>
      {items.map(each => <Row key={each.id} item={each} isUnread={!read.has(each.id)} isSelected={peek.id === each.id}
        link={isMobile ? { to: '/inbox/$id', params: { id: each.id } } : { to: location.pathname, search: { ...location.search, peek: each.id } }} />)}
    </ul>;
  };
  return <InboxLayout listLabel={label} detailLabel="알림 내용"
    list={<Page crumbs={[{ label, icon: isArchive ? ArchiveIcon : InboxIcon }]} tools={<FilterMenu filters={list} />}
      below={<>
        {isMobile ? <FilterChips filters={list} /> : <FilterBar filters={list} />}
        {toggle.isError ? <Alert variant="destructive" className="shrink-0 rounded-none border-x-0 border-t-0">
          <TriangleAlertIcon /><AlertTitle>알림을 옮기지 못했습니다</AlertTitle>
        </Alert> : null}
      </>}>
      {content()}
    </Page>}
    detail={<InboxPane id={peek.id} title={chosen ? `${chosen.from} · ${kinds[chosen.kind].label}` : '알림'}
      pageHref={peek.id ? pageOf(peek.id) : undefined} onClose={peek.close}
      empty={{ title: '알림을 선택해 주세요', description: '멘션, 배정, 승인 요청의 내용을 여기서 확인합니다.' }}>
      {chosen
        ? <NotificationView item={chosen} headingLevel={2} isBusy={toggle.isPending} onToggleArchive={() => toggle.mutate(chosen)} />
        : <PageState kind="not-found" isCompact title="알림을 찾을 수 없습니다" description="목록에서 다시 골라 주세요." />}
    </InboxPane>} />;
}

type RowTarget = { to: string; params?: Record<string, string>; search?: Record<string, unknown> };

/**
 * 한 줄: 보낸 사람(시스템 · 승인은 종류 표식), 제목과 한 줄 미리 보기, 끝에 안 읽음과 받은 때. 줄 전체가 하나의 링크라 어디를 눌러도
 * 열리고 새 탭 · 주소 복사도 같은 화면이다. 안 읽은 줄은 글자색을 옅게 섞은 바탕, 고른 줄은 한 단계 진하게.
 */
function Row({ item, isUnread, isSelected, link }: { item: Notification; isUnread: boolean; isSelected: boolean; link: RowTarget }) {
  // 휴대폰은 자리가 좁아 글자 대신 점(읽기용 이름은 남긴다).
  const isMobile = useIsMobile();
  const Kind = kinds[item.kind].icon;
  return <li data-peek-row={item.id} className="border-b">
    <Link {...(link as { to: string })} aria-current={isSelected ? 'true' : undefined} data-unread={isUnread || undefined}
      className="flex items-center gap-3 bg-background px-4 py-3 outline-none hover:bg-row-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset aria-[current=true]:bg-muted data-unread:bg-unread data-unread:hover:bg-unread-strong data-unread:aria-[current=true]:bg-unread-strong compact:py-2">
      {item.kind === 'system' || item.kind === 'approval'
        ? <span title={kinds[item.kind].label} className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-icon-muted"><Kind /></span>
        : <PersonAvatar name={item.from} className="size-8" />}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={isUnread ? 'truncate font-semibold' : 'truncate font-medium'}>{item.title}</span>
        <span className="truncate text-sm text-muted-foreground">{item.excerpt}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2.5 text-xs whitespace-nowrap tabular-nums">
        {isUnread ? isMobile ? <span className="size-2 rounded-full bg-primary"><span className="sr-only">안 읽음</span></span>
          : <span className="font-medium text-primary">안 읽음</span> : null}
        <span className="text-muted-foreground">{timeText(item.sentAt)}</span>
      </span>
    </Link>
  </li>;
}

function ListSkeleton() {
  return <ul aria-label="알림을 읽는 중" aria-busy="true" className="flex flex-col">
    {Array.from({ length: 6 }, (_, index) => <li key={index} className="flex items-center gap-3 border-b bg-background px-4 py-3">
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <span className="flex flex-1 flex-col gap-1.5 py-0.5"><Skeleton className="h-3.5 w-3/5" /><Skeleton className="h-3 w-2/5" /></span>
    </li>)}
  </ul>;
}
