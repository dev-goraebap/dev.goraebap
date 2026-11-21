import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { cn } from 'cn';
import { draftOf, editWorkItem, refreshWorkItems, WorkItemStatusIcon, type ColumnCategory, type WorkItemRow } from '@/entities/work-item';
import { Button } from '@/shared/ui/kit/button';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { DetailLink } from '@/shared/ui/kit/detail-surface';
import { SegmentedControl } from '@/shared/ui/kit/segmented-control';

type Zoom = 'day' | 'week' | 'month';
const WIDTH: Record<Zoom, number> = { day: 36, week: 14, month: 5 };
const PAD: Record<Zoom, number> = { day: 7, week: 21, month: 60 };
const ZOOM_KEY = 'cowork.timeline-zoom';
const NAME_KEY = 'cowork.timeline-name-width';
const NAME_MIN = 160, NAME_MAX = 640, NAME_DEFAULT = 320;
const DAY = 86_400_000;

const seoul = (date: Date) => date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
const dayOf = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) / DAY;
const isoOf = (day: number) => new Date(day * DAY).toISOString().slice(0, 10);
/** Where a bar sits and how long it is, in the track's own units (days times the zoom's width). */
const place = (left: number, width: number): CSSProperties => ({ '--left': `${left}px`, '--width': `${width}px` } as CSSProperties);
const sheet = (width: number, name: number): CSSProperties => ({ '--span': `${width}px`, '--name': `${name}px` } as CSSProperties);

/** A plan bar's ink by what its status means: under way the accent, done the done mark, dropped or parked faint. */
const TONE: Partial<Record<ColumnCategory, string>> = {
  STARTED: '[--tone:var(--primary)]', COMPLETED: '[--tone:var(--mark-done)]', CANCELED: '[--tone:var(--mark-backlog)]', BACKLOG: '[--tone:var(--mark-backlog)]',
};
const ZOOMS = [{ value: 'day', label: '일' }, { value: 'week', label: '주' }, { value: 'month', label: '월' }] as const;
/** The days' marks over the track (months, then days or weeks), each at its day. */
const MARK = 'absolute left-(--left) w-max min-w-(--width) px-1 leading-6 whitespace-nowrap';

/** A work item's planned days (start to due, both included; one day when only one is set) and its actual ones. */
function daysOf(item: WorkItemRow, today: number) {
  const start = item.startDate ? dayOf(item.startDate) : item.dueDate ? dayOf(item.dueDate) : undefined;
  const end = item.dueDate ? dayOf(item.dueDate) : start;
  const startedAt = item.startedAt ? dayOf(seoul(new Date(item.startedAt))) : undefined;
  const closedAt = item.closedAt ? dayOf(seoul(new Date(item.closedAt))) : undefined;
  const actual = startedAt !== undefined ? { start: startedAt, end: closedAt ?? today } : undefined;
  return { plan: start !== undefined && end !== undefined ? { start, end } : undefined, actual };
}

type Drag = { id: string; mode: 'move' | 'start' | 'end'; x: number; shift: number };

/**
 * 타임라인 (Linear's, Plane's): each work item a row, its planned days a bar from the start to the due day and, under it,
 * the days it was actually under way (first under way to done, or to today). Days, weeks or months across, today marked.
 * A bar is carried to move its days or pulled at an end to change one; work items with no day are left out. The names'
 * column keeps its place while the days scroll, and its right edge is dragged to widen it.
 */
