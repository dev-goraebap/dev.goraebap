import { InboxLayout } from '@kit/layouts/peek/InboxLayout';
import { useFilters } from '@kit/composites/filter/use-filters';
import { useAddressFilters } from '@kit/patterns/list/list-address';
import type { ListFilter } from '@kit/composites/filter/types';
import { PersonAvatar as Avatar } from '@kit/foundations/avatar/PersonAvatar';
import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { HStack } from '@astryxdesign/core/HStack';
import { ListItem } from '@astryxdesign/core/List';
import { Spinner } from '@astryxdesign/core/Spinner';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { PageState } from '@kit/composites/state/PageState';
import { icon } from '@kit/foundations/icons/solar-icon';
import { useIsPhone } from '@kit/foundations/media';
import { Page } from '@kit/layouts/page/Page';
import { PageBanner, PageList } from '@kit/layouts/page/PageParts';
import { InboxPane } from '@kit/layouts/peek/InboxPane';
import { usePeek } from '@kit/patterns/routing/peek';
import { useQuery } from '@tanstack/react-query';
import { useEffect, type KeyboardEvent, type MouseEvent } from 'react';
import { kinds, notificationQueries, timeText, useNotificationApi, useNotificationRead, type Notification } from '../entities/notification';
import { useArchiveToggle } from './archive';
import { NotificationView } from './NotificationView';
import styles from './inbox.module.css';

const filters:ListFilter[]=[{key:'kind',label:'종류',icon:'bell',isMultiple:true,options:Object.entries(kinds).map(([value,item])=>({value,label:item.label}))},{key:'read',label:'읽음',icon:'check',options:[{value:'unread',label:'안 읽음'},{value:'read',label:'읽음'}]}];
export const pageOf = (id: string) => `/inbox/${id}`;

/**
 * 알림 목록(받은 알림·보관함): 처리 목록. 행 어디를 눌러도 오른쪽 칸에 그 알림이 열리고(목록 주소 + ?peek=ID), 고른 것이
 * 없으면 오른쪽은 고르라는 빈 상태다. 처음 열 때만 기록을 쌓고 옮길 때는 바꾼다. 위·아래 키로 옮기고 Esc·←로 닫는다.
 * 열면 읽음이 된다. 안 읽음은 바탕이 아니라 굵은 제목과 "안 읽음" 표시로 구분한다. 휴대폰은 목록만 보이고 행은 자기 페이지로 간다.
 */
