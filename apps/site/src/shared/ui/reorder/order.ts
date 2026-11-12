/** id를 index 자리로 옮긴 순서. 없는 id면 그대로. index는 id를 뺀 목록에서의 자리다. */
export function placeAt(order: readonly string[], id: string, index: number): string[] {
  const others = order.filter(each => each !== id)
  if (others.length === order.length) return [...order]
  const at = Math.min(others.length, Math.max(0, index))
  return [...others.slice(0, at), id, ...others.slice(at)]
}

/** 한 칸 위(-1) · 아래(1)로. 끝이면 그대로. */
export function stepBy(order: readonly string[], id: string, by: -1 | 1): string[] {
  const at = order.indexOf(id)
  return at < 0 ? [...order] : placeAt(order, id, at + by)
}

/**
 * 끌고 있는 줄(from)의 가운데가 middle일 때 놓일 자리. 끌린 줄이 빠진 자리만큼 아래 줄들이 올라온 것으로 보고
 * 가운데를 지난 줄 수를 센다. 높이가 다른 줄(하위 목록을 품은 줄)이 섞여도 맞다.
 */
export function placeFor(rows: readonly { top: number; height: number }[], from: number, middle: number): number {
  const gap = rows[from]?.height ?? 0
  return rows.filter((row, index) => index !== from && (index > from ? row.top - gap : row.top) + row.height / 2 < middle).length
}
