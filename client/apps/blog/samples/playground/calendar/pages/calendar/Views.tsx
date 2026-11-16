import type { CSSProperties, ReactNode } from 'react';
import { cn } from 'cn';
import { Button } from '@/shared/ui/button';
import { PlusIcon } from '@/shared/ui/icon';
import { PageState } from '@/shared/ui/page-state';
import { dayText, eventsOn, fromKey, layoutWeek, monthText, monthWeeks, TODAY, weekdayNames, weekOf, type CalendarEvent, type DateKey } from '../../entities/event';
import { EventDot, EventPopover, MoreEvents } from './EventParts';

/** 월 격자 한 칸에 겹쳐 보이는 일정 줄 수. 넘치면 "+N"으로 묶는다. */
const MAX_LANES = 3;

type ViewProps = { date: DateKey; events: CalendarEvent[]; onCreate: (day: DateKey) => void };

/** 날짜 숫자. 오늘은 강조색 원. */
function DayNumber({ day, children }: { day: DateKey; children?: ReactNode }) {
  return (
    <span className={cn('inline-grid h-6 min-w-6 place-items-center rounded-full px-1 text-xs font-semibold tabular-nums',
      day === TODAY && 'bg-primary text-primary-foreground')}>
      {children ?? fromKey(day).getDate()}
    </span>
  );
}

const weekdayTone = (index: number) => (index === 0 ? 'text-day-off' : index === 6 ? 'text-saturday' : 'text-muted-foreground');

function Weekdays() {
  return (
    <ol aria-hidden className="grid shrink-0 grid-cols-7 border-b">
      {weekdayNames.map((name, index) => <li key={name} className={cn('py-2 text-center text-xs font-semibold', weekdayTone(index))}>{name}</li>)}
    </ol>
  );
}

/** 격자 자리. check-ui: allow-style 일정마다 계산한 칸과 줄이다. */
const at = (column: number, row: number | string, span = 1): CSSProperties => ({ gridColumn: `${column} / span ${span}`, gridRow: row });

/**
 * 데스크톱 월 보기. 한 주가 7열 격자 한 줄이고 주들이 본문 높이를 나눈다. 날짜 칸은 칸 전체가 "그 날 일정 만들기" 버튼이고, 일정 막대는
 * 같은 격자의 열과 줄에 겹쳐 놓는다. 여러 날 일정은 열을 이어서 차지하고, 줄 수를 넘는 일정은 "+N"으로 묶는다.
 */
