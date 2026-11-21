import { useState, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { cn } from 'cn';
import { AdaptivePopover as KitAdaptivePopover } from '@/shared/ui/kit/adaptive-popover';

// The widths the pages ask for, as classes; another width is the caller's measure, set as it is.
const WIDTHS: Record<string, string> = {
  '12rem': 'w-48', '15rem': 'w-60', '16rem': 'w-64', '18rem': 'w-72', '20rem': 'w-80', '22rem': 'w-88', '23rem': 'w-92', '24rem': 'w-96',
};

/**
 * What a button opens beside itself (the kit's AdaptivePopover): a popover on a desktop, and on a phone always a bottom
 * sheet (cowork's rule: no popover on a phone), titled with label. content receives close, to shut it after a choice.
 * The trigger is a button-rendering element; it is the popover's trigger as it is (Base UI's render), so it must take a ref
 * and the props it is handed.
 */
export function AdaptivePopover({ label, trigger, content, width = '15rem', alignment = 'start', sheetHeight = 'hug', onOpenChange, isDefaultOpen = false }: {
  label: string; trigger: ReactElement; content: (close: () => void) => ReactNode;
  width?: number | string;
  /** Kept for the callers of the old API: the kit's popover always opens below its trigger. */
  placement?: 'above' | 'below' | 'start' | 'end';
  alignment?: 'start' | 'center' | 'end';
  /** The phone's sheet: hug fits short content; tall stands near full height, for a search (the keyboard) or a long list. */
  sheetHeight?: 'hug' | 'tall';
  /** Told when it opens or shuts, for a trigger that shows itself pressed while open. */
  onOpenChange?: (isOpen: boolean) => void;
  /** Opens as soon as it is made (a row's … made by the press that opens it). */
  isDefaultOpen?: boolean;
}) {
  const [isOpen, setOpenState] = useState(isDefaultOpen);
  const setOpen = (next: boolean) => { setOpenState(next); onOpenChange?.(next); };
  const close = () => setOpen(false);
  const widthClass = typeof width === 'string' ? WIDTHS[width] : undefined;
  const measure = typeof width === 'number' ? `${width / 16}rem` : width;
  return <KitAdaptivePopover title={label} trigger={trigger} open={isOpen} onOpenChange={setOpen} align={alignment}
    className={cn('p-1.5', widthClass ?? 'w-auto')}>
    {/* check-ui: allow-style 부르는 쪽이 정한 폭(옛 API의 width)이 목록에 없을 때만 데스크톱 폭으로 둔다. */}
    <div className={cn('flex min-w-0 flex-col', !widthClass && 'md:w-(--popover-width)', sheetHeight === 'tall' && 'max-md:min-h-[60dvh]')}
      style={widthClass ? undefined : { '--popover-width': measure } as CSSProperties}>
      {content(close)}
    </div>
  </KitAdaptivePopover>;
}
