import { cn } from 'cn';
import { axisTop, CHART_BUCKET, CHART_CANVAS, CHART_FULL, CHART_HIT, CHART_STROKE, type ChartSeries } from '../model/chart-style';
import { ChartPlot } from './ChartPlot';

/** Lines over the buckets, a gap where a bucket has no value (no requests that hour); a bucket names its values when pointed at. */
export function LinesChart({ labels, series, format }: { labels: string[]; series: ChartSeries[]; format: (value: number) => string }) {
  const values = series.flatMap(item => item.values.filter((value): value is number => value != null));
  const top = axisTop(Math.max(0, ...values));
  const y = (value: number) => CHART_FULL - (value / top) * CHART_FULL;
  return <ChartPlot labels={labels} top={top} format={format}>
    <svg className={CHART_CANVAS} viewBox={`0 0 ${Math.max(1, labels.length)} ${CHART_FULL}`} preserveAspectRatio="none" role="img"
      aria-label={series.map(item => item.label).join(' · ')}>
      {labels.map((label, index) => <g key={index} className={CHART_BUCKET}>
        <title>{[label, ...series.map(item => `${item.label} ${item.values[index] == null ? '-' : format(item.values[index] as number)}`)].join(' · ')}</title>
        <rect className={CHART_HIT} x={index} y={0} width={1} height={CHART_FULL} />
      </g>)}
      {series.map(item => {
        const runs: string[][] = [[]];
        item.values.forEach((value, index) => {
          if (value == null) runs.push([]);
          else runs[runs.length - 1].push(`${index + 0.5},${y(value)}`);
        });
        return runs.filter(run => run.length > 0).map((run, part) => <polyline key={`${item.key}-${part}`}
          className={cn('fill-none stroke-2 [stroke-linecap:round] [stroke-linejoin:round]', CHART_STROKE[item.tone])}
          points={run.length === 1 ? `${run[0]} ${run[0]}` : run.join(' ')} vectorEffect="non-scaling-stroke" />);
      })}
    </svg>
  </ChartPlot>;
}
