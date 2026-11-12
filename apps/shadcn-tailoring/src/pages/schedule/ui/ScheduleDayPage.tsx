import { Link, useParams } from "@tanstack/react-router"
import { useState, type MouseEvent } from "react"
import { dayTitle, EventDot, eventHref, useEvents, type CalendarEvent } from "@/entities/event"
import { useHolidays } from "@/entities/holiday"
import { useOpenPanel } from "@/shared/lib/panel"
import { paths } from "@/shared/config"
import { Button } from "@/shared/ui/button"
import { DetailSurface } from "@/shared/ui/detail-surface"
import { CalendarIcon, PlusIcon, UmbrellaIcon } from "@/shared/ui/icon"
import { PageState } from "@/shared/ui/page-state"
import { RowLink } from "@/shared/ui/row-link"
import { Skeleton } from "@/shared/ui/skeleton"
import { dayGroups, factsOn, isDay, type DayGroup } from "../model/day-list"
import { NewEventDialog } from "./NewEventDialog"

/**
 * 목록의 한 줄: 일정은 분류 색 점, 휴가는 우산. 줄 어디를 눌러도 그 일정을 연다(호호코워크 RouterLink의 inherit):
 * 대화상자 안이면 그 자리를 일정으로 바꾸고, 페이지면 일정 페이지로 간다. 보조 키 · 가운데 단추는 브라우저가 새 탭으로 연다.
 */
function DayRow({ event, day, kind }: { event: CalendarEvent; day: string; kind: DayGroup["kind"] }) {
  const open = useOpenPanel()
  const href = eventHref(event.id)
  const click = (mouse: MouseEvent) => {
    if (mouse.button !== 0 || mouse.metaKey || mouse.ctrlKey || mouse.shiftKey || mouse.altKey) return
    mouse.preventDefault()
    open(href, { inherit: true })
  }
  return (
    <li className="relative flex min-h-13 items-center gap-3 px-3 py-2.5 hover:bg-row-hover">
      <span aria-hidden className="grid size-5 shrink-0 place-items-center text-icon-muted">
        {kind === "leave" ? <UmbrellaIcon /> : <EventDot category={event.category} />}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <RowLink to={href} onClick={click} className="truncate font-medium">{event.title}</RowLink>
        <span className="truncate text-xs text-muted-foreground tabular-nums">{factsOn(event, day)}</span>
      </span>
    </li>
  )
}

function DaySection({ group, day }: { group: DayGroup; day: string }) {
  return (
    <section aria-label={group.label} className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-muted-foreground">{group.label}</h2>
      <ul className="flex flex-col divide-y overflow-hidden rounded-xl bg-card text-sm ring-1 ring-foreground/10">
        {group.entries.map(event => <DayRow key={event.id} event={event} day={day} kind={group.kind} />)}
      </ul>
    </section>
  )
}

/**
 * 하루가 놓이는 곳(호호코워크 ScheduleDayPage + ScheduleFactsSurface). 공휴일 이름, 캘린더에서 보기 · 이 날 일정 등록,
 * 그 아래 일정 · 휴가 묶음(막대 먼저, 그다음 시각 순). page: 자기 페이지, 경로 일정 › 날짜와 큰 제목.
 * dialog: 데스크톱에서 달력의 날 칸이 연 대화상자, 머리의 날짜 · 크게 보기 · 닫기. 이 날 일정 등록은 onCreate가 맡는다.
 */
export function DaySurface({ day, surface, onClose, onExpand, onCreate }: {
  day: string; surface: "dialog" | "page"; onClose?: () => void; onExpand?: () => void; onCreate: () => void
}) {
  const { data: events } = useEvents()
  const { data: holidays } = useHolidays()
  const isValid = isDay(day)
  const title = isValid ? dayTitle(day) : "그날 일정"
  const holiday = holidays?.find(item => item.date === day)?.name
  const groups = events && dayGroups(day, events)

  const body = () => {
    if (!isValid) {
      return <PageState kind="not-found" isCompact title="날짜를 찾을 수 없습니다" description="주소의 날짜가 맞지 않습니다."
        action={<Button variant="secondary" nativeButton={false} render={<Link to={paths.schedule} />}>일정으로</Button>} />
    }
    if (!groups) {
      return (
        <div aria-busy="true" aria-label="그날을 읽는 중" className="flex flex-col gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-13 w-full rounded-xl" />
        </div>
      )
    }
    if (groups.length === 0) {
      return <PageState kind="empty" isCompact title="이날은 일정이 없습니다" description={holiday ? `${holiday}입니다.` : "새 일정을 만들 수 있습니다."} />
    }
    return groups.map(group => <DaySection key={group.kind} group={group} day={day} />)
  }

  return (
    <DetailSurface surface={surface} title={title} onClose={onClose} onExpand={onExpand}
      crumbs={[{ label: "일정", href: paths.schedule }, { label: title, icon: CalendarIcon }]}>
      <div className="flex flex-1 justify-center bg-background px-4 pt-3 pb-6 data-[surface=page]:py-10" data-surface={surface}>
        <div className="flex w-full max-w-180 flex-col gap-6">
          {(surface === "page" || holiday) && (
            <header className="flex flex-col gap-1">
              {surface === "page" && <h1 className="text-[2rem] leading-[1.3] font-bold tracking-[-0.025em]">{title}</h1>}
              {holiday && <p className="text-day-off">{holiday}</p>}
            </header>
          )}
          {isValid && (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" nativeButton={false} render={<Link to={paths.schedule} search={{ date: day } as never} />}>
                <CalendarIcon data-icon="inline-start" />캘린더에서 보기
              </Button>
              <Button onClick={onCreate}><PlusIcon data-icon="inline-start" />이 날 일정 등록</Button>
            </div>
          )}
          {body()}
        </div>
      </div>
    </DetailSurface>
  )
}

/**
 * 하루의 자기 페이지(/schedule/days/2026-11-12): 링크 · 새로고침 · 크게 보기. 휴대폰에는 대화상자가 없어 날 칸이 늘 여기로 온다.
 * 이 날 일정 등록은 이 페이지 위에 새 일정을 연다. 휴대폰 앱 바의 ← 는 일정으로.
 */
export function ScheduleDayPage() {
  const { day = "" } = useParams({ strict: false })
  const [isCreating, setCreating] = useState(false)
  return (
    <>
      <DaySurface key={day} day={day} surface="page" onCreate={() => setCreating(true)} />
      {isDay(day) && <NewEventDialog key={`new-${day}`} open={isCreating} onOpenChange={setCreating} date={day} />}
    </>
  )
}
