import { useOpenPanel, usePanel } from '@/shared/lib/panel';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { cn } from 'cn';
import { Alert, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, LayoutGridIcon, RowsIcon, TriangleAlertIcon } from '@/shared/ui/icon';
import { Page, PageViews } from '@/shared/ui/page';
import { PageState } from '@/shared/ui/page-state';
import { Spinner } from '@/shared/ui/spinner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { addDays, addMonths, eventKeys, eventQueries, monthText, TODAY, useEventApi, weekText, type CalendarEvent, type DateKey } from '../../entities/event';
import { useCalendarAddress, type CalendarView } from './address';
import { EventCompose } from './EventCompose';
import { EventActionsContext } from './EventParts';
import { DayAgenda, MonthCompact, MonthGrid, WeekAgenda, WeekColumns } from './Views';

const views = [{ value: 'month' as const, label: '월', icon: LayoutGridIcon }, { value: 'week' as const, label: '주', icon: RowsIcon }];

/**
 * 일정 화면. 머리 줄: 경로(보고 있는 기간) · 일정 만들기. 툴바: 월 · 주 보기와 기준 날짜 · 오늘 · 이전 · 다음. 보기 · 기준 날짜 · 열린 일정은
 * 주소가 가진다. 데스크톱은 날짜 격자에서 일정을 바로 보고 날짜 칸을 눌러 만들며, 휴대폰은 월 격자 아래에 고른 날의 목록을 둔다.
 * 만들기 · 수정은 데스크톱에서 격자 위 대화상자(주소창에는 작성 페이지 주소: 라우트 마스킹), 휴대폰은 그 페이지로 간다.
 * 상태 순서: 대기 → 실패(다시 시도). 일정이 하나도 없어도 격자는 그대로 보인다.
 */
export function CalendarPage() {
  const open = useOpenPanel();
  const panel = usePanel();
  const api = useEventApi();
  const client = useQueryClient();
  const isMobile = useIsMobile();
  const address = useCalendarAddress();
  const { view, date } = address;
  const query = useQuery(eventQueries.all(api));
  const events = useMemo(() => query.data ?? [], [query.data]);
  const [removing, setRemoving] = useState<CalendarEvent | null>(null);
  const remove = useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => client.invalidateQueries({ queryKey: eventKeys.all }),
    onSettled: () => setRemoving(null),
  });
  const step = (direction: 1 | -1) => address.go({ date: view === 'month' ? addMonths(date, direction) : addDays(date, 7 * direction) });
  const unit = view === 'month' ? '달' : '주';
  const create = (day: DateKey) => open(`/calendar/new?date=${day}`);
  const actions = useMemo(() => ({ onEdit: (event: CalendarEvent) => open(`/calendar/events/${event.id}/edit`), onDelete: setRemoving }), [open]);
  const editing = panel.pathname?.match(/^\/calendar\/events\/([^/]+)\/edit$/)?.[1];
  const panelDate = typeof panel.search.date === 'string' ? panel.search.date as DateKey : date;

  const body = () => {
    if (query.isPending) return <div className="flex flex-1 items-center justify-center"><Spinner aria-label="일정을 불러오는 중" className="size-6" /></div>;
    if (query.isError && !query.data) return <PageState kind="error" title="일정을 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
      action={<Button variant="secondary" onClick={() => void query.refetch()}>다시 시도</Button>} />;
    if (!isMobile) return view === 'month' ? <MonthGrid date={date} events={events} onCreate={create} /> : <WeekColumns date={date} events={events} onCreate={create} />;
    if (view === 'week') return <WeekAgenda date={date} events={events} onCreate={create} />;
    return (
      <div className="flex flex-col pb-20">
        <MonthCompact date={date} events={events} onPick={day => address.go({ date: day }, { replace: true })} />
        <DayAgenda day={date} events={events} onCreate={create} isSolo />
      </div>
    );
  };

  return (
    <EventActionsContext value={actions}>
      <Page crumbs={[...(isMobile ? [] : [{ label: '일정', icon: CalendarIcon, href: '/calendar' }]), { label: view === 'month' ? monthText(date) : weekText(date) }]}
        views={<PageViews label="일정 보기" views={views} value={view} onChange={(next: CalendarView) => address.go({ view: next })} isCompact={isMobile} />}
        tools={
          <div className="flex items-center gap-1">
            <span className="pr-1 text-sm text-muted-foreground tabular-nums max-md:hidden">{date.replaceAll('-', '.')}</span>
            <Button variant="view" className="px-3 max-md:h-11 max-md:px-4" onClick={() => address.go({ date: TODAY })}>오늘</Button>
            <Button variant="view" size="icon" aria-label={`이전 ${unit}`} title={`이전 ${unit}`} className="max-md:size-11" onClick={() => step(-1)}><ChevronLeftIcon /></Button>
            <Button variant="view" size="icon" aria-label={`다음 ${unit}`} title={`다음 ${unit}`} className="max-md:size-11" onClick={() => step(1)}><ChevronRightIcon /></Button>
          </div>
        }
        below={remove.isError ? (
          <Alert variant="destructive" className="shrink-0 rounded-none border-x-0 border-t-0"><TriangleAlertIcon /><AlertTitle>일정을 지우지 못했습니다. 잠시 후 다시 시도해 주세요.</AlertTitle></Alert>
        ) : undefined}
        create={{ label: '일정 만들기', onClick: () => create(date) }}>
        <div className={cn('flex flex-1 flex-col', !isMobile && view === 'month' && 'min-h-0')}>{body()}</div>
      </Page>
      {panel.href ? <EventCompose key={panel.href} surface="dialog" id={editing} date={panelDate} onClose={panel.close} onExpand={panel.expand} onDone={() => panel.close()} /> : null}
      <ConfirmDialog open={!!removing} onOpenChange={isOpen => { if (!isOpen) setRemoving(null); }} title="일정을 지울까요?"
        description={removing ? `“${removing.title}”을 지우면 되돌릴 수 없습니다.` : ''}
        action={{ label: '지우기', isPending: remove.isPending, onAction: () => { if (removing) remove.mutate(removing.id); } }} />
    </EventActionsContext>
  );
}
