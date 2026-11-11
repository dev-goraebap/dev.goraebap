import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { PersonAvatar } from "@/shared/ui/person-avatar"
import { memberPicture, statusMark } from "../model/marks"
import type { Member, MemberStatus } from "../model/types"

/** 구성원 아바타: 고른 그림, 없으면 아이디로 정해지는 그림. 크기는 className으로(기본 20px). */
export function MemberAvatar({ member, className }: { member: Member; className?: string }) {
  return <PersonAvatar id={member.id} name={member.name} picture={memberPicture(member)} className={className} />
}

/** 상태의 색 점. */
export function MemberStatusDot({ status, className }: { status: MemberStatus; className?: string }) {
  return <span aria-hidden className={cn("size-2 shrink-0 rounded-full", statusMark(status).dot, className)} />
}

/** 상태 알약: 색 점 + 이름(라벨 알약과 같은 모양). */
export function MemberStatusBadge({ status }: { status: MemberStatus }) {
  return (
    <Badge variant="label">
      <MemberStatusDot status={status} className="size-1.5" />
      {statusMark(status).label}
    </Badge>
  )
}
