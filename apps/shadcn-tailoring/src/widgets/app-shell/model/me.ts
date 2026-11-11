import { departmentOf, ME_ID, memberPicture, useMember } from "@/entities/member"
import { useNotifications } from "@/entities/notification"

/** 셸이 보이는 나(내 박스 · 아바타). 구성원 목록의 내 줄을 읽으므로 내 정보에서 바꾼 그림이 바로 따라온다. 읽는 동안 undefined. */
export function useMe() {
  const { data: member } = useMember(ME_ID)
  if (!member) return undefined
  return { name: member.name, team: departmentOf(member.departmentId)?.name ?? "", initials: member.name.slice(-2), picture: memberPicture(member) }
}

/** 읽지 않은 알림 수(알림함 옆 숫자). */
export function useUnreadCount() {
  const { data } = useNotifications()
  return data?.filter(notification => notification.isUnread).length ?? 0
}
