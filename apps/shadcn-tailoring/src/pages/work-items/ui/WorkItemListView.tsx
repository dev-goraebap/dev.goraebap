import { useState } from "react"
import { cn } from "cn"
import type { WorkItem } from "@/entities/work-item"
import { Button } from "@/shared/ui/button"
import { ChevronDownIcon, PlusIcon } from "@/shared/ui/icon"
import type { WorkItemGroup } from "../model/filters"
import { WorkItemRow } from "./WorkItemRow"

/** 그룹 머리 띠 색: 페이지 면에 muted를 55% 섞은 불투명 띠(줄이 밑으로 지나가도 비치지 않게). */
export const GROUP_BAND = "bg-[color-mix(in_srgb,var(--muted)_55%,var(--background))]"

/**
 * 그룹 머리(호호코워크 ListGroupHeader): 접기 꺾쇠 · 표식 · 이름 · 개수, 오른쪽 +. 스크롤해도 위에 붙는다.
 * 데스크톱 36px, 휴대폰 52px.
 */
function GroupHeader({ group, isOpen, onToggle, onCreate }: {
  group: WorkItemGroup; isOpen: boolean; onToggle: () => void; onCreate?: () => void
}) {
  return (
    <header className={cn("sticky top-0 z-10 flex h-13 shrink-0 items-center justify-between gap-2 border-b px-2 md:h-9", GROUP_BAND)}>
      <button type="button" aria-expanded={isOpen} aria-label={`${group.label} ${group.items.length}개`} onClick={onToggle}
        className="flex h-6 items-center gap-2 rounded-full px-2 text-sm font-medium outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 max-md:h-11">
        <ChevronDownIcon className={cn("shrink-0 transition-transform", !isOpen && "-rotate-90")} />
        {group.icon}
        <span>{group.label}</span>
        <span className="font-normal text-muted-foreground tabular-nums">{group.items.length}</span>
      </button>
      {onCreate && (
        <Button variant="ghost" size="icon-xs" aria-label={`${group.label}에 업무 만들기`} onClick={onCreate} className="max-md:size-11">
          <PlusIcon />
        </Button>
      )}
    </header>
  )
}

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
          <GroupHeader group={group} isOpen={!closed.has(group.id)} onToggle={() => toggle(group.id)}
            onCreate={onCreateIn && (() => onCreateIn(group.id))} />
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
