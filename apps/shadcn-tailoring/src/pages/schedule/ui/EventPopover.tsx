import type { ReactElement, ReactNode } from "react"
import { EventDot, eventCategory, eventWhen, type CalendarEvent } from "@/entities/event"
import { AdaptivePopover } from "@/shared/ui/adaptive-popover"
import { ClockIcon, MapPinIcon, TagIcon, type Icon } from "@/shared/ui/icon"

/** 일정을 누르면 뜨는 요약. 데스크톱은 팝오버, 휴대폰은 바텀시트(시트가 제목을 보이므로 본문의 제목은 데스크톱에만). */
export function EventPopover({ event, trigger }: { event: CalendarEvent; trigger: ReactElement }) {
  return (
    <AdaptivePopover title={event.title} trigger={trigger} className="w-80 p-4">
      <div className="flex flex-col gap-3">
        <p className="text-base font-semibold max-md:hidden">{event.title}</p>
        <dl className="flex flex-col gap-2 text-sm max-md:gap-3 max-md:px-1">
          <SummaryRow icon={ClockIcon} label="때">{eventWhen(event)}</SummaryRow>
          {event.location && <SummaryRow icon={MapPinIcon} label="곳">{event.location}</SummaryRow>}
          <SummaryRow icon={TagIcon} label="분류">
            <span className="flex items-center gap-1.5"><EventDot category={event.category} />{eventCategory(event.category).label}</span>
          </SummaryRow>
        </dl>
      </div>
    </AdaptivePopover>
  )
}

function SummaryRow({ icon: RowIcon, label, children }: { icon: Icon; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <dt className="flex h-5 shrink-0 items-center text-icon-muted"><RowIcon /><span className="sr-only">{label}</span></dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  )
}
