import type { ReactNode } from 'react';
import { cn } from 'cn';
import { CHART_FILL, STATUS_SURFACE, type ChartSeries } from '../model/chart-style';

/** A chart's frame, a raised surface: its title and total on one line, the legend under it (two series or more), the chart. */
export function ChartCard({ title, total, series, children }: {
  title: string; total?: string; series: Pick<ChartSeries, 'key' | 'label' | 'tone'>[]; children: ReactNode;
}) {
  return <section className={cn(STATUS_SURFACE, 'flex flex-col gap-2')} aria-label={title}>
    <div className="flex items-center justify-between gap-2">
      <h3 className="font-semibold">{title}</h3>
      {total ? <span className="text-xs text-muted-foreground tabular-nums">{total}</span> : null}
    </div>
    {series.length > 1 ? <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
      {series.map(item => <li key={item.key} className="flex items-center gap-1">
        <svg className="size-2.5 shrink-0" viewBox="0 0 10 10" aria-hidden="true"><rect className={CHART_FILL[item.tone]} width="10" height="10" rx="2" /></svg>
        <span className="text-xs text-muted-foreground">{item.label}</span>
      </li>)}
    </ul> : null}
    {children}
  </section>;
}
