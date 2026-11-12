import { useSearch } from "@tanstack/react-router"
import { useEffect, useMemo, useState } from "react"
import { currentDay, dayHref, shiftDay, shiftMonth, useEvents, weekDays } from "@/entities/event"
import { holidayNames, useHolidays } from "@/entities/holiday"
import { useOpenPanel, usePanel } from "@/shared/lib/panel"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { CalendarIcon, RowsIcon } from "@/shared/ui/icon"
import { Page, PageViews, type PageView } from "@/shared/ui/page"
import { panelTarget } from "../model/address"
import { isDay } from "../model/day-list"
import { useCalendarKeys } from "../model/use-calendar-keys"
import { CalendarNav } from "./CalendarNav"
import { DayAgenda } from "./DayEvents"
import { DayChips } from "./DayChips"
import { MonthCompact } from "./MonthCompact"
import { MonthGrid } from "./MonthGrid"
import { NewEventDialog } from "./NewEventDialog"
import { DaySurface } from "./ScheduleDayPage"
import { EventSurface } from "./ScheduleEventPage"
import { WeekGrid } from "./WeekGrid"

type View = "month" | "week"
const VIEWS: PageView<View>[] = [
  { value: "month", label: "월간", icon: CalendarIcon },
  { value: "week", label: "주간", icon: RowsIcon },
]

/**
 * 달력 위에 열린 것(호호코워크 PanelHost의 일정 몫): 날 칸이 연 하루 목록, 그 줄이 연 일정 하나(같은 자리를 바꾼다).
 * 하루 목록의 이 날 일정 등록은 대화상자를 닫고 그 날의 새 일정을 연다(새 일정은 아직 자기 주소가 없다).
 */
function SchedulePanel({ onCreate }: { onCreate: (day: string) => void }) {
  const panel = usePanel()
  const target = panelTarget(panel.pathname)
  if (!panel.href || !target) return null
  if (target.kind === "event") return <EventSurface key={panel.href} id={target.id} surface="dialog" onClose={panel.close} onExpand={panel.expand} />
  const create = () => {
    panel.close()
    onCreate(target.day)
  }
  return <DaySurface key={panel.href} day={target.day} surface="dialog" onClose={panel.close} onExpand={panel.expand} onCreate={create} />
}

/** 주소의 ?date=2026-11-12(하루 목록의 캘린더에서 보기). 맞지 않으면 없는 것으로 본다. */
function useDateParam() {
  const { date } = useSearch({ strict: false }) as { date?: unknown }
  return typeof date === "string" && isDay(date) ? date : undefined
}

/**
 * 일정(호호코워크 팀 캘린더). 툴바 왼쪽은 월간 · 주간 탭, 오른쪽은 달 제목 · 오늘 · 넘기기. 고른 날 하나가 보이는 달 · 주를 정한다.
 * 공휴일(entities/holiday)은 날짜를 휴일색으로, 월간 칸과 주간 머리에는 이름도 적는다(호호코워크 HOLIDAY).
 * 데스크톱: 월간 격자 · 7일 시간 격자. 날 칸을 누르면 그날의 목록(/schedule/days/{날})이 달력 위 대화상자로, 일정을 누르면 요약이 뜬다.
 * 휴대폰: 작은 달과 고른 날의 목록 · 요일 칩과 하루 시간 격자. 일정을 누르면 그 일정의 페이지로 간다.
 */
export function SchedulePage() {
  const isMobile = useIsMobile()
  const today = currentDay()
  const dateParam = useDateParam()
  const [view, setView] = useState<View>("month")
  const [day, setDay] = useState(dateParam ?? today)
  const [isCreating, setCreating] = useState(false)
  const [createOn, setCreateOn] = useState<string>()
  const { data: events = [] } = useEvents()
  const { data: holidayList } = useHolidays()
  const holidays = useMemo(() => holidayNames(holidayList ?? []), [holidayList])
  const openPanel = useOpenPanel()
  const openedDay = panelTarget(usePanel().pathname)
  // 이미 열린 달력에서 캘린더에서 보기로 다시 오면 그 날로 옮긴다.
  useEffect(() => { if (dateParam) setDay(dateParam) }, [dateParam])

  const step = (by: number) => setDay(current => (view === "month" ? shiftMonth(current, by) : shiftDay(current, by * 7)))
  const goToday = () => setDay(today)
  const create = () => { setCreateOn(undefined); setCreating(true) }
  const createFor = (date: string) => { setCreateOn(date); setCreating(true) }
  const showDay = (date: string) => openPanel(dayHref(date))
  useCalendarKeys(!isMobile, { onStep: step, onToday: goToday, onCreate: create })
  const createDate = createOn ?? (day < today ? today : day)

  return (
    <>
      <Page crumbs={[{ label: "일정", icon: CalendarIcon }]} create={{ label: "새 일정", onClick: create }}
        views={<PageViews label="일정 보기" views={VIEWS} value={view} onChange={setView} isCompact={isMobile} />}
        tools={<CalendarNav day={day} unit={view === "month" ? "달" : "주"} onToday={goToday} onStep={step} />}>
        {view === "month" ? (
          isMobile ? (
            <div className="flex flex-col pb-20">
              <MonthCompact month={day} today={today} events={events} holidays={holidays} selected={day} onSelect={setDay} />
              <DayAgenda day={day} holiday={holidays.get(day)} events={events} />
            </div>
          ) : (
            <MonthGrid month={day} today={today} events={events} holidays={holidays}
              selected={openedDay?.kind === "day" ? openedDay.day : undefined} onDay={showDay} />
          )
        ) : isMobile ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <DayChips days={weekDays(day)} today={today} selected={day} events={events} holidays={holidays} onSelect={setDay} />
            <WeekGrid days={[day]} today={today} events={events} holidays={holidays} hasHead={false} />
          </div>
        ) : (
          <WeekGrid days={weekDays(day)} today={today} events={events} holidays={holidays} hasHead />
        )}
        <SchedulePanel onCreate={createFor} />
      </Page>
      <NewEventDialog key={createDate} open={isCreating} onOpenChange={setCreating} date={createDate} />
    </>
  )
}
