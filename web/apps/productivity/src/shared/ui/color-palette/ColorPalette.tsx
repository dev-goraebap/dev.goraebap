import type { CSSProperties } from 'react';
import { cn } from 'cn';
import { PALETTE } from './palette';

// A swatch's colour is data (one of the palette's), handed to its class as --swatch.
const swatchOf = (color: string) => ({ '--swatch': color }) as CSSProperties;

const swatch = cn('inline-grid size-5 shrink-0 place-items-center rounded-full outline-none',
  'focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
  'aria-pressed:shadow-[0_0_0_2px_var(--popover),0_0_0_3.5px_var(--foreground)]',
  // A phone's finger wants a bigger target: the swatch keeps its look inside a 44px button.
  'max-md:size-11 max-md:bg-clip-content max-md:p-2');

/**
 * The palette's sixteen colours in two rows of eight, a round swatch each, the chosen one ringed (BIT's ColorPalette).
 * onClear adds a first swatch for no colour of its own. A choice changes the parent's draft and saves nothing.
 */
export function ColorPalette({ value, label = '색', isDisabled = false, onChange, onClear }: {
  value?: string | null; label?: string; isDisabled?: boolean; onChange: (color: string) => void; onClear?: () => void;
}) {
  return (
    <div role="group" aria-label={label}
      className={cn('flex flex-wrap gap-2 p-1 max-md:max-w-full', onClear ? 'max-w-[calc(9*1.25rem+8*0.5rem+0.5rem)]' : 'max-w-[calc(8*1.25rem+7*0.5rem+0.5rem)]')}>
      {onClear && (
        <button type="button" aria-pressed={!value} aria-label="기본색" title="기본색" disabled={isDisabled} onClick={onClear}
          className={cn(swatch, 'relative bg-muted text-muted-foreground ring-1 ring-input ring-inset',
            'after:absolute after:h-px after:w-[70%] after:-rotate-45 after:bg-current')} />
      )}
      {PALETTE.map(color => (
        // check-ui: allow-style 견본의 색은 팔레트 데이터다.
        <button key={color.value} type="button" aria-pressed={value?.toLowerCase() === color.value} aria-label={color.name} title={color.name}
          className={cn(swatch, 'bg-(--swatch)')} style={swatchOf(color.value)} disabled={isDisabled} onClick={() => onChange(color.value)} />
      ))}
    </div>
  );
}
