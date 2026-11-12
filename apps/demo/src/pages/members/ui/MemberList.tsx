import { useState } from "react"
import { DEPARTMENTS, MemberAvatar, MemberStatusDot, roleOf, statusMark, type Member } from "@/entities/member"
import { Badge } from "@/shared/ui/badge"
import { StructureIcon } from "@/shared/ui/icon"
import { ListGroupHeader } from "@/shared/ui/list-group-header"

/** 휴대폰의 구성원 한 줄: 그림 · 이름(부서장 표식) · 직위와 이메일, 끝에 상태 점. 누르면 프로필 페이지. */
function MemberRow({ member, isLead, onOpen }: { member: Member; isLead: boolean; onOpen: (id: string) => void }) {
  const status = statusMark(member.status)
  return (
    <li className="border-b">
      <button type="button" onClick={() => onOpen(member.id)}
        className="flex w-full items-center gap-3 bg-background px-4 py-3 text-left outline-none hover:bg-row-hover focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset">
        <MemberAvatar member={member} className="size-9" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-1.5">
            <span className="truncate font-medium">{member.name}</span>
            {isLead && <Badge variant="label">부서장</Badge>}
          </span>
          <span className="truncate text-sm text-muted-foreground">{roleOf(member)} · {member.email}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
          <MemberStatusDot status={member.status} />{status.label}
        </span>
      </button>
    </li>
  )
}

/** 휴대폰의 구성원 목록(호호코워크 PeopleList): 부서마다 묶음 머리(접기 · 사람 수) 아래 줄. 부서장이 먼저다. */
export function MemberList({ members, onOpen }: { members: Member[]; onOpen: (id: string) => void }) {
  const [closed, setClosed] = useState<Set<string>>(new Set())
  const toggle = (id: string) => setClosed(current => {
    const next = new Set(current)
    if (!next.delete(id)) next.add(id)
    return next
  })
  return (
    <div className="flex flex-col">
      {DEPARTMENTS.map(department => {
        const own = members.filter(member => member.departmentId === department.id)
        if (own.length === 0) return null
        const isOpen = !closed.has(department.id)
        return (
          <section key={department.id} aria-label={department.name}>
            <ListGroupHeader label={department.name} icon={<StructureIcon className="text-icon-muted" />} count={own.length}
              isOpen={isOpen} onToggle={() => toggle(department.id)} />
            {isOpen && (
              <ul>
                {own.map(member => <MemberRow key={member.id} member={member} isLead={department.lead === member.id} onOpen={onOpen} />)}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
