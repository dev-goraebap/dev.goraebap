import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { ChevronDownIcon, MessageCircleIcon, TriangleAlertIcon } from '@/shared/ui/icon';
import { Page, type Crumb } from '@/shared/ui/page';
import { PageState } from '@/shared/ui/page-state';
import { Spinner } from '@/shared/ui/spinner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ME, threadKeys, threadQueries, useOutbox, useThreadApi, type Outgoing } from '../entities/thread';
import { Composer } from './Composer';
import { MessageLog } from './MessageLog';

/** 라우터 주소의 타입은 사이트 라우터에 등록되어 있어, 견본 앱의 주소는 글자로 넘긴다. */
const ROOMS: string = '/rooms';
const NEAR_BOTTOM = 80;
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 상태 화면도 대화방처럼 점 무늬 없는 면에 둔다. */
const plain = (children: ReactNode) => <div className="flex flex-1 flex-col bg-background">{children}</div>;

/**
 * 대화방: 오래된 메시지가 위, 새 메시지가 아래이고 입력 칸이 바닥에 붙는다. 처음 열면 맨 아래에서 시작한다. 새 글이 오면
 * 바닥 근처에서 읽던 사람은 따라 내려가고, 위로 올라가 읽던 사람은 자리를 지킨 채 입력 칸 위에 "새 글 N개"를 본다.
 * 내가 보낸 메시지는 서버에 닿기 전까지 끝에 흐리게 두고(보내는 중), 실패하면 그 곁에서 다시 보낸다. 휴대폰은 전체 화면이다
 * (하단 탭 없이 앱 바 ← 와 입력 칸).
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

  const scroller = useRef<HTMLDivElement>(null);
  const [log, setLog] = useState<HTMLDivElement | null>(null);
  const atBottom = useRef(true);
  const seen = useRef<number | undefined>(undefined);
  const [unseen, setUnseen] = useState(0);
  const toBottom = useCallback((isSmooth: boolean) => {
    const box = scroller.current;
    box?.scrollTo({ top: box.scrollHeight, behavior: isSmooth && !prefersReducedMotion() ? 'smooth' : 'auto' });
    setUnseen(0);
  }, []);

  useEffect(() => {
    const box = scroller.current;
    if (!box || !log) return undefined;
    const onScroll = () => {
      atBottom.current = box.scrollHeight - box.scrollTop - box.clientHeight <= NEAR_BOTTOM;
      if (atBottom.current) setUnseen(0);
    };
    box.addEventListener('scroll', onScroll, { passive: true });
    return () => box.removeEventListener('scroll', onScroll);
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

  const crumbs = (label: string): Crumb[] => [{ label: '대화', href: ROOMS, icon: MessageCircleIcon }, { label }];
  if (rooms.isPending || (query.isPending && !query.data)) {
    return <Page crumbs={crumbs(room?.name ?? '대화방')} isFullScreen>{plain(<div className="flex flex-1 items-center justify-center"><Spinner aria-label="대화를 불러오는 중" className="size-6" /></div>)}</Page>;
  }
  if (rooms.isSuccess && !room) {
    return (
      <Page crumbs={crumbs('없는 대화방')} isFullScreen>
        {plain(<PageState kind="not-found" title="대화방을 찾을 수 없습니다" description="없어졌거나 주소가 바뀌었을 수 있습니다."
          action={<Button variant="secondary" nativeButton={false} render={<Link to={ROOMS} />}>대화 목록으로</Button>} />)}
      </Page>
    );
  }
  if (!room || (query.isError && !query.data)) {
    return (
      <Page crumbs={crumbs(room?.name ?? '대화방')} isFullScreen>
        {plain(<PageState kind="error" title="대화를 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
          action={<Button variant="secondary" onClick={() => void query.refetch()}>다시 시도</Button>} />)}
      </Page>
    );
  }
  const people = room.members.filter(name => name !== ME);
  const isEmpty = messages.length === 0 && outgoing.length === 0;
  return (
    <Page crumbs={crumbs(room.name)} isFullScreen
      actions={<span className="ml-auto shrink-0 px-1 text-xs text-muted-foreground tabular-nums">참여 {room.members.length}명</span>}
      below={query.isError ? (
        <Alert variant="destructive" className="shrink-0 rounded-none border-x-0 border-t-0">
          <TriangleAlertIcon /><AlertTitle>새 글을 확인하지 못했습니다</AlertTitle><AlertDescription>보이는 대화는 마지막으로 읽은 내용입니다.</AlertDescription>
        </Alert>
      ) : undefined}>
      {/* 대화만 스크롤하고 입력 칸은 그 아래에 붙는다. */}
      <div className="flex min-h-0 flex-1 flex-col bg-background">
        <div ref={scroller} className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
          {isEmpty
            ? <PageState kind="empty" title="아직 대화가 없습니다" description="첫 메시지를 남겨 보세요." />
            : <MessageLog logRef={setLog} messages={messages} outgoing={outgoing} members={room.members} onRetry={item => void deliver(item)} />}
        </div>
        <Composer people={people} onSend={submit}
          before={unseen > 0 ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-full mb-3 flex justify-center">
              <Button variant="secondary" size="sm" className="pointer-events-auto rounded-full shadow-md max-md:h-11" onClick={() => toBottom(true)}>
                <ChevronDownIcon data-icon="inline-start" />새 글 {unseen}개, 아래로
              </Button>
            </div>
          ) : undefined} />
      </div>
    </Page>
  );
}
