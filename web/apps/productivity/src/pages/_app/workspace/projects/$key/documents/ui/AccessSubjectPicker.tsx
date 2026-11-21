import { useState } from 'react';
import { AdaptivePopover } from '@/shared/ui/kit/adaptive-popover';
import { Button } from '@/shared/ui/kit/button';
import { PlusIcon } from '@/shared/ui/kit/icon';
import { OptionList } from '@/shared/ui/kit/option-list';

/** 대상 더하기: 사람 · 프로젝트를 이름으로 찾아 고르면 보기 권한으로 더한다. */
export function AccessSubjectPicker({ choices, isDisabled, onPick }: { choices: { value: string; label: string }[]; isDisabled: boolean; onPick: (value: string) => void }) {
  const [isOpen, setOpen] = useState(false);
  return <AdaptivePopover title="대상 더하기" open={isOpen} onOpenChange={setOpen} className="w-80 p-1.5"
    trigger={<Button variant="outline" size="sm" disabled={isDisabled} className="self-start"><PlusIcon data-icon="inline-start" />대상 더하기</Button>}>
    <OptionList label="사람 · 프로젝트 찾기" isSearchable options={choices} onPick={value => { setOpen(false); onPick(value); }} />
  </AdaptivePopover>;
}
