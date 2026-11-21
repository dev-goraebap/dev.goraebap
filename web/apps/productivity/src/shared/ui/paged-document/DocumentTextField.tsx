import { useId, type RefCallback } from 'react';
import { Field, FieldLabel } from '@/shared/ui/kit/field';
import { Input } from '@/shared/ui/kit/input';

export function DocumentTextField({ label, value, inputRef, onFocus, onChange }: {
  label: string; value: string; inputRef: RefCallback<HTMLInputElement>; onFocus: () => void; onChange: (value: string) => void;
}) {
  const id = useId();
  return <Field className="min-w-0 flex-1 gap-1.5">
    <FieldLabel htmlFor={id} className="text-xs text-muted-foreground">{label}</FieldLabel>
    <Input id={id} ref={inputRef} value={value} placeholder="비어 있음" className="h-8 max-md:h-11" onFocus={onFocus} onChange={event => onChange(event.target.value)} />
  </Field>;
}
