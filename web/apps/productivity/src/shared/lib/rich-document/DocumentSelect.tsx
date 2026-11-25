import { useState } from 'react';
import { cn } from 'cn';
import { Button } from '@goraebap/ui-react/compact/button';
import { ChevronDownIcon } from '@/shared/ui/kit/icon';
import { OptionList } from '@/shared/ui/kit/option-list';
import { Popover, PopoverContent, PopoverTrigger } from '@goraebap/ui-react/compact/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@goraebap/ui-react/compact/select';

export type SelectOption = { value: string; label: string };

/** 이보다 많으면 찾기 칸이 있는 목록으로 연다(코드 언어처럼 긴 목록). */
const SEARCHABLE_FROM = 9;
const TRIGGER = 'h-7 max-w-50 min-w-22 gap-1 border-transparent px-2 text-xs font-normal text-muted-foreground hover:bg-muted hover:text-foreground';

/**
 * 블록 머리의 작은 고르기(콜아웃 종류 · 코드 언어 · 미디어 너비): 바탕 없는 작은 단추에 지금 값. 짧은 목록은 키트 Select, 긴 목록은
 * 찾기 칸이 있는 목록(OptionList)을 팝오버로 연다. 고르면 onChange, 편집기로 초점을 돌리는 일은 부르는 쪽이 한다.
 */
export function DocumentSelect({ label, value, onChange, options, placeholder, className }: {
  label: string; value: string; onChange: (value: string) => void; options: SelectOption[]; placeholder?: string; className?: string;
}) {
  const [isOpen, setOpen] = useState(false);
  const current = options.find(option => option.value === value);
  if (options.length >= SEARCHABLE_FROM) {
    return <span className={cn('rd-select inline-flex', className)}>
      <Popover open={isOpen} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button variant="ghost" size="sm" aria-label={label} className={TRIGGER} />}>
          <span className="truncate">{current?.label ?? placeholder ?? label}</span><ChevronDownIcon data-icon="inline-end" />
        </PopoverTrigger>
        <PopoverContent align="end" aria-label={label} className="w-56 p-1.5">
          <OptionList label={label} isSearchable options={options} chosen={[value]} onPick={next => { setOpen(false); onChange(next); }} />
        </PopoverContent>
      </Popover>
    </span>;
  }
  return <span className={cn('rd-select inline-flex', className)}>
    <Select items={options} value={value} onValueChange={next => { if (next !== null) onChange(String(next)); }}>
      <SelectTrigger size="sm" aria-label={label} className={TRIGGER}><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="end">
        {options.map(option => <SelectItem key={option.value} value={option.value} className="text-xs">{option.label}</SelectItem>)}
      </SelectContent>
    </Select>
  </span>;
}