export function TimelineView({ workItems, hrefOf, showsProject, more }: {
  workItems: WorkItemRow[]; hrefOf?: (item: WorkItemRow) => string; showsProject?: boolean;
  more?: { hasMore: boolean; isLoading: boolean; onMore: () => void };
}) {
  const client = useQueryClient();
  const [zoom, setZoomState] = useState<Zoom>(() => { try { return (localStorage.getItem(ZOOM_KEY) as Zoom) || 'week'; } catch { return 'week'; } });
  const setZoom = (next: Zoom) => { setZoomState(next); try { localStorage.setItem(ZOOM_KEY, next); } catch { /* 이 화면에서만 */ } };
  const [drag, setDrag] = useState<Drag | null>(null);
  // 고정 열(업무 이름)의 폭: 오른쪽 끝을 끌어 바꾸고 이 브라우저에 기억한다.
  const [nameWidth, setNameWidth] = useState(() => {
    try { return Math.min(NAME_MAX, Math.max(NAME_MIN, Number(localStorage.getItem(NAME_KEY)) || NAME_DEFAULT)); } catch { return NAME_DEFAULT; }
  });
  // 휴대폰에서는 이름 열을 가장 좁게 둔다: 기본 폭(320px)이면 390px 화면에 막대가 놓일 자리가 남지 않는다.
  const isPhone = useIsMobile();
  const shownName = isPhone ? NAME_MIN : nameWidth;
  const resizing = useRef<{ x: number; width: number } | null>(null);
  const resize = {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      event.preventDefault();
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* 이미 놓은 포인터 */ }
      resizing.current = { x: event.clientX, width: nameWidth };
    },
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
      if (!resizing.current) return;
      setNameWidth(Math.min(NAME_MAX, Math.max(NAME_MIN, resizing.current.width + event.clientX - resizing.current.x)));
    },
    onPointerUp: () => {
      resizing.current = null;
      try { localStorage.setItem(NAME_KEY, String(nameWidth)); } catch { /* 이 화면에서만 */ }
    },
  };
  const [failure, setFailure] = useState<string>();
  const scroller = useRef<HTMLDivElement>(null);
  const today = dayOf(seoul(new Date()));
  const px = WIDTH[zoom];

  const { dated, first, last } = useMemo(() => {
    const rows = workItems.map(item => ({ item, ...daysOf(item, today) }));
    const dated = rows.filter(row => row.plan || row.actual)
      .sort((one, other) => (one.plan?.start ?? one.actual!.start) - (other.plan?.start ?? other.actual!.start));
    const edges = dated.flatMap(row => [row.plan?.start, row.plan?.end, row.actual?.start, row.actual?.end]).filter((day): day is number => day !== undefined);
    return {
      dated,
      first: Math.min(today, ...edges) - PAD[zoom], last: Math.max(today, ...edges) + PAD[zoom],
    };
  }, [workItems, today, zoom]);
  const days = last - first + 1;
  const x = (day: number) => (day - first) * px;

  // 처음 열 때와 배율을 바꿀 때 오늘을 왼쪽에서 3분의 1쯤에 둔다. 가로 폭이 잡힌 뒤에 한 번만.
  const placed = useRef<Zoom | null>(null);
  useLayoutEffect(() => {
    const box = scroller.current;
    if (!box || placed.current === zoom || box.scrollWidth <= box.clientWidth) return;
    box.scrollLeft = Math.max(0, x(today) - box.clientWidth / 3);
    placed.current = zoom;
  });
  // 타임라인은 날짜가 있는 업무를 모두 놓아야 한다: 남은 조각을 이어서 읽는다(1000건까지).
  useEffect(() => {
    if (more?.hasMore && !more.isLoading && workItems.length < 1000) more.onMore();
  }, [more?.hasMore, more?.isLoading, workItems.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const months: { day: number; label: string }[] = [];
  const ticks: { day: number; label: string }[] = [];
  for (let day = first; day <= last; day++) {
    const date = new Date(day * DAY);
    if (date.getUTCDate() === 1 || day === first)
      months.push({ day, label: date.toLocaleDateString('ko-KR', { timeZone: 'UTC', year: 'numeric', month: 'long' }) });
    if (zoom === 'day' || (zoom === 'week' && date.getUTCDay() === 1)) ticks.push({ day, label: String(date.getUTCDate()) });
  }

  const save = async (item: WorkItemRow, shift: number, mode: Drag['mode']) => {
    const startDate = item.startDate ? isoOf(dayOf(item.startDate) + (mode === 'end' ? 0 : shift)) : undefined;
    const dueDate = item.dueDate ? isoOf(dayOf(item.dueDate) + (mode === 'start' ? 0 : shift)) : undefined;
    if (startDate && dueDate && startDate > dueDate) return;
    setFailure(undefined);
    try {
      await editWorkItem(item, { ...draftOf(item), startDate, dueDate });
      await refreshWorkItems(client);
    } catch (error) {
      setFailure(error instanceof Error ? error.message : '날짜를 바꾸지 못했습니다.');
    }
  };
  const grab = (item: WorkItemRow, mode: Drag['mode']) => (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    try { (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId); } catch { /* 이미 놓은 포인터 */ }
    setDrag({ id: item.id, mode, x: event.clientX, shift: 0 });
  };
  const follow = (event: ReactPointerEvent<HTMLElement>) => {
    if (!drag) return;
    const shift = Math.round((event.clientX - drag.x) / px);
    if (shift !== drag.shift) setDrag({ ...drag, shift });
  };
  const drop = (item: WorkItemRow) => () => {
    if (!drag || drag.id !== item.id) return;
    const { shift, mode } = drag;
    setDrag(null);
    if (shift !== 0) void save(item, shift, mode);
  };

  return <div data-fit className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
    <div className="flex min-h-11 flex-none flex-wrap items-center justify-between gap-2 border-b px-3 py-1.5">
      <SegmentedControl label="배율" options={[...ZOOMS]} value={zoom} onChange={setZoom} />
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {failure ? <p role="alert" className="text-destructive">{failure}</p> : null}
        <p className="max-md:hidden">{more?.hasMore ? `${workItems.length}건까지 읽음 · 나머지를 읽는 중` : '막대를 끌어 날짜를 옮기고, 끝을 끌어 늘이거나 줄입니다.'}</p>
        <Button variant="secondary" size="sm" className="max-md:h-11" onClick={() => {
          const box = scroller.current;
          if (box) box.scrollTo({ left: Math.max(0, x(today) - box.clientWidth / 3), behavior: 'smooth' });
        }}>오늘</Button>
      </div>
    </div>
    <div ref={scroller} className="min-h-0 w-full min-w-0 flex-1 basis-0 overflow-auto overscroll-contain">
      {/* check-ui: allow-style 날짜 칸의 전체 폭과 이름 열의 폭은 날짜 수 · 배율과 끌어 정한 값이다. */}
      <div className="flex w-[calc(var(--name)_+_var(--span))] flex-col" style={sheet(days * px, shownName)}>
        <div className="sticky top-0 z-2 flex border-b bg-background">
          <div className="sticky left-0 z-1 flex flex-[0_0_var(--name)] flex-col justify-end border-r bg-background px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">업무 {dated.length}</span>
            <div role="separator" aria-orientation="vertical" aria-label="업무 이름 열 폭 조절" {...resize}
              className="absolute inset-y-0 -right-1 z-3 w-2 cursor-col-resize touch-none hover:bg-primary/35 max-md:hidden" />
          </div>
          <div className="flex flex-[0_0_var(--span)] flex-col text-xs text-muted-foreground">
            <div className="relative h-6">
              {/* check-ui: allow-style 달의 자리는 날짜에서 센 값이다. */}
              {months.map(month => <span key={month.day} className={MARK} style={place(x(month.day), 0)}>{month.label}</span>)}
            </div>
            <div className="relative h-6">
              {ticks.map(tick => <span key={tick.day} className={cn(MARK, 'px-0 text-center', tick.day === today && 'text-foreground')}
                // check-ui: allow-style 눈금의 자리는 날짜에서 센 값이다.
                style={place(x(tick.day), px)}>{tick.label}</span>)}
              {/* check-ui: allow-style 오늘 표시의 자리는 날짜에서 센 값이다. */}
              <span className="absolute top-0 left-(--left) translate-x-[calc(var(--width)/2_-_50%)] rounded-full bg-primary px-1.5 leading-6 font-semibold whitespace-nowrap text-primary-foreground" style={place(x(today), px)}>오늘</span>
            </div>
          </div>
        </div>
        <div className="relative flex flex-col">
          {/* check-ui: allow-style 오늘 선의 자리는 날짜에서 센 값이다. */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-[calc(var(--name)_+_var(--left))] z-1 w-px bg-primary opacity-60" style={place(x(today) + px / 2, 1)} />
          {dated.map(({ item, plan, actual }) => {
            const moving = drag?.id === item.id ? drag : null;
            const shiftStart = moving && moving.mode !== 'end' ? moving.shift : 0;
            const shiftEnd = moving && moving.mode !== 'start' ? moving.shift : 0;
            const title = `${item.ref} ${item.title}`;
            return <div key={item.id} className="group/row flex h-11 bg-background hover:bg-row-hover">
              <div className="sticky left-0 z-1 flex min-w-0 flex-[0_0_var(--name)] items-center gap-2 border-r bg-background px-3 text-sm group-hover/row:bg-row-hover">
                <WorkItemStatusIcon category={item.category} label={item.columnName} />
                <span className="text-xs text-muted-foreground tabular-nums">{showsProject ? item.ref : item.ref.split('-').pop()}</span>
                {hrefOf ? <DetailLink href={hrefOf(item)} className="min-w-0 flex-1 truncate">{item.title}</DetailLink>
                  : <span className="min-w-0 flex-1 truncate">{item.title}</span>}
              </div>
              <div className="relative flex-[0_0_var(--span)]">
                {plan ? <div data-moving={moving ? '' : undefined}
                  className={cn('absolute top-2 left-(--left) flex h-5.5 w-(--width) cursor-grab touch-none items-center overflow-hidden rounded-md border select-none',
                    'border-[color-mix(in_srgb,var(--tone)_55%,transparent)] bg-[color-mix(in_srgb,var(--tone)_22%,transparent)] [--tone:var(--icon-muted)]',
                    'data-moving:cursor-grabbing data-moving:shadow-md', TONE[item.category])}
                  // check-ui: allow-style 막대의 자리와 길이는 업무의 날짜에서 센 값이다.
                  style={place(x(plan.start + shiftStart), Math.max(px, (plan.end + shiftEnd - plan.start - shiftStart + 1) * px))}
                  aria-label={`${title} · ${item.startDate ?? ''}${item.startDate && item.dueDate ? ' ~ ' : ''}${item.dueDate ?? ''}`}
                  onPointerDown={grab(item, 'move')} onPointerMove={follow} onPointerUp={drop(item)} onPointerCancel={() => setDrag(null)}>
                  {/* 끝 손잡이의 움직임 · 놓기는 막대로 올라가 막대가 한 번만 받는다(손잡이에도 달면 놓기가 두 번 저장돼 409가 난다). */}
                  {item.startDate ? <div className="w-1.5 flex-none self-stretch cursor-ew-resize hover:bg-[color-mix(in_srgb,var(--tone)_45%,transparent)]"
                    onPointerDown={grab(item, 'start')} /> : null}
                  <span className="min-w-0 flex-1 truncate px-1.5 text-xs">{item.title}</span>
                  {item.dueDate ? <div className="w-1.5 flex-none self-stretch cursor-ew-resize hover:bg-[color-mix(in_srgb,var(--tone)_45%,transparent)]"
                    onPointerDown={grab(item, 'end')} /> : null}
                </div> : null}
                {actual ? <div data-open={item.closedAt ? undefined : ''} aria-label={`${title} · 실제로 진행한 기간`}
                  className="absolute top-8.5 left-(--left) h-1 w-(--width) rounded-full bg-muted-foreground opacity-55 data-open:bg-[repeating-linear-gradient(90deg,var(--muted-foreground)_0_0.375rem,transparent_0.375rem_0.625rem)]"
                  // check-ui: allow-style 실제 진행 기간의 자리와 길이는 업무의 기록에서 센 값이다.
                  style={place(x(actual.start), Math.max(px / 2, (actual.end - actual.start + 1) * px))} /> : null}
              </div>
            </div>;
          })}
        </div>
      </div>
    </div>
  </div>;
}
