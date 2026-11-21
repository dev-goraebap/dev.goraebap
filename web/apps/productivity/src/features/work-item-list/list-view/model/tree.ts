import type { WorkItemRow } from '@/entities/work-item';

/** 현재 그룹·페이지에 있는 업무만 재배치한다. 부모가 없으면 하위를 독립 행으로 유지한다. */
export function workItemTree(items: readonly WorkItemRow[], closed: ReadonlySet<string>) {
  const ids = new Set(items.map(item => item.id));
  const children = new Map<string, WorkItemRow[]>();
  for (const item of items) if (item.parentId && ids.has(item.parentId) && item.parentId !== item.id)
    children.set(item.parentId, [...(children.get(item.parentId) ?? []), item]);
  const seen = new Set<string>();
  const result: { item: WorkItemRow; depth: number; children: number }[] = [];
  const visit = (item: WorkItemRow, depth: number, hidden = false) => {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    const nested = children.get(item.id) ?? [];
    if (!hidden) result.push({ item, depth, children: nested.length });
    for (const child of nested) visit(child, depth + 1, hidden || closed.has(item.id));
  };
  for (const item of items) if (!item.parentId || !ids.has(item.parentId) || item.parentId === item.id) visit(item, 0);
  // 잘못된 순환 관계가 있어도 행을 누락하지 않는다.
  for (const item of items) if (!seen.has(item.id)) visit(item, 0);
  return result;
}
