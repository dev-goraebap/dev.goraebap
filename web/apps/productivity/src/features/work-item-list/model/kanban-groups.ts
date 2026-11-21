import { PRIORITIES, type BoardColumn, type WorkItemBoardGroup, type WorkItemTypeRow, type WorkItemViewGrouping } from '@/entities/work-item';
import { statusLanes } from './status-lanes';

export function kanbanGroupsInOrder(source: WorkItemBoardGroup[], grouping: WorkItemViewGrouping,
  columns: readonly BoardColumn[] | undefined, types: readonly WorkItemTypeRow[], workspace: boolean,
  isNarrowed: boolean, showsBacklog?: boolean) {
  let groups = source;
  if (grouping === 'STATUS' && !isNarrowed) {
    const found = new Map(groups.map(group => [group.id, group]));
    groups = statusLanes([], columns, workspace, !showsBacklog).map(({ column }) => found.get(column.id)
      ?? { id: column.id, name: column.name, category: column.category, total: 0, columnIds: [] });
  }
  if (grouping === 'PRIORITY') groups = [...groups].sort((a, b) => PRIORITIES.findIndex(p => p.value === a.id) - PRIORITIES.findIndex(p => p.value === b.id));
  if (grouping === 'TYPE') groups = [...groups].sort((a, b) => types.findIndex(t => t.code === a.id) - types.findIndex(t => t.code === b.id));
  if (grouping === 'NONE') groups = [{ id: 'all', name: '전체 업무', total: groups.reduce((sum, group) => sum + group.total, 0), columnIds: [] }];
  return groups;
}
