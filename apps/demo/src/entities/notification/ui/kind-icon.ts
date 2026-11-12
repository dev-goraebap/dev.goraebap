import { CalendarIcon, InboxInIcon, ListChecksIcon, MegaphoneIcon, type Icon } from "@/shared/ui/icon"
import type { NotificationKind } from "../model/types"

/** 알림 종류의 아이콘(호호코워크: 결재 received · 공지 notice · 일정 calendar · 업무 checklist). */
export const kindIcon: Record<NotificationKind, Icon> = {
  approval: InboxInIcon,
  notice: MegaphoneIcon,
  event: CalendarIcon,
  mention: ListChecksIcon,
}
