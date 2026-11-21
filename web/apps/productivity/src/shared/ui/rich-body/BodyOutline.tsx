import { useState } from 'react';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { AdaptivePopover } from '@/shared/ui/kit/adaptive-popover';
import { Button } from '@/shared/ui/kit/button';
import { GripIcon } from '@/shared/ui/kit/icon';
import { PropertyPill } from '@/shared/ui/kit/property-pill';
import { useBodyHeadings, type BodyHeading } from './outline-context';

const go = (heading: BodyHeading) => {
  const target = document.querySelector(`[data-block-id="${CSS.escape(heading.id)}"]`);
  target?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
};

/**
 * 목차 버튼. 데스크톱은 속성 칸의 한 항목(테두리 있는 팝오버로 제목 목록), 휴대폰은 오른쪽 아래 둥근 버튼(바텀시트).
 * 제목을 고르면 본문의 그 자리로 옮겨 간다. 제목이 없으면 그리지 않는다.
 */
export function BodyOutline() {
  const headings = useBodyHeadings();
  const isPhone = useIsMobile();
  const [isOpen, setOpen] = useState(false);
  if (!headings.length) return null;
  const base = Math.min(...headings.map(heading => heading.level));
  const list = (close: () => void) => <nav aria-label="이 본문의 목차" className="flex max-h-[60dvh] flex-col overflow-y-auto">
    {headings.map(heading => <Button key={heading.id} variant="ghost"
      className="h-auto min-h-8 justify-start py-1.5 text-left font-normal whitespace-normal max-md:min-h-12 max-md:text-[0.9375rem]"
      // check-ui: allow-style 제목 단계만큼 들여 쓴다(본문이 준 단계).
      style={{ paddingInlineStart: `${0.625 + Math.min(3, heading.level - base) * 0.75}rem` }}
      onClick={() => { close(); go(heading); }}>
      <span className="line-clamp-2">{heading.text}</span>
    </Button>)}
  </nav>;
  if (!isPhone) return <PropertyPill label="목차" icon={<GripIcon />} text={`목차 ${headings.length}`} width="w-72">{list}</PropertyPill>;
  return <AdaptivePopover title="목차" open={isOpen} onOpenChange={setOpen} className="w-72 p-1.5"
    trigger={<Button variant="secondary" size="icon-lg" aria-label="목차" title="목차"
      className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-5 size-12 rounded-full border border-input bg-popover shadow-md">
      <GripIcon chosen={isOpen} />
    </Button>}>
    {list(() => setOpen(false))}
  </AdaptivePopover>;
}
