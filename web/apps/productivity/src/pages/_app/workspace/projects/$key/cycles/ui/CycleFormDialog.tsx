import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { createCycle, editCycle, refreshWorkItems, type Cycle } from '@/entities/work-item';
import { DatePicker } from '@/shared/ui/kit/date-picker';
import { Field, FieldError, FieldLabel } from '@/shared/ui/kit/field';
import { FormDialog } from '@/shared/ui/kit/form-dialog';
import { Input } from '@/shared/ui/kit/input';
import { Textarea } from '@/shared/ui/kit/textarea';

export const iso = (date: Date) => date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
const plusDays = (day: string, days: number) => { const date = new Date(`${day}T00:00:00`); date.setDate(date.getDate() + days); return iso(date); };

/**
 * 새 사이클 · 사이클 편집: 이름 · 시작일 · 종료일 · 목표. 새 사이클은 마지막 사이클 다음 날부터 2주, 이름은 다음 차례(7차 사이클)로
 * 채워 둔다. 저장하면 업무 목록과 함께 다시 읽는다.
 */
export function CycleFormDialog({ projectKey, cycle, cycles, onClose }: { projectKey: string; cycle?: Cycle; cycles: Cycle[]; onClose: () => void }) {
  const client = useQueryClient();
  const id = useId();
  const last = cycles.at(-1)?.endDate;
  const start = cycle?.startDate ?? (last ? plusDays(last, 1) : iso(new Date()));
  const [name, setName] = useState(cycle?.name ?? `${cycles.length + 1}차 사이클`);
  const [goal, setGoal] = useState(cycle?.goal ?? '');
  const [from, setFrom] = useState(start);
  const [to, setTo] = useState(cycle?.endDate ?? plusDays(start, 13));
  const isRangeWrong = from > to;
  const save = useMutation({
    mutationFn: () => {
      const input = { name: name.trim(), goal: goal.trim() || undefined, startDate: from, endDate: to };
      return cycle ? editCycle(projectKey, cycle, input) : createCycle(projectKey, input).then(() => undefined);
    },
    onSuccess: async () => { await refreshWorkItems(client); onClose(); },
  });
  return <FormDialog open onOpenChange={open => { if (!open) onClose(); }} title={cycle ? '사이클 편집' : '새 사이클'} submitLabel="저장"
    isPending={save.isPending} isSubmitDisabled={!name.trim() || isRangeWrong} onSubmit={() => save.mutate()}>
    <Field>
      <FieldLabel htmlFor={`${id}-name`}>이름</FieldLabel>
      <Input id={`${id}-name`} autoFocus autoComplete="off" placeholder="예: 11월 2주차" value={name} onChange={event => setName(event.target.value)} />
    </Field>
    <div className="grid gap-4 md:grid-cols-2">
      <Field>
        <FieldLabel htmlFor={`${id}-from`}>시작일</FieldLabel>
        <DatePicker id={`${id}-from`} label="시작일" value={from} onChange={setFrom} />
      </Field>
      <Field data-invalid={isRangeWrong || undefined}>
        <FieldLabel htmlFor={`${id}-to`}>종료일</FieldLabel>
        <DatePicker id={`${id}-to`} label="종료일" value={to} onChange={setTo} />
        {isRangeWrong ? <FieldError>종료일은 시작일보다 늦어야 합니다.</FieldError> : null}
      </Field>
    </div>
    <Field>
      <FieldLabel htmlFor={`${id}-goal`}>목표</FieldLabel>
      <Textarea id={`${id}-goal`} rows={3} maxLength={500} placeholder="이 사이클에서 끝낼 것 (선택)" value={goal} onChange={event => setGoal(event.target.value)} />
    </Field>
    {save.error ? <p role="alert" className="text-sm text-destructive">{save.error.message}</p> : null}
  </FormDialog>;
}
