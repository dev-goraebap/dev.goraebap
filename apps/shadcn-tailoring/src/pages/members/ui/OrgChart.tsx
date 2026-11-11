import { byDepartmentOrder, DEPARTMENTS, MemberAvatar, roleOf, type Department, type Member } from "@/entities/member"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"

/** 한 상자에 보이는 사람 수. 넘으면 "외 N명". */
const MAX_LINES = 10

/**
 * 부서 상자(호호코워크 PyramidNode): 이름 · 사람 수 · 하위 부서 수, 아래에 사람(부서장 먼저, 표식)이 한 줄씩.
 * 사람을 누르면 프로필이 열린다.
 */
function DepartmentBox({ department, members, childCount, onOpen }: {
  department: Department; members: Member[]; childCount: number; onOpen: (id: string) => void
}) {
  const own = members.filter(member => member.departmentId === department.id).sort(byDepartmentOrder)
  return (
    <section aria-label={department.name} className="flex w-full flex-col rounded-xl border bg-card text-card-foreground shadow-xs md:w-46">
      <header className="flex flex-col border-b px-3 py-2">
        <h3 className="truncate font-semibold">{department.name}</h3>
        <p className="text-xs text-muted-foreground tabular-nums">{own.length}명{childCount > 0 && ` · 하위 ${childCount}개`}</p>
      </header>
      <ul className="flex flex-col p-1">
        {own.slice(0, MAX_LINES).map(member => (
          <li key={member.id}>
            <button type="button" onClick={() => onOpen(member.id)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs outline-none hover:bg-row-hover focus-visible:ring-3 focus-visible:ring-ring/50 max-md:min-h-11 max-md:text-sm">
              <MemberAvatar member={member} className="size-4 max-md:size-6" />
              <span className="min-w-0 flex-1 truncate">{member.name}<span className="text-muted-foreground"> · {roleOf(member)}</span></span>
              {department.lead === member.id && <Badge variant="label">부서장</Badge>}
            </button>
          </li>
        ))}
        {own.length > MAX_LINES && <li className="px-2 py-1 text-xs text-muted-foreground">외 {own.length - MAX_LINES}명</li>}
      </ul>
    </section>
  )
}

/** 줄기: 위 상자에서 아래 상자들로 내려가는 선. 데스크톱만 그린다(휴대폰은 위아래로 쌓는다). */
const STEM = "md:before:absolute md:before:top-0 md:before:left-1/2 md:before:h-6 md:before:w-px md:before:bg-border"
/** 가지: 형제 상자들을 잇는 가로선. 첫 상자는 가운데부터, 끝 상자는 가운데까지. */
const BRANCH = "md:after:absolute md:after:top-0 md:after:right-0 md:after:left-0 md:after:h-px md:after:bg-border md:first:after:left-1/2 md:last:after:right-1/2 md:only:after:hidden"

/** 부서 하나와 그 아래 부서들(재귀). */
function Branch({ department, members, onOpen }: { department: Department; members: Member[]; onOpen: (id: string) => void }) {
  const children = DEPARTMENTS.filter(each => each.parent === department.id)
  return (
    <div className="flex flex-col items-center">
      <DepartmentBox department={department} members={members} childCount={children.length} onOpen={onOpen} />
      {children.length > 0 && (
        <>
          <span aria-hidden className="h-3 w-px bg-border md:h-6" />
          <ul className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:gap-0">
            {children.map(child => (
              <li key={child.id} className={cn("relative flex justify-center md:px-1.5 md:pt-6", STEM, BRANCH)}>
                <Branch department={child} members={members} onOpen={onOpen} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

/**
 * 조직도(호호코워크 department-pyramid를 보기용으로): 맨 위 부서부터 아래로 피라미드. 데스크톱은 가로로 펼치고 넘치면
 * 이 영역 안에서 가로로 넘긴다. 휴대폰은 상자를 위아래로 쌓는다. 부서장과 사람 수는 상자에 있다.
 */
export function OrgChart({ members, onOpen }: { members: Member[]; onOpen: (id: string) => void }) {
  return (
    <div className="overflow-x-auto px-4 py-6 md:py-10">
      <div className="mx-auto flex w-full flex-col items-center gap-6 md:w-max">
        {DEPARTMENTS.filter(department => !department.parent).map(department => (
          <Branch key={department.id} department={department} members={members} onOpen={onOpen} />
        ))}
      </div>
    </div>
  )
}
