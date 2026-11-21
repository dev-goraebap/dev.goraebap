import { PRIORITIES, workItemsOptions, type BoardColumn, type WorkItemBoardGroup, type WorkItemListing, type WorkItemTypeRow,
  type WorkItemViewGrouping } from '@/entities/work-item';
import { listingForGroup } from './board-query';
import { statusLanes } from './status-lanes';

export function listGroupsInOrder(groups: readonly WorkItemBoardGroup[], grouping: WorkItemViewGrouping,
  columns: readonly BoardColumn[], types: readonly WorkItemTypeRow[], workspace: boolean) {
  switch (grouping) {
    case 'STATUS': return byOrder(groups, statusLanes([], columns, workspace).map(lane => lane.column.id));
    case 'PRIORITY': return byOrder(groups, PRIORITIES.map(priority => priority.value));
    case 'TYPE': return byOrder(groups, types.map(type => type.code));
    case 'ASSIGNEE': return [...groups].sort((a, b) =>
      Number(a.id === 'none') - Number(b.id === 'none') || a.name.localeCompare(b.name, 'ko'));
    case 'PROJECT': return [...groups].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    default: return groups;
  }
}

function byOrder(groups: readonly WorkItemBoardGroup[], ids: readonly string[]) {
  const rank = new Map(ids.map((id, index) => [id, index]));
  return [...groups].sort((a, b) => (rank.get(a.id) ?? ids.length) - (rank.get(b.id) ?? ids.length));
}

export function listGroupPageOptions(key: string | undefined, listing: WorkItemListing,
  grouping: WorkItemViewGrouping, group: WorkItemBoardGroup) {
  return {
    ...workItemsOptions(key, listingForGroup(listing, grouping, group), 30),
    placeholderData: undefined,
    meta: { keepsPageVisible: true },
  };
}
