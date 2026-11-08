import { DateInput } from '@astryxdesign/core/DateInput';
import { Grid } from '@astryxdesign/core/Grid';
import { Selector } from '@astryxdesign/core/Selector';
import { TextInput } from '@astryxdesign/core/TextInput';
import { FormDialog } from '@kit/composites/dialog/FormDialog';
import { focusFirstInvalid } from '@kit/patterns/compose/validation';
import { useState } from 'react';
import { colors, dayText, type CalendarEvent, type DateKey, type EventColor, type NewEvent } from '../../entities/event';

const ALL_DAY = 'all-day';
/** 30분 간격 시작 시각. 종일이 맨 앞. */
const timeOptions = [{ value: ALL_DAY, label: '종일' }, ...Array.from({ length: 36 }, (_, index) => {
  const minutes = 6 * 60 + index * 30;
  const text = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${minutes % 60 ? '30' : '00'}`;
  return { value: text, label: text };
})];

/**
 * 일정 만들기·고치기: 몇 칸으로 끝나는 짧은 양식이라 대화상자(휴대폰은 전체 화면)다. 날짜 칸을 눌러 열었으면 그 날짜가
 * 시작일·종료일에 들어 있다. 제출은 막지 않고, 빠진 제목과 어긋난 날짜는 칸 곁에 알린 뒤 첫 칸에 초점을 둔다.
 */
export function EventFormDialog({ event, date, isPending, error, onSubmit, onClose }: {
  event?: CalendarEvent; date: DateKey; isPending: boolean; error?: string; onSubmit: (input: NewEvent) => void; onClose: () => void;
}) {
  const [title, setTitle] = useState(event?.title ?? '');
  const [start, setStart] = useState<DateKey | undefined>(event?.start ?? date);
  const [end, setEnd] = useState<DateKey | undefined>(event?.end ?? date);
  const [time, setTime] = useState(event?.time ?? ALL_DAY);
  const [place, setPlace] = useState(event?.place ?? '');
  const [color, setColor] = useState<EventColor>(event?.color ?? 'blue');
  const [isTried, setTried] = useState(false);
  const isBackwards = !!start && !!end && end < start;
  const submit = () => {
    setTried(true);
    if (!title.trim() || !start || !end || isBackwards) { focusFirstInvalid(); return; }
    onSubmit({ title: title.trim(), start, end, time: time === ALL_DAY ? undefined : time, place: place.trim() || undefined, color });
  };
  return <FormDialog title={event ? '일정 수정' : '일정 만들기'} submitLabel={event ? '저장' : '추가'} isPending={isPending} error={error}
    onSubmit={submit} onClose={onClose}>
    <TextInput label="제목" value={title} onChange={setTitle} hasAutoFocus
      status={isTried && !title.trim() ? { type: 'error', message: '제목을 입력해 주세요.' } : undefined} />
    <Grid columns={2} gap={3}>
      <DateInput label="시작일" format={value => dayText(value)} value={start} onChange={next => { setStart(next); if (next && end && end < next) setEnd(next); }}
        status={isTried && !start ? { type: 'error', message: '시작일을 골라 주세요.' } : undefined} />
      <DateInput label="종료일" format={value => dayText(value)} value={end} onChange={setEnd}
        status={isTried && (!end || isBackwards) ? { type: 'error', message: isBackwards ? '시작일보다 빠를 수 없습니다.' : '종료일을 골라 주세요.' } : undefined} />
    </Grid>
    <Grid columns={2} gap={3}>
      <Selector label="시작 시각" value={time} options={timeOptions} onChange={value => setTime(String(value))} />
      <Selector label="색" value={color} options={colors.map(each => ({ value: each.id, label: each.label }))} onChange={value => setColor(value as EventColor)} />
    </Grid>
    <TextInput label="장소 (선택)" value={place} onChange={setPlace} />
  </FormDialog>;
}
