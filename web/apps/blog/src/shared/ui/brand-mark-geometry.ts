export const BRAND_MARK_VIEW_BOX = "70 53 376 376";

export const BRAND_MARK_STROKES = [
  {
    strokeWidth: 32,
    d: "M 296 232 C 245 189 153 179 110 226 C 65 277 97 355 168 378 C 220 394 282 366 292 320 C 316 246 216 226 196 290 C 168 350 286 378 346 324 C 367 302 380 277 380 253",
  },
  {
    strokeWidth: 28,
    d: "M 389 203 C 414 193 428 168 426 143 C 395 146 371 160 356 182 C 344 154 322 136 294 134 C 292 163 305 186 332 198",
  },
] as const;

export const BRAND_MARK_SPARK = {
  transform: "translate(156 98) scale(1.12) translate(-156 -98)",
  d: "M 154.8 65.2 Q 156 62.8 157.2 65.2 C 161.5 84.5 168 91 185.8 96.8 Q 188.2 98 185.8 99.2 C 168 105 161.5 111.5 157.2 130.8 Q 156 133.2 154.8 130.8 C 150.5 111.5 144 105 126.2 99.2 Q 123.8 98 126.2 96.8 C 144 91 150.5 84.5 154.8 65.2 Z",
} as const;

export function renderBrandMarkSvg(className = ""): string {
  const strokes = BRAND_MARK_STROKES.map(
    (stroke) =>
      `<path pathLength="1" fill="none" stroke="currentColor" stroke-width="${stroke.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" d="${stroke.d}" />`,
  ).join("");
  const spark = `<path fill="currentColor" transform="${BRAND_MARK_SPARK.transform}" d="${BRAND_MARK_SPARK.d}" />`;
  const cls = className ? ` class="${className}"` : "";
  return `<svg viewBox="${BRAND_MARK_VIEW_BOX}" aria-hidden="true"${cls}>${strokes}${spark}</svg>`;
}
