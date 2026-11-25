import { useState } from 'react';
import { AdaptivePopover } from '@/shared/ui/kit/adaptive-popover';
import { Button } from '@goraebap/ui-react/compact/button';
import { ChevronDownIcon } from '@/shared/ui/kit/icon';
import { OptionList } from '@/shared/ui/kit/option-list';

/** 규칙 하나의 고르기: 보드 기본값 · 칸들 · 옮기지 않음. 데스크톱 팝오버, 휴대폰 바텀시트. 일곱 개를 넘으면 찾기 칸이 붙는다. */
export function RulePicker({ label, value, options, isDisabled, onChange }: {
  label: string; value: string; options: { value: string; label: string }[]; isDisabled: boolean; onChange: (value: string) => void;
}) {
  const [isOpen, setOpen] = useState(false);
  const current = options.find(option => option.value === value) ?? options[0];
  return <AdaptivePopover title={label} open={isOpen} onOpenChange={setOpen} align="end" className="w-60 p-1.5"
    trigger={<Button variant="outline" disabled={isDisabled} aria-label={`${label}: ${current?.label ?? ''}`}
      className="w-full justify-between @md/field-group:w-52 max-md:h-11">
      <span className="truncate">{current?.label}</span>
      <ChevronDownIcon data-icon="inline-end" className="text-icon-muted" />
    </Button>}>
    <OptionList label={`${label} 고르기`} options={options} chosen={[value]} isSearchable={options.length > 7}
      onPick={next => { onChange(next); setOpen(false); }} />
  </AdaptivePopover>;
}
