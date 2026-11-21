import { axisTop, CHART_BUCKET, CHART_CANVAS, CHART_FILL, CHART_FULL, CHART_HIT, type ChartSeries } from '../model/chart-style';
import { ChartPlot } from './ChartPlot';

/**
 * Bars per bucket, the series stacked from the bottom in their order; a bucket names its bucket and values when pointed
 * at (and to assistive technology).
 */
export function StackedBarsChart({ labels, series, unit, format = value => `${value.toLocaleString('ko-KR')}${unit}` }: {
  labels: string[]; series: ChartSeries[]; unit: string; format?: (value: number) => string;
}) {
  const totals = labels.map((_, index) => series.reduce((sum, item) => sum + (item.values[index] ?? 0), 0));
  const top = axisTop(Math.max(0, ...totals));
  return <ChartPlot labels={labels} top={top} format={format}>
    <svg className={CHART_CANVAS} viewBox={`0 0 ${Math.max(1, labels.length)} ${CHART_FULL}`} preserveAspectRatio="none" role="img"
      aria-label={series.map(item => item.label).join(' · ')}>
      {labels.map((label, index) => {
        const detail = [label, ...series.map(item => `${item.label} ${format(item.values[index] ?? 0)}`)].join(' · ');
        let base = CHART_FULL;
        return <g key={index} className={CHART_BUCKET}>
          <title>{detail}</title>
          <rect className={CHART_HIT} x={index} y={0} width={1} height={CHART_FULL} />
          {series.map(item => {
            const value = item.values[index] ?? 0;
            if (value <= 0) return null;
            const height = Math.max(0.6, (value / top) * CHART_FULL);
            base -= height;
            return <rect key={item.key} className={CHART_FILL[item.tone]} x={index + 0.12} y={base} width={0.76} height={height} />;
          })}
        </g>;
      })}
    </svg>
  </ChartPlot>;
}
