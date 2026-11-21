import { useState } from 'react';
import { WorkItemListRow, type WorkItemRow } from '@/entities/work-item';
import { WorkItemRowMenu } from '../../ui/WorkItemRowMenu';
import { workItemTree } from '../model/tree';

export function WorkItemTree({ items, allItems = items, isPhone, selectedId, showsProject, hrefOf }: {
  items: readonly WorkItemRow[]; allItems?: readonly WorkItemRow[]; isPhone: boolean; selectedId?: string;
  showsProject?: boolean; hrefOf?: (item: WorkItemRow) => string;
}) {
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const ids = new Set(items.map(item => item.id));
  return <ul className="flex flex-col">
    {workItemTree(items, closed).map(({ item, depth, children }) => {
      const parent = allItems.find(candidate => candidate.id === item.parentId);
      return <WorkItemListRow key={item.id} workItem={item} isCompact={isPhone} isSelected={item.id === selectedId}
        showsProject={showsProject} href={hrefOf?.(item)} actions={<WorkItemRowMenu workItem={item} href={hrefOf?.(item)} />}
        tree={{ depth, children, isOpen: !closed.has(item.id),
          parentLabel: item.parentId && !ids.has(item.parentId) ? parent ? `${parent.ref}의 하위 업무` : '하위 업무' : undefined,
          onToggle: () => setClosed(current => { const next = new Set(current); if (next.has(item.id)) next.delete(item.id); else next.add(item.id); return next; }) }} />;
    })}
  </ul>;
}
