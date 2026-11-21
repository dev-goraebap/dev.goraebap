import { useState } from 'react';
import { WorkItemListRow, type WorkItemRow as Row } from '@/entities/work-item';
import { WorkItemRowMenu } from '../../ui/WorkItemRowMenu';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { WorkItemTable } from './WorkItemTable';

/**
 * Work items as a table: number, title with its status, project (across projects), assignee, priority, labels, due date and
 * the last change, a checkbox per row. On a phone the columns would crowd, so the same work items are compact rows instead.
 * The selection is the caller's when it passes one, the view's own otherwise.
 */
export function TableView({ workItems, selected, showsProject, hrefOf, onSelectedChange }: {
  workItems: Row[];
  /** The ids of the chosen rows. */
  selected?: ReadonlySet<string>;
  showsProject?: boolean;
  hrefOf?: (workItem: Row) => string;
  onSelectedChange?: (ids: ReadonlySet<string>) => void;
}) {
  const isPhone = useIsMobile();
  const [own, setOwn] = useState<ReadonlySet<string>>(() => new Set());
  const chosen = selected ?? own;
  const choose = (ids: ReadonlySet<string>) => { if (!selected) setOwn(ids); onSelectedChange?.(ids); };
  if (isPhone) return <ul className="flex flex-col">
    {workItems.map(workItem => <WorkItemListRow key={workItem.id} workItem={workItem} isCompact showsProject={showsProject}
      isSelected={chosen.has(workItem.id)} href={hrefOf?.(workItem)} actions={<WorkItemRowMenu workItem={workItem} href={hrefOf?.(workItem)} />} />)}
  </ul>;
  // 표 상자가 따로 넘기지 않게 한다: 넘기는 상자가 생기면 머리 줄이 그 상자에 붙어, 페이지를 내려도 위에 남지 않는다.
  return <div className="*:data-[slot=table-container]:overflow-visible">
    <WorkItemTable workItems={workItems} selected={chosen} showsProject={showsProject} hrefOf={hrefOf} onSelect={choose} />
  </div>;
}
