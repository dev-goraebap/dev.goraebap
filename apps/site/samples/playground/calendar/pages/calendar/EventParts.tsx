import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { AdaptivePopover } from '@/shared/ui/composites/popup/AdaptivePopover';
import { icon } from '@/shared/ui/foundations/icons/solar-icon';
import { createContext, useContext, type CSSProperties } from 'react';
import { dayText, eventsOn, whenText, type CalendarEvent, type DateKey } from '../../entities/event';
import { useCalendarAddress } from './address';
import styles from './calendar.module.css';

/** 일정을 고치거나 지우는 요청. 대화상자는 페이지 한 곳에서 열고, 일정 곁의 내용은 요청만 한다. */
export const EventActionsContext = createContext<{ onEdit: (event: CalendarEvent) => void; onDelete: (event: CalendarEvent) => void } | null>(null);

export type EventVariant = 'bar' | 'card' | 'row';

function EventDetail({ event, close }: { event: CalendarEvent; close: () => void }) {
  const actions = useContext(EventActionsContext);
  return <VStack gap={3} padding={2}>
    <HStack gap={2} vAlign="center">
      <span className={styles.dot} data-color={event.color} aria-hidden />
      <Text weight="semibold" size="lg">{event.title}</Text>
    </HStack>
    <VStack gap={1}>
      <Text color="secondary" hasTabularNumbers>{whenText(event)}</Text>
      {event.place ? <Text color="secondary">{event.place}</Text> : null}
    </VStack>
    <HStack gap={2} hAlign="end">
      <Button label="페이지로 열기" variant="ghost" size="sm" href={`/calendar/events/${event.id}`} icon={icon('expand-page')} />
      <Button label="삭제" variant="ghost" size="sm" icon={icon('delete')} onClick={() => { close(); actions?.onDelete(event); }} />
      <Button label="수정" variant="secondary" size="sm" icon={icon('edit')} onClick={() => { close(); actions?.onEdit(event); }} />
    </HStack>
  </VStack>;
}

/**
 * 일정 하나: 누르면 곁에 자세한 내용(데스크톱 팝오버, 휴대폰 바텀시트)이 열린다. 열린 일정은 주소의 event가 가지므로
 * 주소로 들어오면 처음부터 열려 있다. 막대(bar)는 월 격자, 카드(card)는 주 보기, 행(row)은 휴대폰 목록이다.
 */
export function EventPopover({ event, variant, day, style, continuesBefore, continuesAfter }: {
  event: CalendarEvent; variant: EventVariant; day?: DateKey; style?: CSSProperties; continuesBefore?: boolean; continuesAfter?: boolean;
}) {
  const address = useCalendarAddress();
  // 주소로 들어온 일정은 처음부터 열어 둔다(여러 날에 걸친 일정은 첫 막대만). 이후 열고 닫는 것은 사용자가 하고 주소가 따라간다.
  const isLinked = address.event === event.id && !continuesBefore;
  const timeText = event.time ?? (variant === 'row' || variant === 'card' ? '종일' : undefined);
  const resumed = variant === 'card' && day && event.start < day;
  // Popover는 트리거를 자기 앵커 요소로 감싸므로 격자 자리는 그 바깥의 slot이 가진다.
  return <div className={styles.slot} style={style} data-variant={variant} data-before={continuesBefore || undefined} data-after={continuesAfter || undefined}>
    <AdaptivePopover label={event.title} width="20rem" placement="below" alignment="start" defaultOpen={isLinked}
    onOpenChange={isOpen => { if (isOpen !== (address.event === event.id)) address.go({ event: isOpen ? event.id : undefined }, { replace: true }); }}
    content={close => <EventDetail event={event} close={close} />}
    trigger={<button type="button" className={styles[variant]} data-color={event.color} aria-label={`${event.title}, ${whenText(event)}`}>
      {variant === 'row' ? <span className={styles.rowTime}>{timeText}</span> : null}
      {variant === 'card' ? <span className={styles.cardTime}>{resumed ? '이어서' : timeText}</span> : null}
      {variant === 'bar' && event.time ? <span className={styles.barTime}>{event.time}</span> : null}
      <span className={styles.title}>{event.title}</span>
      {variant === 'row' && event.place ? <span className={styles.rowPlace}>{event.place}</span> : null}
    </button>} />
  </div>;
}

/**
 * 한 칸에 다 담지 못한 일정을 "+3"으로 묶는다. 누르면 그 날의 일정 전체를 곁에 펼치고, 하나를 고르면 그 날의 주 보기에서
 * 일정이 열린다.
 */
export function MoreEvents({ day, hidden, events, style }: { day: DateKey; hidden: number; events: CalendarEvent[]; style?: CSSProperties }) {
  const address = useCalendarAddress();
  const list = eventsOn(events, day);
  return <div className={styles.slot} style={style} data-variant="more">
    <AdaptivePopover label={`${dayText(day)} 일정`} width="18rem" alignment="start"
    trigger={<button type="button" className={styles.more} aria-label={`+${hidden}개 더 보기, ${dayText(day)}`}>+{hidden}</button>}
    content={close => <VStack gap={1}>
      <HStack paddingInline={2} paddingBlock={1}><Text type="supporting" color="secondary" weight="medium">{dayText(day)} · 일정 {list.length}개</Text></HStack>
      {list.map(each => <button key={each.id} type="button" className={styles.dayRow} data-color={each.color}
        onClick={() => { close(); address.go({ view: 'week', date: day, event: each.id }); }}>
        <span className={styles.dot} data-color={each.color} aria-hidden />
        <span className={styles.dayRowTime}>{each.time ?? '종일'}</span>
        <span className={styles.title}>{each.title}</span>
      </button>)}
    </VStack>} />
  </div>;
}
