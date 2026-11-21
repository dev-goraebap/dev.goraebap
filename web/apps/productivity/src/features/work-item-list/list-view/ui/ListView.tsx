import { useWorkItemTypes, type BoardColumn, type WorkItemRow as Row, type WorkItemViewGrouping } from '@/entities/work-item';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { groupWorkItems } from '../../model/groups';
import { WorkItemGroupView } from './WorkItemGroupView';
import { WorkItemTree } from './WorkItemTree';

/**
 * Work items as Linear's list: grouped as the view says (status by default, a project's by its columns; an empty group left
 * out), each group under a header that folds it, or one plain list when grouped by none. A row is its priority,
 * reference, status and title, then its labels, project (across projects), due date, person and last change; a phone's
 * rows are compact. A row opens its work item at hrefOf.
 */
export function ListView({ workItems, grouping = 'STATUS', columns, foldedGroups = [], selectedId, showsProject, hrefOf, onCreate }: {
  workItems: readonly Row[];
  grouping?: WorkItemViewGrouping;
  /** 실제 상태 목록. 전역에서는 이름과 단계가 같은 상태를 합친다. */
  columns?: readonly BoardColumn[];
  /** The groups that start folded (완료, say), by id. */
  foldedGroups?: string[];
  /** The work item open beside the list, its row marked. */
  selectedId?: string;
  showsProject?: boolean;
  hrefOf?: (workItem: Row) => string;
  /** With it each group's header has a + that makes a work item in that group. */
  onCreate?: (groupId: string) => void;
}) {
  const isPhone = useIsMobile();
  const { types } = useWorkItemTypes();
  const groups = groupWorkItems(workItems, grouping, columns, types, showsProject);
  if (grouping === 'NONE') return <WorkItemTree items={workItems} isPhone={isPhone} selectedId={selectedId} showsProject={showsProject} hrefOf={hrefOf} />;
  return <div className="flex flex-col">
    {groups.map(group => <WorkItemGroupView key={group.id || '-'} group={group} count={group.workItems.length}
      isInitiallyOpen={!foldedGroups.includes(group.id)} onCreate={onCreate}>
      <WorkItemTree items={group.workItems} allItems={workItems} isPhone={isPhone} selectedId={selectedId} showsProject={showsProject} hrefOf={hrefOf} />
    </WorkItemGroupView>)}
  </div>;
}
