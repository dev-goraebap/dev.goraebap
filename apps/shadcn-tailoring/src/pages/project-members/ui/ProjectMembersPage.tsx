import { useMemo, useState } from "react"
import { departmentOf, MemberAvatar, useMembers, type Member } from "@/entities/member"
import { useCurrentProject } from "@/entities/project"
import { useAddProjectMember, useProjectMembers, useRemoveProjectMember, type ProjectMember } from "@/entities/project-member"
import { paths, projectPath } from "@/shared/config"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { ProjectsIcon, UsersIcon, XIcon } from "@/shared/ui/icon"
import { Page } from "@/shared/ui/page"
import { PageState } from "@/shared/ui/page-state"
import { Skeleton } from "@/shared/ui/skeleton"
import { toast } from "@/shared/ui/toast"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"
import { AddMemberDialog } from "./AddMemberDialog"

const day = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" })
/** 참여한 날(YYYY-MM-DD)을 그 날의 자정으로 읽는다. 그냥 Date에 넘기면 UTC로 읽혀 하루 앞설 수 있다. */
const joinedText = (joinedAt: string) => `${day.format(new Date(`${joinedAt}T00:00:00`))} 참여`

type Row = { membership: ProjectMember; member: Member }

/** 멤버 한 줄: 그림 · 이름(리드 표식) · 부서, 끝에 참여한 날과 빼기. 휴대폰은 줄과 버튼을 손가락 크기로 키운다. */
function MemberRow({ row, onRemove }: { row: Row; onRemove?: () => void }) {
  const { member, membership } = row
  const department = departmentOf(member.departmentId)?.name
  return (
    <li className="flex min-h-12 items-center gap-3 border-b bg-background px-4 py-2 max-md:min-h-16">
      <MemberAvatar member={member} className="size-6 max-md:size-9" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate font-medium">{member.name}</span>
          {membership.role === "lead" && <Badge variant="label">리드</Badge>}
        </span>
        {department && <span className="truncate text-sm text-muted-foreground">{department}</span>}
      </span>
      <span className="shrink-0 text-sm text-muted-foreground tabular-nums max-md:text-xs">{joinedText(membership.joinedAt)}</span>
      {onRemove && (
        <Tooltip>
          <TooltipTrigger render={
            <Button variant="ghost" size="icon-sm" aria-label={`${member.name} 빼기`} className="max-md:size-11" onClick={onRemove}>
              <XIcon />
            </Button>
          } />
          <TooltipContent>프로젝트에서 빼기</TooltipContent>
        </Tooltip>
      )}
    </li>
  )
}

function ListSkeleton() {
  return (
    <div aria-busy="true" aria-label="멤버를 불러오는 중" className="flex flex-col">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex h-12 items-center gap-3 border-b bg-background px-4 max-md:h-16">
          <Skeleton className="size-6 rounded-full max-md:size-9" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="ml-auto h-4 w-28" />
        </div>
      ))}
    </div>
  )
}

/**
 * 프로젝트의 멤버(호호코워크 ProjectMembersPage): 참여한 순서대로 부서와 참여한 날을 보인다. 관리자는 아직 없는 구성원을
 * 더하고(멤버 추가) 줄에서 뺀다. 보관한 프로젝트는 읽기만 한다. 이 앱은 사용자를 관리자로 본다.
 */
export function ProjectMembersPage() {
  const { key, project } = useCurrentProject()
  const memberships = useProjectMembers(key)
  const members = useMembers()
  const add = useAddProjectMember()
  const remove = useRemoveProjectMember()
  const [isAdding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<Row | null>(null)

  const byId = useMemo(() => new Map((members.data ?? []).map(member => [member.id, member])), [members.data])
  const rows = useMemo(() => (memberships.data ?? []).flatMap(membership => {
    const member = byId.get(membership.memberId)
    return member ? [{ membership, member }] : []
  }), [memberships.data, byId])
  const inside = new Set(rows.map(row => row.member.id))
  // 휴직도 재직 중이다. 이 목에는 퇴사한 사람이 없어 구성원 전체가 후보다.
  const outside = (members.data ?? []).filter(member => !inside.has(member.id))

  const canChange = !!project && project.status !== "archived"
  const openAdd = canChange ? () => setAdding(true) : undefined
  const crumbs = [
    { label: "프로젝트", href: paths.projects },
    { label: project?.name ?? key, icon: ProjectsIcon, href: projectPath(key) },
    { label: "멤버", icon: UsersIcon },
  ]

  const addMember = (memberId: string) => add.mutate({ projectKey: key, memberId }, {
    onSuccess: () => {
      setAdding(false)
      toast.add({ type: "success", title: "멤버를 추가했습니다", description: byId.get(memberId)?.name })
    },
    onError: error => toast.add({ type: "error", title: "추가하지 못했습니다", description: error.message }),
  })
  const removeMember = () => {
    if (!removing) return
    remove.mutate({ projectKey: key, memberId: removing.member.id }, {
      onSuccess: () => {
        toast.add({ type: "success", title: "프로젝트에서 뺐습니다", description: removing.member.name })
        setRemoving(null)
      },
      onError: error => toast.add({ type: "error", title: "빼지 못했습니다", description: error.message }),
    })
  }

  const body = () => {
    if (project === null) return <PageState kind="not-found" title="프로젝트를 찾을 수 없습니다" description="주소가 바뀌었거나 없는 프로젝트입니다." />
    if (memberships.isPending || members.isPending) return <ListSkeleton />
    if (rows.length === 0) {
      return (
        <PageState kind="empty" title="아직 멤버가 없습니다"
          description={openAdd ? "멤버 추가로 이 프로젝트에서 일하는 사람을 넣어 보세요." : "프로젝트 관리자가 멤버를 넣으면 여기에 보입니다."}
          action={openAdd && <Button variant="secondary" onClick={openAdd}>멤버 추가</Button>} />
      )
    }
    return (
      <>
        <ul aria-label="프로젝트 멤버">
          {rows.map(row => <MemberRow key={row.member.id} row={row} onRemove={canChange ? () => setRemoving(row) : undefined} />)}
        </ul>
        <p className="px-4 py-3 text-sm text-muted-foreground tabular-nums">{rows.length}명</p>
      </>
    )
  }

  return (
    <Page crumbs={crumbs} create={openAdd ? { label: "멤버 추가", onClick: openAdd } : undefined}>
      {body()}
      <AddMemberDialog open={isAdding} onOpenChange={setAdding} people={outside} isPending={add.isPending} onAdd={addMember} />
      <ConfirmDialog open={!!removing} onOpenChange={open => { if (!open) setRemoving(null) }}
        title={`${removing?.member.name ?? ""}님을 프로젝트에서 뺄까요?`}
        description="이 프로젝트의 멤버 목록에서만 빠집니다. 프로젝트는 계속 볼 수 있습니다."
        action={{ label: "빼기", onAction: removeMember, isPending: remove.isPending }} />
    </Page>
  )
}
