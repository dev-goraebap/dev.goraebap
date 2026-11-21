/**
 * A series' colour. The theme has no data palette of its own, so a series borrows the work item marks' hues (blue, orange,
 * red, green, yellow), which keep their contrast in the light and dark themes alike.
 */
export type ChartTone = 'blue' | 'orange' | 'red' | 'green' | 'yellow';
export type ChartSeries = { key: string; label: string; tone: ChartTone; values: (number | null)[] };

/** Fills (bars, swatches) and strokes (lines) in a tone. */
export const CHART_FILL: Record<ChartTone, string> = {
  blue: 'fill-mark-low', orange: 'fill-mark-high', red: 'fill-mark-urgent', green: 'fill-mark-done', yellow: 'fill-mark-medium',
};
export const CHART_STROKE: Record<ChartTone, string> = {
  blue: 'stroke-mark-low', orange: 'stroke-mark-high', red: 'stroke-mark-urgent', green: 'stroke-mark-done', yellow: 'stroke-mark-medium',
};

/** A raised surface: the tiles, the charts and the kinds of notice are each one (DESIGN.md 면 단계). */
export const STATUS_SURFACE = 'min-w-0 rounded-xl border bg-card p-4';

/** A plot's height in its own units: values are drawn as shares of it. */
export const CHART_FULL = 100;
/** The plot itself, 10rem high, with a rule at its half and its foot. */
export const CHART_CANVAS = 'block h-40 w-full overflow-visible border-b bg-[linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:100%_50%]';
/** The pointed-at bucket lights up behind its bars. */
export const CHART_BUCKET = 'group/bucket';
export const CHART_HIT = 'fill-transparent group-hover/bucket:fill-foreground/6';

/** The highest value the axis shows: the largest value rounded up to a readable step (1, 2 or 5 times a power of ten). */
export function axisTop(largest: number): number {
  if (largest <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(largest));
  const step = [1, 2, 5, 10].find(factor => factor * power >= largest) ?? 10;
  return step * power;
}
