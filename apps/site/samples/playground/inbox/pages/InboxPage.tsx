import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAddressFilters } from '@/shared/lib/list-address';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { Alert, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { FilterBar, FilterChips, FilterMenu, useFilters, type FilterDef, type FilterState } from '@/shared/ui/filter';
import { ArchiveIcon, BellIcon, CircleCheckIcon, InboxIcon, TriangleAlertIcon } from '@/shared/ui/icon';
import { SplitDetail, SplitLinkRow, SplitResource, SplitScreen, type SplitPane } from '@/shared/ui/layout/split-view';
import { ListMore } from '@/shared/ui/list-more';
import { InboxIllustration, PageState } from '@/shared/ui/page-state';
import { PersonAvatar } from '@/shared/ui/person-avatar';
import { Skeleton } from '@/shared/ui/skeleton';
import { kinds, notificationQueries, timeText, useNotificationApi, useNotificationRead, type Notification } from '../entities/notification';
import { useArchiveToggle } from './archive';
import { NotificationPage } from './NotificationPage';
import { NotificationView } from './NotificationView';

type FilterKey = 'kind' | 'read';
type Scope = 'inbox' | 'archive';
const filterKeys: FilterKey[] = ['kind', 'read'];
const filters: FilterDef<FilterKey>[] = [
  { key: 'kind', label: '종류', icon: BellIcon, options: Object.entries(kinds).map(([value, item]) => ({ value, label: item.label })) },
  { key: 'read', label: '읽음', icon: CircleCheckIcon, options: [{ value: 'unread', label: '안 읽음' }, { value: 'read', label: '읽음' }] },
];
/** 읽음은 둘 중 하나만 고른다: 새로 고른 값이 앞의 값을 바꾼다(둘 다 고르면 거르지 않는 것과 같아서). */
const oneRead = (next: FilterState<FilterKey>, current: FilterState<FilterKey>): FilterState<FilterKey> =>
  ({ ...next, read: (next.read ?? []).length > 1 ? next.read!.filter(value => !current.read?.includes(value)) : next.read });

export const listOf = (scope: Scope) => (scope === 'archive' ? '/archive' : '/inbox');
export const pageOf = (scope: Scope, id: string) => `${listOf(scope)}/${id}`;

/**
 * 알림 목록(받은 알림 · 보관함)의 주소들: 목록(/inbox)과 그 아래 알림 하나(/inbox/{id}). 목록-상세 분할(List-Detail)이라
 * 데스크톱은 목록 오른쪽 칸에, 휴대폰은 알림의 페이지로 연다. 열린 칸은 주소가 정한다.
 */
export function InboxPage({ scope, id }: { scope: Scope; id?: string }) {
  return <SplitResource mode={id ? 'view' : 'list'} id={id}
    phonePage={pane => <NotificationPage id={'id' in pane ? pane.id : ''} />}>
    {pane => <InboxScreen scope={scope} pane={pane} />}
  </SplitResource>;
}

/**
 * 알림 목록: 하나씩 열어 확인하고 넘어가는 목록. 줄 어디를 눌러도 오른쪽 칸에 그 알림이 열리고, 고른 것이 없으면 오른쪽 칸은
 * 고르기를 권하는 그림과 제목이다. 열면 읽음이 된다. 안 읽은 줄은 굵은 제목과 끝의 "안 읽음"으로 구분한다.
 */
function InboxScreen({ scope, pane }: { scope: Scope; pane?: SplitPane }) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [state, setState] = useAddressFilters(filterKeys);
  const list = useFilters(filters, { state, onStateChange: next => setState(oneRead(next, state)) });
  const api = useNotificationApi();
  const { read } = useNotificationRead();
  const query = useQuery(notificationQueries.all(api));
  const isArchive = scope === 'archive';
  const chosenId = pane && 'id' in pane ? pane.id : undefined;
  const items = (query.data ?? []).filter(each => each.archived === isArchive && (!state.kind?.length || state.kind.includes(each.kind))
    && (!state.read?.length || (state.read[0] === 'read') === read.has(each.id)));
  const toggle = useArchiveToggle(() => void navigate({ href: listOf(scope), replace: true }));
  const unread = items.filter(each => !read.has(each.id)).length;
  const label = isArchive ? '보관함' : '받은 알림';
  const listState = query.isError && !query.data
    ? { kind: 'error' as const, title: '알림을 불러오지 못했습니다',
      action: <Button variant="secondary" onClick={() => void query.refetch()}>다시 시도</Button> }
    : query.isPending || items.length > 0 ? undefined
      : list.active.length > 0
        ? { kind: 'search' as const, title: '조건에 맞는 알림이 없습니다', action: <Button variant="secondary" onClick={list.clear}>조건 지우기</Button> }
        : { kind: 'empty' as const, title: isArchive ? '보관한 알림이 없습니다' : '받은 알림이 없습니다' };
  return <SplitScreen crumbs={[{ label, icon: isArchive ? ArchiveIcon : InboxIcon }]} label={label}
    tools={<FilterMenu filters={list} />}
    chips={<FilterChips filters={list} />}
    applied={<>
      <FilterBar filters={list} />
      {toggle.isError ? <Alert variant="destructive" className="shrink-0 rounded-none border-x-0 border-t-0">
        <TriangleAlertIcon /><AlertTitle>알림을 옮기지 못했습니다</AlertTitle>
      </Alert> : null}
    </>}
    state={listState}
    list={query.isPending ? <ListSkeleton /> : <>
      <ul aria-label={unread ? `${label}, 안 읽음 ${unread}개` : label} className="flex flex-col">
        {items.map(each => <Row key={each.id} item={each} href={pageOf(scope, each.id)} isUnread={!read.has(each.id)}
          isChosen={chosenId === each.id} isMobile={isMobile} />)}
      </ul>
      <ListMore shown={items.length} total={items.length} unit="건" />
    </>}
    listHref={listOf(scope)} widthKey="webcraft-sample-inbox-list"
    placeholder={{ title: '알림을 선택해 주세요', illustration: <InboxIllustration /> }}
    pane={pane} paneKey={scope}
    renderPane={open => <NotificationPane key={'id' in open ? open.id : 'new'} scope={scope} id={'id' in open ? open.id : ''} />} />;
}

