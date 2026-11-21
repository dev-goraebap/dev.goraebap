import { useState, type ReactNode } from 'react';
import { ListGroupHeader } from '@/shared/ui/kit/list-group-header';
import type { WorkItemGroup } from '../../model/groups';

/** One group of the list: its band (fold chevron, mark, name, count, and a + that makes a work item in it), then its rows. */
export function WorkItemGroupView({ group, count, isInitiallyOpen = true, onCreate, children }: {
  group: Pick<WorkItemGroup, 'id' | 'label' | 'icon'>; count: number; isInitiallyOpen?: boolean;
  onCreate?: (groupId: string) => void; children: ReactNode;
}) {
  const [isOpen, setOpen] = useState(isInitiallyOpen);
  return <section aria-label={group.label} className="flex flex-col">
    <ListGroupHeader label={group.label} count={count} icon={group.icon} isOpen={isOpen} onToggle={() => setOpen(open => !open)}
      createLabel={`${group.label}에 업무 만들기`} onCreate={onCreate ? () => onCreate(group.id) : undefined} />
    {isOpen ? children : null}
  </section>;
}
