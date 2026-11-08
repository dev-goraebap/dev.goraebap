import { Avatar } from '@astryxdesign/core/Avatar';
import { Button } from '@astryxdesign/core/Button';
import { Text } from '@astryxdesign/core/Text';
import { icon } from '@kit/foundations/icons/solar-icon';
import { Fragment, type Ref } from 'react';
import { clockText, groupMessages, splitMentions, type Message, type Outgoing } from '../entities/thread';
import styles from './thread.module.css';

function Body({ body, members, ...rest }: { body: string; members: string[]; 'data-state'?: string }) {
  return <p className={styles.bubble} {...rest}>
    {splitMentions(body, members).map((part, index) => part.isMention ? <span key={index} className={styles.mention}>{part.text}</span> : <Fragment key={index}>{part.text}</Fragment>)}
  </p>;
}

/**
 * 대화의 본문: 날짜 구분 아래에 같은 사람이 이어 쓴 메시지를 한 묶음으로 보인다(남의 묶음은 사진·이름·시각을 한 번만).
 * 서버에 아직 닿지 않은 내 메시지는 맨 끝에 흐리게 두고, 실패한 것은 곁에서 다시 보낸다. 짧은 대화는 바닥에 붙는다.
 */
export function MessageLog({ messages, outgoing, members, onRetry, logRef }: {
  messages: Message[]; outgoing: Outgoing[]; members: string[]; onRetry: (item: Outgoing) => void; logRef: Ref<HTMLDivElement>;
}) {
  const days = groupMessages(messages);
  return <div ref={logRef} className={styles.log} role="log" aria-label="대화" aria-relevant="additions">
    {days.map(day => <section key={day.key} className={styles.day}>
      <h3 className={styles.dayLabel}>{day.label}</h3>
      {day.runs.map(run => <div key={run.messages[0].id} className={styles.run} data-mine={run.isMine || undefined}>
        {run.isMine ? null : <Avatar name={run.author} size="sm" shape="circle" />}
        <div className={styles.column}>
          <div className={styles.who}>
            {run.isMine ? null : <Text weight="semibold">{run.author}</Text>}
            <Text type="supporting" color="secondary" hasTabularNumbers>{clockText(run.messages[0].sentAt)}</Text>
          </div>
          {run.messages.map(message => <Body key={message.id} body={message.body} members={members} />)}
        </div>
      </div>)}
    </section>)}
    {outgoing.length ? <div className={styles.run} data-mine>
      <div className={styles.column}>
        {outgoing.map(item => <Fragment key={item.localId}>
          <Body body={item.body} members={members} data-state={item.status} />
          {item.status === 'sending'
            ? <Text type="supporting" color="secondary" role="status">보내는 중</Text>
            : <div className={styles.state}>
              <Text type="supporting" className={styles.failedText} role="alert">보내지 못했습니다</Text>
              <Button label="다시 보내기" variant="secondary" size="sm" icon={icon('retry')} onClick={() => onRetry(item)} />
            </div>}
        </Fragment>)}
      </div>
    </div> : null}
  </div>;
}