/** 오른쪽 칸의 알림 하나: 칸 머리(← 닫기 · 크게 보기)와 내용. 열면 읽음이 된다. */
function NotificationPane({ scope, id }: { scope: Scope; id: string }) {
  const navigate = useNavigate();
  const api = useNotificationApi();
  const { markRead } = useNotificationRead();
  const query = useQuery(notificationQueries.all(api));
  const item = query.data?.find(each => each.id === id);
  useEffect(() => { if (item) markRead(item.id); }, [item, markRead]);
  const toggle = useArchiveToggle(() => void navigate({ href: listOf(scope), replace: true }));
  return <SplitDetail label="알림" title={item?.title ?? '알림'}>
    {item
      ? <NotificationView item={item} headingLevel={2} isBusy={toggle.isPending} onToggleArchive={() => toggle.mutate(item)} />
      : query.isPending ? null : <PageState kind="not-found" isCompact title="알림을 찾을 수 없습니다" />}
  </SplitDetail>;
}

/**
 * 한 줄: 보낸 사람(시스템 · 승인은 종류 표식), 제목과 한 줄 미리 보기, 끝에 안 읽음과 받은 때. 줄 전체가 그 알림의 주소로 가는
 * 링크라 어디를 눌러도 열리고 새 탭 · 주소 복사도 같은 화면이다.
 */
function Row({ item, href, isUnread, isChosen, isMobile }: { item: Notification; href: string; isUnread: boolean; isChosen: boolean; isMobile: boolean }) {
  const Kind = kinds[item.kind].icon;
  return <SplitLinkRow href={href} title={item.title} isChosen={isChosen} isUnread={isUnread}
    start={item.kind === 'system' || item.kind === 'approval'
      ? <span title={kinds[item.kind].label} className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-icon-muted"><Kind /></span>
      : <PersonAvatar name={item.from} className="size-8" />}
    description={<span className="truncate text-sm text-muted-foreground">{item.excerpt}</span>}
    end={<span className="flex shrink-0 items-center gap-2.5 text-xs whitespace-nowrap tabular-nums">
      {/* 휴대폰은 자리가 좁아 글자 대신 점(읽기용 이름은 남긴다). */}
      {isUnread ? isMobile ? <span className="size-2 rounded-full bg-primary"><span className="sr-only">안 읽음</span></span>
        : <span className="font-medium text-primary">안 읽음</span> : null}
      <span className="text-muted-foreground">{timeText(item.sentAt)}</span>
    </span>} />;
}

function ListSkeleton() {
  return <ul aria-label="알림을 읽는 중" aria-busy="true" className="flex flex-col">
    {Array.from({ length: 6 }, (_, index) => <li key={index} className="flex items-center gap-3 border-b bg-background px-4 py-3">
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <span className="flex flex-1 flex-col gap-1.5 py-0.5"><Skeleton className="h-3.5 w-3/5" /><Skeleton className="h-3 w-2/5" /></span>
    </li>)}
  </ul>;
}
