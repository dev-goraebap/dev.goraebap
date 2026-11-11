import { useState } from "react"
import type { WorkItem } from "@/entities/work-item"
import { ListGroupHeader } from "@/shared/ui/list-group-header"
import type { WorkItemGroup } from "../model/filters"
import { WorkItemRow } from "./WorkItemRow"

/** 리스트 뷰: 그룹마다 머리와 줄들. 그룹은 접을 수 있다. 그룹이 하나(없음)면 머리 없이 줄만 둔다. */
export function WorkItemListView({ groups, isCompact, onCreateIn }: {
  groups: WorkItemGroup[]; isCompact: boolean; onCreateIn?: (groupId: string) => void
}) {
  const [closed, setClosed] = useState<Set<string>>(new Set())
  const toggle = (id: string) => setClosed(current => {
    const next = new Set(current)
    if (!next.delete(id)) next.add(id)
    return next
  })
  if (groups.length === 1 && groups[0].id === "all") return <Rows items={groups[0].items} isCompact={isCompact} />
  return (
    <>
      {groups.map(group => (
        <section key={group.id} aria-label={group.label} className="flex flex-col">
          <ListGroupHeader label={group.label} icon={group.icon} count={group.items.length} isOpen={!closed.has(group.id)} onToggle={() => toggle(group.id)}
            createLabel={`${group.label}에 업무 만들기`} onCreate={onCreateIn && (() => onCreateIn(group.id))} />
          {!closed.has(group.id) && <Rows items={group.items} isCompact={isCompact} />}
        </section>
      ))}
    </>
  )
}

export function Rows({ items, isCompact }: { items: WorkItem[]; isCompact: boolean }) {
  return (
    <ul className="flex flex-col">
      {items.map(item => <WorkItemRow key={item.id} item={item} isCompact={isCompact} />)}
    </ul>
  )
}
