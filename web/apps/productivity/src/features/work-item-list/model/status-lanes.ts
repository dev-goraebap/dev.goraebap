import type { BoardColumn, ColumnCategory, WorkItemRow } from '@/entities/work-item';

const stages: readonly ColumnCategory[] = ['BACKLOG', 'UNSTARTED', 'STARTED', 'COMPLETED', 'CANCELED'];
const statusKey = (column: { name: string; category: ColumnCategory }) => `${column.category}:${column.name}`;

/** 전역에서는 같은 이름·단계를 합치고, 프로젝트 안에서는 실제 열 ID와 순서를 유지한다. */
export function statusLanes(workItems: readonly WorkItemRow[], columns: readonly BoardColumn[] = [], workspace = false, hidesBacklog = false) {
  const catalog = columns.length ? [...columns] : workItems.map(item => ({
    id: item.columnId, name: item.columnName, category: item.category, position: 0,
  }));
  if (workspace) catalog.sort((one, other) => stages.indexOf(one.category) - stages.indexOf(other.category)
    || one.position - other.position || one.name.localeCompare(other.name, 'ko'));
  const seen = new Set<string>();
  return catalog.flatMap(column => {
    const key = workspace ? statusKey(column) : column.id;
    if (seen.has(key) || hidesBacklog && column.category === 'BACKLOG') return [];
    seen.add(key);
    return [{ column: { ...column, id: key }, workItems: workItems.filter(item => workspace
      ? statusKey({ name: item.columnName, category: item.category }) === key : item.columnId === key) }];
  });
}
