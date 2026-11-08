import { Avatar } from '@astryxdesign/core/Avatar';
import { HStack } from '@astryxdesign/core/HStack';
import { ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { PageState } from '@kit/composites/state/PageState';
import { useIsPhone } from '@kit/foundations/media';
import { InboxPane } from '@kit/layouts/peek/InboxPane';
import { Page } from '@kit/layouts/page/Page';
import { PageList } from '@kit/layouts/page/PageParts';
import { usePeek } from '@kit/patterns/routing/peek';
import { useCallback, useEffect, type KeyboardEvent, type MouseEvent } from 'react';
import { requestKinds, seedRequests, useRequestRead } from '../../entities/request/model';
import { ResourcePeek } from '../resource-detail/ResourceDetailPage';

const timeText = (value: string) => new Intl.DateTimeFormat('ko', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })
  .format(new Date(value));

/**
 * 받은 요청: 처리 목록. 행 어디를 눌러도 오른쪽 칸에 그 요청이 열리고(목록 주소 + ?peek=ID), 고른 것이 없으면 오른쪽은 고르라는
 * 빈 상태다. 처음 열 때만 기록을 쌓고 옮길 때는 바꾼다. 위·아래 키로 옮기고 Esc·←로 닫는다. 열면 읽음이 된다. 안 읽음은
 * 바탕이 아니라 굵은 제목과 "안 읽음" 표시로 구분한다(이 테마의 강조색은 거의 검정이라 옅게 섞으면 고른 행 바탕과 같아진다).
 * 휴대폰은 목록만 보이고 행은 그 자료의 페이지로 간다.
 */
export function RequestsPage() {
  const isPhone = useIsPhone();
  const { read, markRead } = useRequestRead();
  const pageOf = useCallback((id: string) => `/resources/${seedRequests.find(each => each.id === id)?.resourceId ?? id}`, []);
  const peek = usePeek(pageOf);
  const chosen = seedRequests.find(each => each.id === peek.id);
  useEffect(() => { if (chosen) markRead(chosen.id); }, [chosen, markRead]);
  // 행은 실제 링크(새 탭·주소 복사)이고, 그냥 누르면 기록 규칙(처음은 쌓고 옮길 때는 바꿈)대로 연다.
  const press = (event: MouseEvent<HTMLElement>) => {
    if (isPhone || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const row = (event.target as HTMLElement).closest<HTMLElement>('[data-peek-row]');
    if (!row || (event.target as HTMLElement).closest('button')) return;
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
  const unread = seedRequests.filter(each => !read.has(each.id)).length;
  return <Page crumbs={[{ label: '받은 요청' }]}
    aside={isPhone ? undefined : <InboxPane id={peek.id} title={chosen ? `${chosen.from} · ${requestKinds[chosen.kind]}` : '요청'}
      pageHref={peek.id ? pageOf(peek.id) : undefined} onClose={peek.close}
      empty={{ title: '요청을 선택해 주세요', description: '검토 요청, 공유, 댓글의 내용을 여기서 확인합니다.' }}>
      {chosen ? <>
        <VStack gap={1} paddingInline={4} paddingBlock={3}>
          <Text weight="medium">{chosen.message}</Text>
          <Text type="supporting" color="secondary" hasTabularNumbers>{timeText(chosen.sentAt)}</Text>
        </VStack>
        <ResourcePeek id={chosen.resourceId} />
      </> : <PageState kind="not-found" isCompact title="요청을 찾을 수 없습니다" description="목록에서 다시 골라 주세요." />}
    </InboxPane>}>
    <div onClickCapture={press} onKeyDown={keys}>
      <PageList hasDividers aria-label={unread ? `받은 요청, 안 읽음 ${unread}개` : '받은 요청'}>
        {seedRequests.map(each => {
          const isUnread = !read.has(each.id);
          return <ListItem key={each.id} href={peek.hrefOf(each.id)} isSelected={peek.id === each.id} data-peek-row={each.id}
            label={<Text weight={isUnread ? 'semibold' : 'medium'} maxLines={1}>{`${each.from}님의 ${requestKinds[each.kind]}`}</Text>}
            description={<Text color="secondary" maxLines={1}>{each.message}</Text>}
            startContent={<Avatar name={each.from} size="sm" shape="circle" />}
            endContent={<HStack gap={2} vAlign="center">
              {isUnread ? <Text type="supporting" color="accent">안 읽음</Text> : null}
              <Text type="supporting" color="secondary" hasTabularNumbers textWrap="nowrap">{timeText(each.sentAt)}</Text>
            </HStack>} />;
        })}
      </PageList>
    </div>
  </Page>;
}
