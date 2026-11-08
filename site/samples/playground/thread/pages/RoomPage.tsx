import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { PageState } from '@/shared/ui/composites/state/PageState';
import { icon } from '@/shared/ui/foundations/icons/solar-icon';
import { Page } from '@/shared/ui/layouts/page/Page';
import { PageBanner } from '@/shared/ui/layouts/page/PageParts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ME, threadKeys, threadQueries, useOutbox, useThreadApi, type Outgoing } from '../entities/thread';
import { Composer } from './Composer';
import { MessageLog } from './MessageLog';
import styles from './thread.module.css';

/** 로그를 스크롤하는 가장 가까운 부모(Page 본문). */
function scrollParent(element: HTMLElement | null): HTMLElement | undefined {
  for (let node = element?.parentElement; node; node = node.parentElement) {
    if (/auto|scroll|overlay/.test(getComputedStyle(node).overflowY)) return node;
  }
  return undefined;
}
const NEAR_BOTTOM = 80;
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * 대화방: 오래된 메시지가 위, 새 메시지가 아래이고 입력 칸이 바닥에 붙는다. 처음 열면 맨 아래에서 시작한다. 새 글이 오면
 * 바닥 근처에서 읽던 사람은 따라 내려가고, 위로 올라가 읽던 사람은 자리를 지킨 채 입력 칸 위에 "새 글 N개"를 본다.
 * 내가 보낸 메시지는 서버에 닿기 전까지 끝에 흐리게 두고(보내는 중), 실패하면 그 곁에서 다시 보낸다. 휴대폰은 전체 화면이다.
 */
export function RoomPage({ roomId }: { roomId: string }) {
  const api = useThreadApi();
  const client = useQueryClient();
  const rooms = useQuery(threadQueries.rooms(api));
  const query = useQuery(threadQueries.messages(api, roomId));
  const { outbox, setOutbox } = useOutbox();
  const outgoing = outbox[roomId] ?? [];
  const room = rooms.data?.find(each => each.id === roomId);
  const messages = query.data ?? [];

  const [log, setLog] = useState<HTMLDivElement | null>(null);
  const atBottom = useRef(true);
  const seen = useRef<number | undefined>(undefined);
  const [unseen, setUnseen] = useState(0);
  const toBottom = useCallback((isSmooth: boolean) => {
    const scroller = scrollParent(log);
    scroller?.scrollTo({ top: scroller.scrollHeight, behavior: isSmooth && !prefersReducedMotion() ? 'smooth' : 'auto' });
    setUnseen(0);
  }, [log]);

  useEffect(() => {
    const scroller = scrollParent(log);
    if (!scroller) return undefined;
    const onScroll = () => {
      atBottom.current = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= NEAR_BOTTOM;
      if (atBottom.current) setUnseen(0);
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
  }, [log]);

  // 처음에는 맨 아래로. 그 뒤 새 글이 오면 바닥 근처였거나 내가 쓴 글이면 따라가고, 아니면 알림만 올린다.
  const total = messages.length + outgoing.length;
  useEffect(() => {
    if (!log || query.isPending) return;
    if (seen.current === undefined) { seen.current = total; toBottom(false); return; }
    const added = total - seen.current;
    seen.current = total;
    if (added <= 0) return;
    const last = outgoing.length ? ME : messages[messages.length - 1]?.author;
    if (atBottom.current || last === ME) toBottom(true); else setUnseen(count => count + added);
  }, [total, log, query.isPending]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = (localId: string, change: Partial<Outgoing> | null) => setOutbox(roomId, list =>
    change ? list.map(each => (each.localId === localId ? { ...each, ...change } : each)) : list.filter(each => each.localId !== localId));
  const deliver = async (item: Outgoing) => {
    patch(item.localId, { status: 'sending' });
    try {
      await api.send(roomId, item.localId, item.body);
      await client.invalidateQueries({ queryKey: threadKeys.messages(roomId) });
      patch(item.localId, null);
    } catch {
      patch(item.localId, { status: 'failed' });
    }
  };
  const submit = (body: string) => {
    const item: Outgoing = { localId: crypto.randomUUID(), body, status: 'sending' };
    setOutbox(roomId, list => [...list, item]);
    void deliver(item);
  };

  const crumbs = [{ label: '대화', href: '/rooms', icon: 'comment' as const }];
  if (rooms.isPending || (query.isPending && !query.data)) {
    return <Page crumbs={[...crumbs, { label: room?.name ?? '대화방' }]} isDetail><Center height="100%"><Spinner label="대화를 불러오는 중" /></Center></Page>;
  }
  if (rooms.isSuccess && !room) {
    return <Page crumbs={[...crumbs, { label: '없는 대화방' }]} isDetail>
      <PageState kind="not-found" title="대화방을 찾을 수 없습니다" description="없어졌거나 주소가 바뀌었을 수 있습니다." action={<Button label="대화 목록으로" variant="secondary" href="/rooms" />} />
    </Page>;
  }
  if (!room || (query.isError && !query.data)) {
    return <Page crumbs={[...crumbs, { label: room?.name ?? '대화방' }]} isDetail>
      <PageState kind="error" title="대화를 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
        action={<Button label="다시 시도" variant="secondary" onClick={() => void query.refetch()} />} />
    </Page>;
  }
  const people = room.members.filter(name => name !== ME);
  return <Page crumbs={[...crumbs, { label: room.name }]} isDetail
    pageActions={<Text type="supporting" color="secondary" hasTabularNumbers>참여 {room.members.length}명</Text>}
    aboveFooter={<Composer people={people} onSend={submit}
      before={unseen > 0 ? <div className={styles.jump}>
        <Button label={`새 글 ${unseen}개, 아래로`} variant="secondary" size="sm" icon={icon('chevron-down')} onClick={() => toBottom(true)} />
      </div> : undefined} />}>
    {query.isError ? <PageBanner status="error" title="새 글을 확인하지 못했습니다" description="보이는 대화는 마지막으로 읽은 내용입니다." /> : null}
    {messages.length === 0 && outgoing.length === 0
      ? <PageState kind="empty" title="아직 대화가 없습니다" description="첫 메시지를 남겨 보세요." />
      : <MessageLog logRef={setLog} messages={messages} outgoing={outgoing} members={room.members} onRetry={item => void deliver(item)} />}
  </Page>;
}
