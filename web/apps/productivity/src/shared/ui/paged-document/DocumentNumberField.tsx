import { useId } from 'react';
import { Field, FieldLabel } from '@/shared/ui/kit/field';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/shared/ui/kit/input-group';

/** 단위가 붙은 숫자 칸. 범위를 벗어난 값은 범위 끝으로 맞춘다(빈 칸은 바꾸지 않는다). placeholder는 기본값이다. */
export function DocumentNumberField({ label, unit, min, max, value, placeholder, onChange }: {
  label: string; unit: string; min: number; max: number; value: number; placeholder: number; onChange: (value: number) => void;
}) {
  const id = useId();
  return <Field className="min-w-0 flex-1 gap-1.5">
    <FieldLabel htmlFor={id} className="text-xs text-muted-foreground">{label}</FieldLabel>
    <InputGroup className="h-8 max-md:h-11">
      <InputGroupInput id={id} type="number" inputMode="decimal" min={min} max={max} step={1} value={value} placeholder={String(placeholder)} className="tabular-nums"
        onChange={event => { if (event.target.value !== '' && Number.isFinite(event.target.valueAsNumber)) onChange(Math.min(max, Math.max(min, event.target.valueAsNumber))); }} />
      <InputGroupAddon align="inline-end"><InputGroupText className="text-xs">{unit}</InputGroupText></InputGroupAddon>
    </InputGroup>
  </Field>;
}
