import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/kit/select';

type Choice = { value: string; label: string };

/** 설정 줄의 고르기(사이클 기간 · 분류): 몇 개 안 되는 값에서 하나. */
export function ChoiceSelect({ label, options, value, disabled, onChange, className = 'min-w-40' }: {
  label: string; options: Choice[]; value: string; disabled?: boolean; onChange: (value: string) => void; className?: string;
}) {
  return <Select items={options} value={value} disabled={disabled} onValueChange={next => { if (next !== null) onChange(next); }}>
    <SelectTrigger aria-label={label} className={className}>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        {options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
      </SelectGroup>
    </SelectContent>
  </Select>;
}
