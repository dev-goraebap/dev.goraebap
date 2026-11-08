import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { HStack } from '@astryxdesign/core/HStack';
import { Spinner } from '@astryxdesign/core/Spinner';
import { VStack } from '@astryxdesign/core/VStack';
import { AlertDialog } from '@kit/composites/dialog/AlertDialog';
import { PageState } from '@kit/composites/state/PageState';
import { icon } from '@kit/foundations/icons/solar-icon';
import { useIsPhone, useToolSize } from '@kit/foundations/media';
import { Page } from '@kit/layouts/page/Page';
import { PageBanner } from '@kit/layouts/page/PageParts';
import { PageViews } from '@kit/layouts/page/PageToolbar';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { addDays, addMonths, eventKeys, eventQueries, monthText, TODAY, useEventApi, weekText,
  type CalendarEvent, type DateKey, type NewEvent } from '../../entities/event';
import { useCalendarAddress, type CalendarView } from './address';
import { EventActionsContext } from './EventParts';
import { EventFormDialog } from './EventFormDialog';
import { DayAgenda, MonthCompact, MonthGrid, WeekAgenda, WeekColumns } from './Views';
import styles from './calendar.module.css';

const views = [{ id: 'month', label: '월', icon: 'layout-grid' as const }, { id: 'week', label: '주', icon: 'layout-board' as const }];

/**
 * 일정 화면. 머리 줄: 경로(보고 있는 기간)·일정 만들기. 툴바: 월·주 보기와 오늘·이전·다음. 보기·기준 날짜·열린 일정은 주소가
 * 가진다. 데스크톱은 날짜 격자에서 일정을 바로 보고 날짜 칸을 눌러 만들며, 휴대폰은 월 격자 아래에 고른 날의 목록을 둔다.
 * 상태 순서: 대기 → 실패(다시 시도). 일정이 하나도 없어도 격자는 그대로 보인다.
 */
export function CalendarPage() {
  const api = useEventApi();
  const client = useQueryClient();
  const isPhone = useIsPhone();
  const toolSize = useToolSize();
  const address = useCalendarAddress();
  const { view, date } = address;
  const query = useQuery(eventQueries.all(api));
  const events = useMemo(() => query.data ?? [], [query.data]);
  const [form, setForm] = useState<{ event?: CalendarEvent; date: DateKey } | null>(null);
  const [removing, setRemoving] = useState<CalendarEvent | null>(null);
  const refresh = () => client.invalidateQueries({ queryKey: eventKeys.all });
  const save = useMutation({
    mutationFn: ({ id, input }: { id?: string; input: NewEvent }) => (id ? api.update(id, input) : api.create(input)),
    onSuccess: async () => { await refresh(); setForm(null); },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: async () => { await refresh(); },
    onSettled: () => setRemoving(null),
  });
  const step = (direction: 1 | -1) => address.go({ date: view === 'month' ? addMonths(date, direction) : addDays(date, 7 * direction) });
  const unit = view === 'month' ? '달' : '주';
  const create = (day: DateKey) => { save.reset(); setForm({ date: day }); };
  const actions = useMemo(() => ({ onEdit: (event: CalendarEvent) => { save.reset(); setForm({ event, date: event.start }); }, onDelete: setRemoving }), [save]);

  const body = () => {
    if (query.isPending) return <Center height="100%"><Spinner label="일정을 불러오는 중" /></Center>;
    if (query.isError && !query.data) return <PageState kind="error" title="일정을 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
      action={<Button label="다시 시도" variant="secondary" onClick={() => void query.refetch()} />} />;
    if (!isPhone) return view === 'month' ? <MonthGrid date={date} events={events} onCreate={create} /> : <WeekColumns date={date} events={events} onCreate={create} />;
    if (view === 'week') return <WeekAgenda date={date} events={events} onCreate={create} />;
    return <VStack>
      <MonthCompact date={date} events={events} onPick={day => address.go({ date: day }, { replace: true })} />
      <DayAgenda day={date} events={events} onCreate={create} isSolo />
    </VStack>;
  };

  return <EventActionsContext value={actions}>
    <Page crumbs={[...(isPhone ? [] : [{ label: '일정', icon: 'calendar' as const, href: '/calendar' }]), { label: view === 'month' ? monthText(date) : weekText(date) }]}
      views={<PageViews views={views} value={view} onChange={id => address.go({ view: id as CalendarView })} />}
      tools={<HStack gap={1} vAlign="center">
        <Button label="오늘" variant="secondary" size={toolSize} onClick={() => address.go({ date: TODAY })} />
        <Button label={`이전 ${unit}`} tooltip={`이전 ${unit}`} variant="ghost" size={toolSize} isIconOnly icon={icon('back')} onClick={() => step(-1)} />
        <Button label={`다음 ${unit}`} tooltip={`다음 ${unit}`} variant="ghost" size={toolSize} isIconOnly icon={icon('forward')} onClick={() => step(1)} />
      </HStack>}
      create={{ label: '일정 만들기', onClick: () => create(date) }}>
      {remove.isError ? <PageBanner status="error" title="일정을 지우지 못했습니다" description="잠시 후 다시 시도해 주세요." /> : null}
      <div className={styles.body}>{body()}</div>
    </Page>
    {form ? <EventFormDialog key={form.event?.id ?? form.date} event={form.event} date={form.date} isPending={save.isPending}
      error={save.isError ? '저장하지 못했습니다. 입력은 그대로 두었으니 다시 시도해 주세요.' : undefined}
      onSubmit={input => save.mutate({ id: form.event?.id, input })} onClose={() => setForm(null)} /> : null}
    <AlertDialog isOpen={!!removing} onOpenChange={isOpen => { if (!isOpen) setRemoving(null); }} title="일정을 지울까요?"
      description={removing ? `“${removing.title}”을 지우면 되돌릴 수 없습니다.` : ''} actionLabel="지우기" isActionLoading={remove.isPending}
      onAction={() => removing && remove.mutate(removing.id)} />
  </EventActionsContext>;
}
