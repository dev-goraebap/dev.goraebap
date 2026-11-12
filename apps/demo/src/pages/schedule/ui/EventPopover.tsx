import { useNavigate } from "@tanstack/react-router"
import { cloneElement, useState, type ReactElement, type ReactNode } from "react"
import { EventDot, eventCategory, eventHref, eventWhen, type CalendarEvent } from "@/entities/event"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { AdaptivePopover } from "@/shared/ui/adaptive-popover"
import { Button } from "@/shared/ui/button"
import { ClockIcon, MapPinIcon, MaximizeIcon, TagIcon, type Icon } from "@/shared/ui/icon"

/**
 * 일정을 누르면 뜨는 요약(데스크톱 팝오버). 머리의 크게 보기는 팝오버를 닫고 그 일정의 페이지(/schedule/events/{id})로 간다.
 * 휴대폰은 요약 시트를 거치지 않고 바로 그 페이지로 간다(호호코워크 휴대폰 달력의 onEvent: 일정 줄이 그 일정을 연다).
 */
export function EventPopover({ event, trigger }: { event: CalendarEvent; trigger: ReactElement<{ onClick?: () => void }> }) {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const [isOpen, setOpen] = useState(false)
  const expand = () => {
    setOpen(false)
    void navigate({ href: eventHref(event.id) })
  }
  if (isMobile) return cloneElement(trigger, { onClick: expand })
  return (
    <AdaptivePopover title={event.title} trigger={trigger} open={isOpen} onOpenChange={setOpen} className="w-80 p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <p className="min-w-0 flex-1 pt-0.5 text-base font-semibold">{event.title}</p>
          <Button variant="ghost" size="icon-sm" aria-label="크게 보기" title="크게 보기" onClick={expand} className="-mt-1 -mr-1.5">
            <MaximizeIcon />
          </Button>
        </div>
        <dl className="flex flex-col gap-2 text-sm">
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
