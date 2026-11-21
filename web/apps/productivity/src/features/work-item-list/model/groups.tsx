import { PersonAvatar } from '@/shared/ui/person';
import { ProjectsIcon, UserIcon } from '@/shared/ui/kit/icon';
import type { ReactNode } from 'react';
import {
  PRIORITIES, WorkItemPriorityIcon, WorkItemStatusIcon, WorkItemTypeIcon,
  type BoardColumn, type WorkItemRow, type WorkItemTypeRow, type WorkItemViewGrouping,
} from '@/entities/work-item';
import { statusLanes } from './status-lanes';

export type WorkItemGroup = { id: string; label: string; icon: ReactNode; workItems: WorkItemRow[] };

/**
 * The work items in groups, as client/'s groupingOf (BIT's D-106), in each grouping's order: status by a project's columns
 * in the board's order (across the workspace by what they mean), priorities from urgent, types, people by name (nobody
 * last), projects by name. Empty groups are left out; NONE gives no groups.
 */
export function groupWorkItems(workItems: readonly WorkItemRow[], grouping: WorkItemViewGrouping, columns?: readonly BoardColumn[],
  types: readonly WorkItemTypeRow[] = [], workspace = false): WorkItemGroup[] {
  const groups = (list: { id: string; label: string; icon: ReactNode }[], groupOf: (workItem: WorkItemRow) => string): WorkItemGroup[] =>
    list.map(group => ({ ...group, workItems: workItems.filter(workItem => groupOf(workItem) === group.id) })).filter(group => group.workItems.length > 0);
  switch (grouping) {
    case 'STATUS':
      return statusLanes(workItems, columns, workspace).filter(lane => lane.workItems.length > 0).map(({ column, workItems: rows }) => ({
        id: column.id, label: column.name, icon: <WorkItemStatusIcon category={column.category} label={column.name} />, workItems: rows,
      }));
    case 'PRIORITY':
      return groups(PRIORITIES.map(priority => ({ id: priority.value, label: priority.label === '없음' ? '우선순위 없음' : priority.label,
        icon: <WorkItemPriorityIcon priority={priority.value} /> })), workItem => workItem.priority);
    case 'TYPE':
      return groups(types.map(type => ({ id: type.code, label: type.name, icon: <WorkItemTypeIcon type={type.code} /> })), workItem => workItem.type);
    case 'ASSIGNEE': {
      const people = new Map<string, string>();
      for (const workItem of workItems) if (workItem.assigneeId) people.set(workItem.assigneeId, workItem.assigneeName ?? '이름 없음');
      const named = [...people].sort(([, one], [, other]) => one.localeCompare(other, 'ko')).map(([id, name]) => ({
        id, label: name, icon: <PersonAvatar id={id} name={name} size="xsm" isStatic />,
      }));
      return groups([...named, { id: '', label: '담당자 없음', icon: <UserIcon className="shrink-0 text-icon-muted opacity-50" /> }], workItem => workItem.assigneeId ?? '');
    }
    case 'PROJECT': {
      const projects = new Map<string, string>();
      for (const workItem of workItems) projects.set(workItem.projectKey, workItem.projectName);
      return groups([...projects].sort(([, one], [, other]) => one.localeCompare(other, 'ko'))
        .map(([key, name]) => ({ id: key, label: name, icon: <ProjectsIcon className="shrink-0 text-icon-muted" /> })), workItem => workItem.projectKey);
    }
    case 'NONE':
      return [];
  }
}
