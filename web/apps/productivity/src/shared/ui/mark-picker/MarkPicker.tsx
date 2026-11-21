import { useState } from 'react';
import { cn } from 'cn';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { AdaptivePopover } from '@/shared/ui/kit/adaptive-popover';
import { markTone } from './Mark';
import { MarkIcon } from './MarkIcon';
import { MarkPanel, type MarkValue } from './MarkPanel';

const SIZE = { sm: 'size-8', md: 'size-7', field: 'size-9 max-md:size-12' } as const;

/**
 * The one picker for a mark, a view's or a project's (BIT's IconPicker): a square showing the icon in its colour, which
 * opens the icons and colours (MarkPanel) in a popover under it on a desktop and in a bottom sheet on a phone
 * (AdaptivePopover). Picking an icon closes it; a colour stays open to try another. fallbackLetter offers no icon, drawn
 * as its first character (a project's key). size is the square's: sm beside a borderless name, md a control's height,
 * field the height of the text input next to it.
 */
export function MarkPicker({ value, label, fallbackLetter, size = 'sm', isDisabled = false, onChange }: {
  value: MarkValue; label: string; fallbackLetter?: string; size?: 'sm' | 'md' | 'field'; isDisabled?: boolean; onChange: (mark: MarkValue) => void;
}) {
  const isMobile = useIsMobile();
  const [isOpen, setOpen] = useState(false);
  // Each opening starts afresh (no search left from the last one).
  const [opening, setOpening] = useState(0);
  const open = (next: boolean) => {
    setOpen(next);
    if (next) setOpening(count => count + 1);
  };
  return (
    <AdaptivePopover title={label} open={isOpen} onOpenChange={open} className="w-90 p-2"
      trigger={
        // check-ui: allow-style 표식의 색은 사용자가 고른 데이터다.
        <button type="button" aria-label={label} disabled={isDisabled} style={markTone(value.color)}
          className={cn('inline-grid shrink-0 place-items-center rounded-md bg-muted text-(--mark,var(--foreground)) outline-none',
            'hover:bg-secondary aria-expanded:bg-secondary focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60',
            '[&_svg]:size-4 max-md:min-h-11 max-md:min-w-11 max-md:[&_svg]:size-5.5', SIZE[size],
            !value.icon && 'text-sm font-bold text-muted-foreground')}>
          {value.icon ? <MarkIcon name={value.icon} /> : fallbackLetter?.slice(0, 1) || 'A'}
        </button>
      }>
      <MarkPanel key={opening} value={value} letter={fallbackLetter} isLarge={isMobile}
        onPick={icon => { onChange({ ...value, icon }); setOpen(false); }} onColor={color => onChange({ ...value, color })} />
    </AdaptivePopover>
  );
}
