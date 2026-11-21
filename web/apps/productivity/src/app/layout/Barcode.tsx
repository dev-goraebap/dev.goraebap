// The bars' starts and widths, as client/'s repeating stripe: a decoration with no code in it.
const BARS = [[0, 1], [3, 2], [6, 1], [9, 3], [13, 1], [17, 1], [20, 2], [23, 1], [26, 3], [30, 1], [34, 1], [37, 2], [40, 1], [43, 3], [47, 1], [51, 1]];

/** A faint barcode in the secondary ink, beside the Agent button. Decorative. */
export function Barcode() {
  return <svg width="52" height="12" viewBox="0 0 52 12" aria-hidden="true" focusable="false" fill="currentColor" opacity="0.5"
    className="text-muted-foreground">
    {BARS.map(([x, width]) => <rect key={x} x={x} width={width} height="12" />)}
  </svg>;
}
