import { cn } from 'cn';
import { Button } from '@/shared/ui/button';
import { RefreshCwIcon } from '@/shared/ui/icon';
import { PersonAvatar } from '@/shared/ui/person-avatar';
import { Fragment, type Ref } from 'react';
import { clockText, groupMessages, splitMentions, type Message, type Outgoing } from '../entities/thread';

/** 말풍선: 남의 것은 옅은 면, 내 것은 강조색이 섞인 면. 보내는 중은 흐리게. @이름은 굵게 점선 밑줄. */
function Body({ body, members, isMine, status }: { body: string; members: string[]; isMine: boolean; status?: Outgoing['status'] }) {
  return (
    <p className={cn('rounded-xl px-3 py-2 break-keep whitespace-pre-wrap [overflow-wrap:anywhere]', isMine ? 'bg-pressed' : 'bg-muted', status === 'sending' && 'opacity-60')}>
      {splitMentions(body, members).map((part, index) => part.isMention
        ? <span key={index} className="font-semibold underline decoration-dotted underline-offset-[0.2em]">{part.text}</span>
        : <Fragment key={index}>{part.text}</Fragment>)}
    </p>
  );
}

const COLUMN = 'flex min-w-0 max-w-[min(32rem,85%)] flex-col gap-1';

/**
 * 대화의 본문: 날짜 구분 아래에 같은 사람이 이어 쓴 메시지를 한 묶음으로 보인다(남의 묶음은 사진·이름·시각을 한 번만).
 * 서버에 아직 닿지 않은 내 메시지는 맨 끝에 흐리게 두고, 실패한 것은 곁에서 다시 보낸다. 짧은 대화는 바닥에 붙는다.
 */
export function MessageLog({ messages, outgoing, members, onRetry, logRef }: {
  messages: Message[]; outgoing: Outgoing[]; members: string[]; onRetry: (item: Outgoing) => void; logRef: Ref<HTMLDivElement>;
}) {
  const days = groupMessages(messages);
  return (
    <div ref={logRef} role="log" aria-label="대화" aria-relevant="additions"
      className="mx-auto box-border flex min-h-full w-full max-w-180 shrink-0 flex-col justify-end gap-1 px-4 pt-4 pb-3">
      {days.map(day => (
        <section key={day.key} className="flex flex-col gap-3">
          {/* 날짜 구분: 가는 선 사이의 이름. */}
          <h3 className="mt-2 flex items-center gap-3 text-xs font-medium text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">{day.label}</h3>
          {day.runs.map(run => (
            <div key={run.messages[0].id} className={cn('flex items-start gap-2', run.isMine && 'flex-row-reverse')}>
              {run.isMine ? null : <PersonAvatar name={run.author} className="size-8" />}
              <div className={cn(COLUMN, run.isMine && 'items-end')}>
                <div className="flex items-baseline gap-2">
                  {run.isMine ? null : <span className="text-sm font-semibold">{run.author}</span>}
                  <span className="text-xs text-muted-foreground tabular-nums">{clockText(run.messages[0].sentAt)}</span>
                </div>
                {run.messages.map(message => <Body key={message.id} body={message.body} members={members} isMine={run.isMine} />)}
              </div>
            </div>
          ))}
        </section>
      ))}
      {outgoing.length ? (
        <div className="flex flex-row-reverse items-start gap-2">
          <div className={cn(COLUMN, 'items-end')}>
            {outgoing.map(item => (
              <Fragment key={item.localId}>
                <Body body={item.body} members={members} isMine status={item.status} />
                {item.status === 'sending'
                  ? <span role="status" className="text-xs text-muted-foreground">보내는 중</span>
                  : (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span role="alert" className="text-xs text-destructive">보내지 못했습니다</span>
                      <Button variant="secondary" size="sm" className="max-md:h-11" onClick={() => onRetry(item)}><RefreshCwIcon data-icon="inline-start" />다시 보내기</Button>
                    </div>
                  )}
              </Fragment>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
