import { departmentOf, MemberAvatar, MemberStatusBadge, type Member } from "@/entities/member"
import { Badge } from "@/shared/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

/** 줄은 자기 바탕을 칠해 페이지의 점 무늬를 가리고, 가리키면 옅게 덮는다. */
const ROW_SURFACE = "relative bg-background hover:bg-row-hover"

const dash = (value?: string) => value || <span className="text-muted-foreground">-</span>

/**
 * 데스크톱의 구성원 표(호호코워크 MembersTable): 이름(그림 · 부서장 표식) · 부서 · 직급 · 직위 · 이메일 · 상태.
 * 이름 버튼의 ::after가 줄 전체를 덮어 줄 어디를 눌러도 프로필이 열린다. 머리 줄은 위에 붙는다.
 */
export function MembersTable({ members, onOpen }: { members: Member[]; onOpen: (id: string) => void }) {
  return (
    <Table className="bg-background">
      <TableHeader className="sticky top-0 z-10 bg-background">
        <TableRow className="hover:bg-transparent">
          <TableHead className="h-11 pl-4 text-muted-foreground">이름</TableHead>
          <TableHead className="w-40 text-muted-foreground">부서</TableHead>
          <TableHead className="w-26 text-muted-foreground">직급</TableHead>
          <TableHead className="w-26 text-muted-foreground">직위</TableHead>
          <TableHead className="text-muted-foreground">이메일</TableHead>
          <TableHead className="w-28 pr-4 text-muted-foreground">상태</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map(member => {
          const department = departmentOf(member.departmentId)
          return (
            <TableRow key={member.id} className={ROW_SURFACE}>
              <TableCell className="h-12.25 pl-4 compact:h-10.25">
                <span className="flex min-w-0 items-center gap-2">
                  <MemberAvatar member={member} className="size-6" />
                  <button type="button" onClick={() => onOpen(member.id)}
                    className="truncate font-medium outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring">
                    {member.name}
                  </button>
                  {department?.lead === member.id && <Badge variant="label">부서장</Badge>}
                </span>
              </TableCell>
              <TableCell className="truncate">{dash(department?.name)}</TableCell>
              <TableCell>{dash(member.rank)}</TableCell>
              <TableCell>{dash(member.position)}</TableCell>
              <TableCell className="max-w-64 truncate text-muted-foreground">{member.email}</TableCell>
              <TableCell className="pr-4"><MemberStatusBadge status={member.status} /></TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
