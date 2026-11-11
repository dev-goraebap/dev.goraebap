import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"
import {
  byDepartmentOrder, departmentOf, ME_ID, MemberAvatar, MemberStatusBadge, roleOf, useMembers, type Member,
} from "@/entities/member"
import { paths } from "@/shared/config"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { CalendarIcon, LetterIcon, PhoneIcon, StructureIcon, UserIcon, type Icon } from "@/shared/ui/icon"

/** 사실 한 줄: 아이콘 · 이름 · 값. */
function Fact({ icon: FactIcon, label, children }: { icon: Icon; label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-9 items-center gap-3">
      <dt className="flex w-24 shrink-0 items-center gap-2 text-muted-foreground"><FactIcon className="text-icon-muted" />{label}</dt>
      <dd className="min-w-0 truncate">{children}</dd>
    </div>
  )
}

/** 같은 부서 사람 한 줄. 누르면 그 사람의 프로필로 이어 연다. */
function Colleague({ member, isLead, onOpen }: { member: Member; isLead: boolean; onOpen: (id: string) => void }) {
  return (
    <li>
      <button type="button" onClick={() => onOpen(member.id)}
        className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left outline-none hover:bg-row-hover focus-visible:ring-3 focus-visible:ring-ring/50 max-md:min-h-12">
        <MemberAvatar member={member} className="size-7" />
        <span className="min-w-0 flex-1 truncate">{member.name}<span className="text-muted-foreground"> · {roleOf(member)}</span></span>
        {isLead && <Badge variant="label">부서장</Badge>}
      </button>
    </li>
  )
}

/**
 * 구성원의 프로필(호호코워크 PersonProfile): 큰 그림 · 이름 · 부서 · 직위와 표식(나 · 부서장), 연락처와 인사 사실,
 * 같은 부서 사람(누르면 onOpenMember로 이어 연다). 내 프로필이면 내 정보로 가는 버튼. 대화상자와 페이지가 같이 쓴다.
 */
export function PersonProfile({ member, onOpenMember }: { member: Member; onOpenMember: (id: string) => void }) {
  const { data: members = [] } = useMembers()
  const department = departmentOf(member.departmentId)
  const isLead = department?.lead === member.id
  const isSelf = member.id === ME_ID
  const colleagues = members.filter(each => each.departmentId === member.departmentId && each.id !== member.id).sort(byDepartmentOrder)
  return (
    <div className="flex flex-col gap-6">
      <section className="flex items-center gap-4 rounded-xl bg-muted p-4">
        <MemberAvatar member={member} className="size-18" />
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="truncate text-xl font-semibold">{member.name}</h2>
          <p className="truncate text-muted-foreground">{[department?.name, roleOf(member)].filter(Boolean).join(" · ")}</p>
          {(isSelf || isLead) && (
            <div className="flex flex-wrap gap-1">
              {isSelf && <Badge variant="label">나</Badge>}
              {isLead && <Badge variant="label">{department?.name} 부서장</Badge>}
            </div>
          )}
        </div>
      </section>
      <dl className="flex flex-col text-sm">
        <Fact icon={UserIcon} label="상태"><MemberStatusBadge status={member.status} /></Fact>
        <Fact icon={LetterIcon} label="업무 이메일">
          <a href={`mailto:${member.email}`} className="underline-offset-4 hover:underline">{member.email}</a>
        </Fact>
        <Fact icon={PhoneIcon} label="휴대전화">
          <a href={`tel:${member.phone}`} className="tabular-nums underline-offset-4 hover:underline">{member.phone}</a>
        </Fact>
        <Fact icon={StructureIcon} label="직급">{member.rank}{member.position && <span className="text-muted-foreground"> · {member.position}</span>}</Fact>
        <Fact icon={CalendarIcon} label="입사일"><span className="tabular-nums">{member.joinedAt.replaceAll("-", ". ")}</span></Fact>
      </dl>
      {colleagues.length > 0 && (
        <section aria-labelledby={`colleagues-${member.id}`} className="flex flex-col gap-2">
          <h3 id={`colleagues-${member.id}`} className="text-sm font-medium text-muted-foreground">
            {department?.name} <span className="tabular-nums">{colleagues.length}</span>명
          </h3>
          <ul className="-mx-2 flex flex-col">
            {colleagues.map(each => <Colleague key={each.id} member={each} isLead={department?.lead === each.id} onOpen={onOpenMember} />)}
          </ul>
        </section>
      )}
      {isSelf && (
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" nativeButton={false} render={<Link to={paths.profile} />}>
            <UserIcon data-icon="inline-start" />내 정보로
          </Button>
        </div>
      )}
    </div>
  )
}
