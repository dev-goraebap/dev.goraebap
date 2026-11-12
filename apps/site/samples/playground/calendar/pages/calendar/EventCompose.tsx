import { useDraft } from '@/shared/lib/draft';
import { focusFirstInvalid } from '@/shared/lib/focus-invalid';
import { ComposeSurface } from '@/shared/ui/compose';
import { CalendarIcon, ClockIcon, TagIcon } from '@/shared/ui/icon';
import { Input } from '@/shared/ui/input';
import { PageState } from '@/shared/ui/page-state';
import { DatePill, OptionPill } from '@/shared/ui/property-pill';
import { Spinner } from '@/shared/ui/spinner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useReducer, useState } from 'react';
import { colors, dayText, eventKeys, eventQueries, eventTone, TODAY, useEventApi, type CalendarEvent, type DateKey, type NewEvent } from '../../entities/event';

const ALL_DAY = 'all-day';
const times = [{ value: ALL_DAY, label: '종일' }, ...Array.from({ length: 48 }, (_, index) => {
  const time = `${String(Math.floor(index / 2)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`;
  return { value: time, label: time };
})];

type Props = { id?: string; date?: DateKey; surface: 'page' | 'dialog'; onClose: () => void; onExpand?: () => void; onDone: (id: string) => void };

/**
 * 일정 만들기 · 수정. 고칠 일정이 있으면 읽은 뒤 양식을 그린다. 데스크톱 격자에서는 대화상자, 주소로 열거나 휴대폰이면 자기 페이지다.
 */
export function EventCompose({ id, date = TODAY, ...props }: Props) {
  const api = useEventApi();
  const query = useQuery(eventQueries.all(api));
  if (id && query.isPending) return <div className="flex flex-1 items-center justify-center"><Spinner aria-label="일정을 불러오는 중" className="size-6" /></div>;
  const event = query.data?.find(each => each.id === id);
  if (id && !event) return <PageState kind={query.isError ? 'error' : 'not-found'} title="일정을 열 수 없습니다" />;
  return <EventFields key={id ?? date} event={event} date={date} {...props} />;
}

/**
 * 양식: 제목(필수)과 장소, 그 아래 속성 알약(시작일 · 종료일 · 시작 시각 · 색). 제출은 막지 않고, 누르면 빠진 칸 곁에 알리고 첫 칸으로 간다.
 * 날짜 오류는 알약 묶음의 일이라 바닥 줄의 까닭 자리에 둔다. 쓰던 값은 초안이 지켜 대화상자 ↔ 페이지(크게 보기)를 오가도 남는다.
 */
function EventFields({ event, date, surface, onClose, onExpand, onDone }: Omit<Props, 'id' | 'date'> & { event?: CalendarEvent; date: DateKey }) {
  const api = useEventApi();
  const client = useQueryClient();
  const initial: NewEvent = { title: event?.title ?? '', place: event?.place ?? '', start: event?.start ?? date, end: event?.end ?? date, color: event?.color ?? 'blue', time: event?.time };
  const [draft, setDraft, clear] = useDraft<NewEvent>(`calendar:${event?.id ?? 'new'}`, initial);
  // 키트 DraftProvider는 맥락 값을 고정해(useMemo) 초안을 바꿔도 이 양식이 다시 그려지지 않는다. 고칠 때까지 스스로 다시 그린다.
  const [, redraw] = useReducer((count: number) => count + 1, 0);
  const set = (patch: Partial<NewEvent>) => { setDraft({ ...draft, ...patch }); redraw(); };
  const [isTried, setTried] = useState(false);
  const save = useMutation({
    mutationFn: () => (event ? api.update(event.id, draft) : api.create(draft)),
    onSuccess: async saved => { await client.invalidateQueries({ queryKey: eventKeys.all }); clear(); onDone(saved.id); },
  });
  const isDateInvalid = !draft.start || !draft.end || draft.end < draft.start;
  const isTitleMissing = isTried && !draft.title.trim();
  const submit = () => {
    setTried(true);
    if (!draft.title.trim() || isDateInvalid) { focusFirstInvalid(); return; }
    save.mutate();
  };
  const close = () => { clear(); onClose(); };
  const error = isTried && isDateInvalid ? '종료일은 시작일과 같거나 뒤여야 합니다.'
    : save.isError ? '저장하지 못했습니다. 입력은 그대로 남아 있습니다.' : undefined;
  return (
    <ComposeSurface surface={surface} crumbs={[{ label: '일정', href: '/calendar', icon: CalendarIcon }, { label: event ? '일정 수정' : '일정 만들기' }]}
      onClose={close} onExpand={onExpand} error={error} submit={{ label: event ? '저장' : '추가', onSubmit: submit, isPending: save.isPending }}
      pills={<>
        <DatePill label="시작일" value={draft.start || undefined} format={dayText}
          onChange={start => set({ start: start ?? '', end: start && (!draft.end || draft.end < start) ? start : draft.end })} />
        <DatePill label="종료일" value={draft.end || undefined} format={dayText} onChange={end => set({ end: end ?? '' })} />
        <OptionPill label="시작 시각" icon={ClockIcon} value={draft.time ?? ALL_DAY} options={times} onChange={time => set({ time: time === ALL_DAY ? undefined : time })} />
        <OptionPill label="색" icon={TagIcon} value={draft.color} onChange={color => set({ color })}
          options={colors.map(each => ({ value: each.id, label: each.label, icon: <span aria-hidden className={`${eventTone[each.id]} size-2.5 rounded-full bg-(--event-ink)`} /> }))} />
      </>}>
      <div className="flex flex-col gap-1">
        <input aria-label="제목" placeholder="일정 제목" autoFocus autoComplete="off" value={draft.title} onChange={change => set({ title: change.target.value })}
          aria-invalid={isTitleMissing || undefined} aria-describedby={isTitleMissing ? 'event-title-error' : undefined}
          className="w-full bg-transparent text-lg leading-snug font-semibold outline-none placeholder:text-muted-foreground/70 group-data-page/compose:text-2xl aria-invalid:shadow-[0_2px_0_-1px_var(--destructive)]" />
        {isTitleMissing ? <p id="event-title-error" role="alert" className="text-sm text-destructive">제목을 입력해 주세요.</p> : null}
      </div>
      <Input aria-label="장소 (선택)" placeholder="장소 (선택)" value={draft.place ?? ''} onChange={change => set({ place: change.target.value })} className="max-md:h-11 max-md:text-base" />
    </ComposeSurface>
  );
}