export function InboxPage({ scope }: { scope: 'inbox' | 'archive' }) {
  const isPhone = useIsPhone();
  const [state,setState]=useAddressFilters(filters);const list=useFilters(filters,{state,onStateChange:setState});
  const api = useNotificationApi();
  const { read, markRead } = useNotificationRead();
  const query = useQuery(notificationQueries.all(api));
  const peek = usePeek(pageOf);
  const isArchive = scope === 'archive';
  const items = (query.data ?? []).filter(each => each.archived === isArchive && (!state.kind?.length || state.kind.includes(each.kind)) && (!state.read?.length || (state.read[0]==='read')===read.has(each.id)));
  const chosen = peek.id ? items.find(each => each.id === peek.id) : undefined;
  useEffect(() => { if (chosen) markRead(chosen.id); }, [chosen, markRead]);
  const toggle = useArchiveToggle(peek.close);
  // 행은 실제 링크(새 탭·주소 복사)이고, 그냥 누르면 기록 규칙(처음은 쌓고 옮길 때는 바꿈)대로 연다.
  const press = (event: MouseEvent<HTMLElement>) => {
    if (isPhone || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const row = (event.target as HTMLElement).closest<HTMLElement>('[data-peek-row]');
    if (!row) return;
    event.preventDefault();
    const id = row.dataset.peekRow!;
    if (peek.id !== id) peek.open(id);
  };
  const keys = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const row = (event.target as HTMLElement).closest<HTMLElement>('[data-peek-row]');
    if (!row) return;
    const rows = [...document.querySelectorAll<HTMLElement>('[data-peek-row]')];
    const next = rows[rows.indexOf(row) + (event.key === 'ArrowDown' ? 1 : -1)];
    if (!next) return;
    event.preventDefault();
    (next.matches('a[href]') ? next : next.querySelector<HTMLElement>('a[href]'))?.focus();
    if (peek.id) peek.move(next.dataset.peekRow!);
  };
  const unread = items.filter(each => !read.has(each.id)).length;
  const label = isArchive ? '보관함' : '받은 알림';
  const hasPane = !isPhone && !query.isPending && !(query.isError && !query.data) && items.length > 0;
  const content = () => {
    if (query.isPending) return <Center height="100%"><Spinner label="알림을 불러오는 중" /></Center>;
    if (query.isError && !query.data) return <PageState kind="error" title="알림을 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
      action={<Button label="다시 시도" variant="secondary" onClick={() => void query.refetch()} />} />;
    if (items.length === 0) return isArchive
      ? <PageState kind="empty" title="보관한 알림이 없습니다" description="처리한 알림을 보관하면 여기에 모입니다." />
      : <PageState kind="empty" title="받은 알림이 없습니다" description="새 알림이 오면 여기에 모입니다." />;
    return <div onClickCapture={press} onKeyDown={keys}>
      <PageList hasDividers aria-label={unread ? `${label}, 안 읽음 ${unread}개` : label}>
        {items.map(each => <Row key={each.id} item={each} isUnread={!read.has(each.id)} isSelected={peek.id === each.id}
          href={isPhone ? pageOf(each.id) : peek.hrefOf(each.id)} />)}
      </PageList>
    </div>;
  };
  return <InboxLayout list={<Page crumbs={[{label}]} tools={list.tools} applied={list.applied}>
    {toggle.isError ? <PageBanner status="error" title="알림을 옮기지 못했습니다" /> : null}
    {items.length===0 && list.count>0 ? <PageState kind="search" title="조건에 맞는 알림이 없습니다" action={<Button label="조건 지우기" onClick={list.clear}/>} /> : content()}
  </Page>} detail={<InboxPane id={peek.id} title={chosen ? `${chosen.from} · ${kinds[chosen.kind].label}` : '알림'}
      pageHref={peek.id ? pageOf(peek.id) : undefined} onClose={peek.close}
      empty={{ title: '알림을 선택해 주세요', description: '멘션, 배정, 승인 요청의 내용을 여기서 확인합니다.' }}>
      {chosen
        ? <NotificationView item={chosen} headingLevel={2} isBusy={toggle.isPending} onToggleArchive={() => toggle.mutate(chosen)} />
        : <PageState kind="not-found" isCompact title="알림을 찾을 수 없습니다" description="목록에서 다시 골라 주세요." />}
    </InboxPane>} />;
}

function Row({ item, isUnread, isSelected, href }: { item: Notification; isUnread: boolean; isSelected: boolean; href: string }) {
  const isPhone = useIsPhone();
  return <ListItem href={href} isSelected={isSelected} data-peek-row={item.id}
    label={<Text weight={isUnread ? 'semibold' : 'medium'} maxLines={1}>{item.title}</Text>}
    description={<Text color="secondary" maxLines={1}>{item.excerpt}</Text>}
    startContent={item.kind === 'system' || item.kind === 'approval'
      ? <span className={styles.kind} title={kinds[item.kind].label}>{icon(kinds[item.kind].icon)}</span>
      : <Avatar name={item.from} size="sm" shape="circle" />}
    endContent={<HStack className={styles.meta} vAlign="center">
      {isUnread ? (isPhone ? <StatusDot variant="accent" label="안 읽음" /> : <Text type="supporting" color="accent">안 읽음</Text>) : null}
      <Text type="supporting" color="secondary" hasTabularNumbers textWrap="nowrap">{timeText(item.sentAt)}</Text>
    </HStack>} />;
}
