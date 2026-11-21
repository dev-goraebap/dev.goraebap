import type { ReactNode } from 'react';

/** Which bucket labels to show so they do not crowd: all of a week, every third hour of a day, every fifth of a month. */
const labelEvery = (count: number) => (count <= 8 ? 1 : count <= 24 ? 3 : 5);
const TICK = 'text-xs leading-none text-muted-foreground tabular-nums';

/** The value axis (zero, half, the top) beside the plot, and the bucket labels under it, every so many from the latest. */
export function ChartPlot({ labels, top, format, children }: { labels: string[]; top: number; format: (value: number) => string; children: ReactNode }) {
  const every = labelEvery(labels.length);
  return <div className="flex min-w-0 gap-2">
    <div className="flex h-40 flex-col items-end justify-between" aria-hidden>
      <span className={TICK}>{format(top)}</span><span className={TICK}>{format(top / 2)}</span><span className={TICK}>{format(0)}</span>
    </div>
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      {children}
      <div className="flex min-w-0" aria-hidden>
        {labels.map((label, index) => <span key={index} className="min-w-0 flex-1 text-center text-xs leading-tight whitespace-nowrap text-muted-foreground">
          {(labels.length - 1 - index) % every === 0 ? label : ''}
        </span>)}
      </div>
    </div>
  </div>;
}
