import { Link, useParams } from "@tanstack/react-router"
import { EventDot, eventCategory, eventWhen, useEvent, type CalendarEvent } from "@/entities/event"
import { paths } from "@/shared/config"
import { Button } from "@/shared/ui/button"
import { DetailSurface } from "@/shared/ui/detail-surface"
import { CalendarIcon, ClockIcon, MapPinIcon } from "@/shared/ui/icon"
import { InfoPill } from "@/shared/ui/info-pill"
import { PageState } from "@/shared/ui/page-state"
import { DetailLayout, type DetailSection } from "@/shared/ui/reading"
import { Skeleton } from "@/shared/ui/skeleton"

/** 속성(호호코워크 use-event-panel의 속성 묶음): 일시 · 장소 · 분류. 이 앱에서는 일정을 고치지 않으므로 모두 읽기 알약이다. */
function sectionsOf(event: CalendarEvent): DetailSection[] {
  return [{
    title: "속성",
    items: (
      <>
        <InfoPill label="일시" icon={<ClockIcon />}>{eventWhen(event)}</InfoPill>
        {event.location && <InfoPill label="장소" icon={<MapPinIcon />}>{event.location}</InfoPill>}
        <InfoPill label="분류" icon={<span className="grid size-3.5 place-items-center"><EventDot category={event.category} /></span>}>{eventCategory(event.category).label}</InfoPill>
      </>
    ),
  }]
}

/** 상세 면에는 점 무늬가 없다. 읽는 중 · 없음도 같은 바탕에 둔다. */
const PLAIN = "flex flex-1 flex-col bg-background"

function DetailSkeleton() {
  return (
    <div className={PLAIN}>
      <div aria-busy="true" aria-label="일정을 읽는 중" className="mx-auto flex w-full max-w-180 flex-col gap-4 px-4 pt-5 md:pt-8">
        <Skeleton className="h-10 w-3/5" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className={PLAIN}>
      <PageState kind="not-found" title="일정을 찾을 수 없습니다" description="삭제했거나 주소가 바뀐 일정입니다."
        action={<Button variant="secondary" nativeButton={false} render={<Link to={paths.schedule} />}>일정으로</Button>} />
    </div>
  )
}

/**
 * 일정 하나가 놓이는 곳(호호코워크 ScheduleEventPage + DetailSurface). page: 자기 페이지, 경로 일정 › 제목.
 * dialog: 데스크톱에서 하루 목록의 줄이 연 대화상자(달력 위), 머리에 크게 보기 · 닫기.
 * 본문은 상세 틀(DetailLayout)에 제목, 속성 알약, 적은 내용. 이 앱의 일정에는 본문이 없어 늘 빈 안내다.
 */
export function EventSurface({ id, surface, onClose, onExpand }: { id: string; surface: "dialog" | "page"; onClose?: () => void; onExpand?: () => void }) {
  const { data: event } = useEvent(id)
  return (
    <DetailSurface surface={surface} title="일정" onClose={onClose} onExpand={onExpand}
      crumbs={[{ label: "일정", href: paths.schedule }, { label: event?.title ?? "일정", icon: CalendarIcon }]}>
      {event === undefined ? <DetailSkeleton /> : event === null ? <NotFound /> : (
        <DetailLayout label={event.title} title={event.title} sections={sectionsOf(event)}>
          <p className="text-muted-foreground">적은 내용이 없습니다.</p>
        </DetailLayout>
      )}
    </DetailSurface>
  )
}

/** 일정의 자기 페이지(/schedule/events/{id}): 링크 · 새로고침 · 크게 보기, 휴대폰에서 일정을 누르면 늘 여기로 온다. 휴대폰 앱 바의 ← 는 일정으로. */
export function ScheduleEventPage() {
  const { eventId = "" } = useParams({ strict: false })
  return <EventSurface key={eventId} id={eventId} surface="page" />
}
