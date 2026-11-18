import { cn } from 'cn';
import { AdaptivePopover } from '@/shared/ui/kit/adaptive-popover';
import { useOpenPanel } from '@/shared/lib/panel';
import { MenuItem } from '@/shared/ui/kit/menu-item';
import { useState, type CSSProperties } from 'react';
import { dayText, eventsOn, eventTone, whenText, type CalendarEvent, type DateKey } from '../../entities/event';

/** 일정의 자기 주소. 데스크톱에서는 격자 위 대화상자로, 휴대폰 · 새로고침 · 직접 링크는 그 페이지로 연다. */
export const eventHref = (id: string) => `/calendar/events/${id}`;

export type EventVariant = 'bar' | 'card' | 'row';

/** 일정의 색 점. 옆에 이름이 있으므로 읽지 않는다. */
export function EventDot({ event, className }: { event: CalendarEvent; className?: string }) {
  return <span aria-hidden className={cn(eventTone[event.color], 'size-2 shrink-0 rounded-full bg-(--event-ink)', className)} />;
}

/** 표식의 바탕: 가리키면 조금 진해진다. 키보드로 고르면 고리. */
const FILL = 'bg-(--event-fill) text-(--event-ink) hover:bg-[color-mix(in_srgb,var(--event-fill)_85%,var(--foreground))] outline-none focus-visible:ring-2 focus-visible:ring-ring';

/**
 * 일정 하나: 누르면 요약 팝오버 없이 바로 그 일정의 상세가 열린다(Routed Modal). 데스크톱은 격자 위 대화상자(주소창에는 일정의
 * 주소), 휴대폰은 일정의 페이지다. 막대(bar)는 월 격자, 카드(card)는 주 보기, 행(row)은 휴대폰 목록이다.
 */
export function EventPopover({ event, variant, day, style, continuesBefore, continuesAfter }: {
  event: CalendarEvent; variant: EventVariant; day?: DateKey; style?: CSSProperties; continuesBefore?: boolean; continuesAfter?: boolean;
}) {
  const open = useOpenPanel();
  const time = event.time ?? (variant === 'row' || variant === 'card' ? '종일' : undefined);
  const isResumed = variant === 'card' && day && event.start < day;
  const look = {
    bar: cn('relative z-1 mx-1 my-px flex h-5 min-w-0 items-center gap-1 rounded-sm px-1.5 text-left text-xs font-medium',
      continuesBefore && 'ml-0 rounded-l-none', continuesAfter && 'mr-0 rounded-r-none'),
    card: 'pointer-events-auto flex w-full min-w-0 flex-col gap-0.5 rounded-md border border-[color-mix(in_srgb,var(--event-ink)_20%,transparent)] p-2 text-left text-xs shadow-xs',
    row: 'grid min-h-14 w-full grid-cols-[3.5rem_minmax(0,1fr)] items-baseline gap-x-3 border-t bg-background px-4 py-3 text-left text-foreground shadow-[inset_0.25rem_0_0_var(--event-ink)] first:border-t-0 hover:bg-row-hover',
  }[variant];
  return (
    // check-ui: allow-style 일정마다 계산한 격자 위치다.
    <div className={cn(eventTone[event.color], 'flex min-w-0', variant === 'card' && 'pointer-events-auto')} style={style}>
      <button type="button" aria-label={`${event.title}, ${whenText(event)}`} onClick={() => open(eventHref(event.id))}
        className={cn(variant !== 'row' && FILL, look, 'min-w-0 flex-1 cursor-pointer')}>
        {variant === 'row' ? <span className="text-sm text-muted-foreground tabular-nums">{time}</span> : null}
        {variant === 'card' ? <span className="tabular-nums opacity-80">{isResumed ? '이어서' : time}</span> : null}
        {variant === 'bar' && event.time ? <span className="shrink-0 tabular-nums opacity-80">{event.time}</span> : null}
        <span className={cn('min-w-0 truncate', variant === 'card' && 'font-semibold whitespace-normal', variant === 'row' && 'font-medium')}>{event.title}</span>
        {variant === 'row' && event.place ? <span className="col-start-2 text-sm text-muted-foreground">{event.place}</span> : null}
      </button>
    </div>
  );
}

/**
 * 한 칸에 다 담지 못한 일정을 "+3"으로 묶는다. 누르면 그 날의 일정 전체를 곁에 펼치고, 하나를 고르면 그 일정의 상세가 열린다.
 */
export function MoreEvents({ day, hidden, events, style }: { day: DateKey; hidden: number; events: CalendarEvent[]; style?: CSSProperties }) {
  const open = useOpenPanel();
  const [isOpen, setOpen] = useState(false);
  const list = eventsOn(events, day);
  return (
    // check-ui: allow-style 그 날 칸의 마지막 줄 자리다.
    <div className="relative z-1 mx-1 flex min-w-0" style={style}>
      <AdaptivePopover title={`${dayText(day)} 일정`} open={isOpen} onOpenChange={setOpen} className="w-72 p-1.5"
        trigger={<button type="button" aria-label={`+${hidden}개 더 보기, ${dayText(day)}`}
          className="h-5 rounded-sm px-1.5 text-xs font-semibold text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">+{hidden}</button>}>
        <div className="flex flex-col">
          <p className="px-2 py-1 text-xs font-medium text-muted-foreground">{dayText(day)} · 일정 {list.length}개</p>
          {list.map(each => (
            <MenuItem key={each.id} onClick={() => { setOpen(false); open(eventHref(each.id)); }}>
              <EventDot event={each} />
              <span className="w-11 shrink-0 text-left text-muted-foreground tabular-nums">{each.time ?? '종일'}</span>
              <span className="min-w-0 truncate">{each.title}</span>
            </MenuItem>
          ))}
        </div>
      </AdaptivePopover>
    </div>
  );
}
