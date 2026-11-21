import type { ReactNode } from 'react';
import { Button } from '@/shared/ui/kit/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/kit/tooltip';

/** 줄 끝의 작은 아이콘 버튼(복사 · 보기). 휴대폰은 44px. */
export function IconAction({ label, tooltip, onClick, children }: { label: string; tooltip: string; onClick: () => void; children: ReactNode }) {
  return <Tooltip>
    <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label={label} className="max-md:size-11" onClick={onClick}>{children}</Button>} />
    <TooltipContent>{tooltip}</TooltipContent>
  </Tooltip>;
}
