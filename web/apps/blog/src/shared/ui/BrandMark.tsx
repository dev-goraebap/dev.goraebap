import {
  BRAND_MARK_SPARK,
  BRAND_MARK_STROKES,
  BRAND_MARK_VIEW_BOX,
} from "./brand-mark-geometry";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox={BRAND_MARK_VIEW_BOX} aria-hidden="true" className={className}>
      {BRAND_MARK_STROKES.map((stroke) => (
        <path
          key={stroke.d}
          pathLength={1}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          d={stroke.d}
        />
      ))}
      <path
        fill="currentColor"
        transform={BRAND_MARK_SPARK.transform}
        d={BRAND_MARK_SPARK.d}
      />
    </svg>
  );
}
