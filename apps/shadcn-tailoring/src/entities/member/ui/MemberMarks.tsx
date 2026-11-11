import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import { memberPicture, statusMark } from "../model/marks"
import type { Member, MemberStatus } from "../model/types"

/**
 * 구성원 아바타: 고른 그림, 없으면 아이디로 정해지는 그림. 크기는 className으로(기본 20px).
 * shared PersonAvatar는 Avatar size="sm"으로 고정되어 data-[size=sm]:size-6이 24px보다 큰 className을 이기므로,
 * 24px를 넘는 자리(프로필 · 내 정보 · 휴대폰 줄)는 크기 변형 없는 Avatar로 그린다.
 */
export function MemberAvatar({ member, className }: { member: Member; className?: string }) {
  return (
    <Avatar className={cn("size-5", className)}>
      <AvatarImage src={memberPicture(member)} alt="" />
      <AvatarFallback className="text-[0.625rem] font-semibold">{member.name.slice(0, 1)}</AvatarFallback>
    </Avatar>
  )
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
