import { useId } from 'react';
import { Field, FieldDescription, FieldLabel } from '@/shared/ui/kit/field';
import { Input } from '@/shared/ui/kit/input';

/** 양식 대화상자의 입력 칸 하나: 이름, 칸, 설명. 필수가 아니면 이름 뒤에 (선택). */
export function TextField({ label, description, isRequired, isOptional, ...input }: {
  label: string; description?: string; isRequired?: boolean; isOptional?: boolean; value: string; onChange: (value: string) => void;
  placeholder?: string; type?: string; autoFocus?: boolean;
}) {
  const id = useId();
  return <Field>
    <FieldLabel htmlFor={id}>{label}{isOptional ? <span className="font-normal text-muted-foreground">(선택)</span> : null}</FieldLabel>
    <Input id={id} required={isRequired} value={input.value} placeholder={input.placeholder} type={input.type} autoFocus={input.autoFocus}
      className="max-md:h-11" onChange={event => input.onChange(event.target.value)} />
    {description ? <FieldDescription>{description}</FieldDescription> : null}
  </Field>;
}