export function MonthGrid({ date, events, onCreate }: ViewProps) {
  const month = date.slice(0, 7);
  return (
    <section aria-label={monthText(date)} className="flex min-h-0 flex-1 flex-col bg-background">
      <Weekdays />
      <div className="flex min-h-0 flex-1 flex-col">
        {monthWeeks(date).map(week => {
          const { segments, hidden } = layoutWeek(week, events, MAX_LANES);
          return (
            <div key={week[0]} role="group" aria-label={`${dayText(week[0])}부터 한 주`}
              className="relative grid min-h-28 flex-1 grid-cols-7 grid-rows-[1.875rem_repeat(3,1.375rem)_1.375rem_1fr] border-b last:border-b-0">
              {week.map((day, index) => (
                <button key={day} type="button" style={at(index + 1, '1 / -1')} aria-label={`${dayText(day)} 일정 만들기`} onClick={() => onCreate(day)}
                  className={cn('flex items-start border-l px-1.5 pt-1 text-left outline-none first:border-l-0 hover:bg-row-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                    !day.startsWith(month) && 'text-muted-foreground/60')}>
                  <DayNumber day={day}>{fromKey(day).getDate() === 1 ? `${fromKey(day).getMonth() + 1}월 1일` : undefined}</DayNumber>
                </button>
              ))}
              {segments.map(segment => (
                <EventPopover key={segment.event.id} event={segment.event} variant="bar" style={at(segment.column, segment.lane + 2, segment.span)}
                  continuesBefore={segment.continuesBefore} continuesAfter={segment.continuesAfter} />
              ))}
              {week.map((day, index) => hidden[index] > 0
                ? <MoreEvents key={day} day={day} hidden={hidden[index]} events={events} style={at(index + 1, MAX_LANES + 2)} />
                : null)}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * 데스크톱 주 보기. 날짜마다 한 열이고 그 날의 일정을 시각 순으로 모두 보인다(줄 수 제한 없음). 열의 빈 곳을 누르면 그 날
 * 일정 만들기다.
 */
export function WeekColumns({ date, events, onCreate }: ViewProps) {
  return (
    <div className="grid min-h-full flex-1 grid-cols-7 bg-background">
      {weekOf(date).map(day => (
        <div key={day} className={cn('relative flex min-w-0 flex-col border-l first:border-l-0', day === TODAY && 'bg-pressed')}>
          <button type="button" aria-label={`${dayText(day)} 일정 만들기`} onClick={() => onCreate(day)}
            className="absolute inset-0 outline-none hover:bg-row-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset" />
          <div className="pointer-events-none relative flex items-center gap-2 px-2 pt-3 pb-2">
            <span className={cn('text-xs font-semibold', weekdayTone(fromKey(day).getDay()))}>{weekdayNames[fromKey(day).getDay()]}</span>
            <DayNumber day={day} />
          </div>
          <div className="pointer-events-none relative flex flex-col gap-1 px-2 pb-4">
            {eventsOn(events, day).map(each => <EventPopover key={each.id} event={each} variant="card" day={day} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

/** 휴대폰 월 보기의 날짜 격자: 날짜 숫자와 일정 점. 날짜를 누르면 그 날이 골라지고 아래 목록이 바뀐다. 칸은 44px 이상이다. */
export function MonthCompact({ date, events, onPick }: { date: DateKey; events: CalendarEvent[]; onPick: (day: DateKey) => void }) {
  const month = date.slice(0, 7);
  return (
    <section aria-label={monthText(date)} className="flex flex-col border-b bg-background">
      <Weekdays />
      {monthWeeks(date).map(week => (
        <div key={week[0]} className="grid grid-cols-7">
          {week.map(day => {
            const list = eventsOn(events, day);
            const isPicked = day === date;
            return (
              <button key={day} type="button" aria-pressed={isPicked} aria-label={`${dayText(day)}${list.length ? `, 일정 ${list.length}개` : ''}`} onClick={() => onPick(day)}
                className={cn('flex min-h-12 flex-col items-center gap-0.5 pt-1.5 pb-1 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                  !day.startsWith(month) && 'text-muted-foreground/60')}>
                <span className={cn('rounded-full', isPicked && day !== TODAY && 'bg-muted ring-1 ring-border')}><DayNumber day={day} /></span>
                <span aria-hidden className="flex h-2 gap-0.5">{list.slice(0, 3).map(each => <EventDot key={each.id} event={each} className="size-1.5" />)}</span>
              </button>
            );
          })}
        </div>
      ))}
    </section>
  );
}

/** 하루의 일정 목록(휴대폰). 한 날만 보이는 월 보기(isSolo)에서 비면 빈 상태 화면과 만들기를 둔다. */
export function DayAgenda({ day, events, onCreate, isSolo = false }: { day: DateKey; events: CalendarEvent[]; onCreate: (day: DateKey) => void; isSolo?: boolean }) {
  const list = eventsOn(events, day);
  return (
    <section aria-label={dayText(day)} className="flex flex-col">
      <div className="flex items-center justify-between border-b bg-muted px-4 py-1">
        <h2 className="text-sm font-semibold">{dayText(day)}{day === TODAY ? ' · 오늘' : ''}</h2>
        <Button variant="ghost" size="icon" aria-label={`${dayText(day)} 일정 만들기`} title="일정 만들기" className="size-11" onClick={() => onCreate(day)}><PlusIcon /></Button>
      </div>
      {list.length
        ? <div className="flex flex-col border-b">{list.map(each => <EventPopover key={each.id} event={each} variant="row" day={day} />)}</div>
        : isSolo
          ? <PageState kind="empty" isCompact title="이 날은 일정이 없습니다" description="새 일정을 만들어 보세요."
            action={<Button variant="secondary" className="h-11" onClick={() => onCreate(day)}><PlusIcon data-icon="inline-start" />일정 만들기</Button>} />
          : <p className="border-b bg-background px-4 py-3 text-sm text-muted-foreground">일정이 없습니다</p>}
    </section>
  );
}

/** 휴대폰 주 보기: 한 주의 날짜를 위에서 아래로 나열한다. */
export function WeekAgenda({ date, events, onCreate }: ViewProps) {
  return <div className="flex flex-col">{weekOf(date).map(day => <DayAgenda key={day} day={day} events={events} onCreate={onCreate} />)}</div>;
}
