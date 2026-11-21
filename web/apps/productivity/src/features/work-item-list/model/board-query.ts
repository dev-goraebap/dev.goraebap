import type { WorkItemBoardGroup, WorkItemListing, WorkItemViewGrouping } from '@/entities/work-item';

/** 집계로 확인한 한 그룹으로만 좁히고 다른 조건·정렬은 보존한다. */
export function listingForGroup(listing: WorkItemListing, grouping: WorkItemViewGrouping, group: WorkItemBoardGroup): WorkItemListing {
  switch (grouping) {
    case 'STATUS': return { ...listing, columnId: group.columnIds.join(',') };
    case 'PRIORITY': return { ...listing, priority: group.id };
    case 'TYPE': return { ...listing, type: group.id };
    case 'ASSIGNEE': return { ...listing, assignee: group.id };
    case 'PROJECT': return { ...listing, project: group.id };
    case 'NONE': return { ...listing };
  }
}
