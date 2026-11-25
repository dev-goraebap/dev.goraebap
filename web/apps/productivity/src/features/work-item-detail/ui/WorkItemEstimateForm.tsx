import { useId, useState } from 'react';
import { Button } from '@goraebap/ui-react/compact/button';
import { Field, FieldLabel } from '@goraebap/ui-react/components/field';
import { Input } from '@goraebap/ui-react/compact/input';

/** 숫자 칸의 값: 0보다 큰 수만 값이고, 비우거나 0 이하면 없음이다. */
const hoursOf = (text: string) => {
  const value = Number(text);
  return text.trim() && Number.isFinite(value) && value > 0 ? value : undefined;
};

export function WorkItemEstimateForm({ value, onSave }: { value?: number; onSave: (hours?: number) => void }) {
  const id = useId();
  const [text, setText] = useState(value === undefined ? '' : String(value));
  const hours = hoursOf(text);
  return <form className="flex flex-col gap-3 p-1" onSubmit={event => { event.preventDefault(); if (hours !== value) onSave(hours); }}>
    <Field>
      <FieldLabel htmlFor={id}>추정시간 (시간)</FieldLabel>
      <Input id={id} type="number" inputMode="decimal" placeholder="예: 2.5" min={0} max={1000} step={0.5} value={text} autoFocus
        className="max-md:h-11" onChange={event => setText(event.target.value)} />
    </Field>
    <div className="flex justify-end gap-2 max-md:*:h-11">
      {value !== undefined ? <Button type="button" variant="ghost" size="sm" onClick={() => onSave(undefined)}>비우기</Button> : null}
      <Button type="submit" size="sm" disabled={hours === value}>저장</Button>
    </div>
  </form>;
}
