import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { PageState } from '@/shared/ui/composites/state/PageState';
import { icon } from '@/shared/ui/foundations/icons/solar-icon';
import { dayText, eventsOn, layoutWeek, monthText, monthWeeks, TODAY, weekdayNames, weekOf, fromKey,
  type CalendarEvent, type DateKey } from '../../entities/event';
import { EventPopover, MoreEvents } from './EventParts';
import styles from './calendar.module.css';

/** 월 격자 한 칸에 겹쳐 보이는 일정 줄 수. 넘치면 "+N"으로 묶는다. */
const MAX_LANES = 3;

type ViewProps = { date: DateKey; events: CalendarEvent[]; onCreate: (day: DateKey) => void };

const Weekdays = () => <div className={styles.weekdays}>
  {weekdayNames.map((name, index) => <Text key={name} type="supporting" color="secondary" weight="medium" className={styles.weekday} data-weekend={index === 0 || index === 6 || undefined}>{name}</Text>)}
</div>;

/**
 * 데스크톱 월 보기. 한 주가 7열 격자 한 줄이다. 날짜 칸은 칸 전체가 "그 날 일정 만들기" 버튼이고, 일정 막대는 같은 격자의
 * 열과 줄에 겹쳐 놓는다. 여러 날 일정은 열을 이어서 차지하고, 줄 수를 넘는 일정은 "+N"으로 묶는다.
 */
export function MonthGrid({ date, events, onCreate }: ViewProps) {
  const month = date.slice(0, 7);
  return <div className={styles.month} aria-label={monthText(date)}>
    <Weekdays />
    {monthWeeks(date).map(week => {
      const { segments, hidden } = layoutWeek(week, events, MAX_LANES);
      return <div key={week[0]} className={styles.week} role="group" aria-label={`${dayText(week[0])}부터 한 주`}>
        {week.map((day, index) => <button key={day} type="button" className={styles.cell} style={{ gridColumn: index + 1 }}
          data-today={day === TODAY || undefined} data-outside={!day.startsWith(month) || undefined}
          aria-label={`${dayText(day)} 일정 만들기`} onClick={() => onCreate(day)}>
          <span className={styles.number}>{fromKey(day).getDate() === 1 ? `${fromKey(day).getMonth() + 1}월 1일` : fromKey(day).getDate()}</span>
        </button>)}
        {segments.map(segment => <EventPopover key={segment.event.id} event={segment.event} variant="bar"
          style={{ gridColumn: `${segment.column} / span ${segment.span}`, gridRow: segment.lane + 2 }}
          continuesBefore={segment.continuesBefore} continuesAfter={segment.continuesAfter} />)}
        {week.map((day, index) => hidden[index] > 0
          ? <MoreEvents key={day} day={day} hidden={hidden[index]} events={events} style={{ gridColumn: index + 1, gridRow: MAX_LANES + 2 }} />
          : null)}
      </div>;
    })}
  </div>;
}

/**
 * 데스크톱 주 보기. 날짜마다 한 열이고 그 날의 일정을 시각 순으로 모두 보인다(줄 수 제한 없음). 열의 빈 곳을 누르면 그 날
 * 일정 만들기다.
 */
export function WeekColumns({ date, events, onCreate }: ViewProps) {
  return <div className={styles.weekView}>
    {weekOf(date).map(day => <div key={day} className={styles.column} data-today={day === TODAY || undefined}>
      <button type="button" className={styles.columnButton} aria-label={`${dayText(day)} 일정 만들기`} onClick={() => onCreate(day)} />
      <HStack className={styles.columnHead} gap={2} vAlign="center">
        <Text type="supporting" color="secondary" weight="medium">{weekdayNames[fromKey(day).getDay()]}</Text>
        <span className={styles.number} data-today={day === TODAY || undefined}>{fromKey(day).getDate()}</span>
      </HStack>
      <VStack className={styles.columnBody} gap={1}>
        {eventsOn(events, day).map(each => <EventPopover key={each.id} event={each} variant="card" day={day} />)}
      </VStack>
    </div>)}
  </div>;
}

/** 휴대폰 월 보기의 날짜 격자: 날짜 숫자와 일정 점. 날짜를 누르면 그 날이 골라지고 아래 목록이 바뀐다. */
export function MonthCompact({ date, events, onPick }: { date: DateKey; events: CalendarEvent[]; onPick: (day: DateKey) => void }) {
  const month = date.slice(0, 7);
  return <div className={styles.compact} aria-label={monthText(date)}>
    <Weekdays />
    {monthWeeks(date).map(week => <div key={week[0]} className={styles.compactWeek}>
      {week.map(day => {
        const list = eventsOn(events, day);
        return <button key={day} type="button" className={styles.compactCell} aria-pressed={day === date}
          data-today={day === TODAY || undefined} data-outside={!day.startsWith(month) || undefined}
          aria-label={`${dayText(day)}${list.length ? `, 일정 ${list.length}개` : ''}`} onClick={() => onPick(day)}>
          <span className={styles.number} data-today={day === TODAY || undefined}>{fromKey(day).getDate()}</span>
          <span className={styles.dots} aria-hidden>{list.slice(0, 3).map(each => <span key={each.id} className={styles.dot} data-color={each.color} />)}</span>
        </button>;
      })}
    </div>)}
  </div>;
}

/** 하루의 일정 목록(휴대폰). 한 날만 보이는 월 보기(isSolo)에서 비면 빈 상태 화면과 만들기를 둔다. */
export function DayAgenda({ day, events, onCreate, isSolo = false }: { day: DateKey; events: CalendarEvent[]; onCreate: (day: DateKey) => void; isSolo?: boolean }) {
  const list = eventsOn(events, day);
  return <section className={styles.agenda} aria-label={dayText(day)}>
    <HStack className={styles.agendaHead} hAlign="between" vAlign="center">
      <Text weight="semibold" data-today={day === TODAY || undefined}>{dayText(day)}{day === TODAY ? ' · 오늘' : ''}</Text>
      <Button label={`${dayText(day)} 일정 만들기`} tooltip="일정 만들기" variant="ghost" size="sm" isIconOnly icon={icon('plus')} onClick={() => onCreate(day)} />
    </HStack>
    {list.length
      ? <VStack className={styles.agendaList}>{list.map(each => <EventPopover key={each.id} event={each} variant="row" day={day} />)}</VStack>
      : isSolo
        ? <PageState kind="empty" isCompact title="이 날은 일정이 없습니다" description="새 일정을 만들어 보세요."
          action={<Button label="일정 만들기" variant="secondary" icon={icon('plus')} onClick={() => onCreate(day)} />} />
        : <Text className={styles.agendaEmpty} type="supporting" color="secondary">일정이 없습니다</Text>}
  </section>;
}

/** 휴대폰 주 보기: 한 주의 날짜를 위에서 아래로 나열한다. */
export function WeekAgenda({ date, events, onCreate }: ViewProps) {
  return <VStack>{weekOf(date).map(day => <DayAgenda key={day} day={day} events={events} onCreate={onCreate} />)}</VStack>;
}
