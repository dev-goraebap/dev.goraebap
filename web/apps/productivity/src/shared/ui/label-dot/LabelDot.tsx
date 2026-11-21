/** Label colours are user data. Draw the exact saved colour instead of reducing it to a theme hue. */
export function LabelDot({ color }: { color?: string | null }) {
  const fill = /^#[0-9a-f]{6}$/i.test(color ?? '') ? color! : 'var(--icon-muted)';
  return (
    <svg width="1rem" height="1rem" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <circle
        cx="8"
        cy="8"
        r="6"
        fill={fill}
        stroke="color-mix(in srgb, currentColor 20%, transparent)"
        strokeWidth="0.75"
      />
    </svg>
  );
}
