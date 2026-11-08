

export function placeAt(order: readonly string[], id: string, index: number): string[] {
  const others = order.filter(each => each !== id);
  if (others.length === order.length) return [...order];
  const at = Math.min(others.length, Math.max(0, index));
  return [...others.slice(0, at), id, ...others.slice(at)];
}


export function stepBy(order: readonly string[], id: string, by: -1 | 1): string[] {
  const at = order.indexOf(id);
  return at < 0 ? [...order] : placeAt(order, id, at + by);
}


export function placeFor(rows: readonly { top: number; height: number }[], from: number, middle: number): number {
  const gap = rows[from]?.height ?? 0;
  return rows.filter((row, index) => index !== from && (index > from ? row.top - gap : row.top) + row.height / 2 < middle).length;
}
