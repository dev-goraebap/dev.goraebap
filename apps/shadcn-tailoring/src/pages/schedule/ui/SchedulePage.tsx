import { useState } from "react"
import { currentDay, shiftDay, shiftMonth, useEvents, weekDays } from "@/entities/event"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { CalendarIcon, RowsIcon } from "@/shared/ui/icon"
import { Page, PageViews, type PageView } from "@/shared/ui/page"
import { useCalendarKeys } from "../model/use-calendar-keys"
import { CalendarNav } from "./CalendarNav"
import { DayAgenda } from "./DayEvents"
import { DayChips } from "./DayChips"
import { MonthCompact } from "./MonthCompact"
import { MonthGrid } from "./MonthGrid"
import { NewEventDialog } from "./NewEventDialog"
import { WeekGrid } from "./WeekGrid"

type View = "month" | "week"
const VIEWS: PageView<View>[] = [
  { value: "month", label: "월간", icon: CalendarIcon },
  { value: "week", label: "주간", icon: RowsIcon },
]

/**
 * 일정(호호코워크 팀 캘린더). 툴바 왼쪽은 월간 · 주간 탭, 오른쪽은 달 제목 · 오늘 · 넘기기. 고른 날 하나가 보이는 달 · 주를 정한다.
 * 데스크톱: 월간 격자 · 7일 시간 격자. 휴대폰: 작은 달과 고른 날의 목록 · 요일 칩과 하루 시간 격자. 일정을 누르면 요약이 뜬다.
 */
export function SchedulePage() {
  const isMobile = useIsMobile()
  const today = currentDay()
  const [view, setView] = useState<View>("month")
  const [day, setDay] = useState(today)
  const [isCreating, setCreating] = useState(false)
  const { data: events = [] } = useEvents()

  const step = (by: number) => setDay(current => (view === "month" ? shiftMonth(current, by) : shiftDay(current, by * 7)))
  const goToday = () => setDay(today)
  const create = () => setCreating(true)
  useCalendarKeys(!isMobile, { onStep: step, onToday: goToday, onCreate: create })
  const createDate = day < today ? today : day

  return (
    <>
      <Page crumbs={[{ label: "일정", icon: CalendarIcon }]} create={{ label: "새 일정", onClick: create }}
        views={<PageViews label="일정 보기" views={VIEWS} value={view} onChange={setView} isCompact={isMobile} />}
        tools={<CalendarNav day={day} unit={view === "month" ? "달" : "주"} onToday={goToday} onStep={step} />}>
        {view === "month" ? (
          isMobile ? (
            <div className="flex flex-col pb-20">
              <MonthCompact month={day} today={today} events={events} selected={day} onSelect={setDay} />
              <DayAgenda day={day} events={events} />
            </div>
          ) : (
            <MonthGrid month={day} today={today} events={events} />
          )
        ) : isMobile ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <DayChips days={weekDays(day)} today={today} selected={day} events={events} onSelect={setDay} />
            <WeekGrid days={[day]} today={today} events={events} hasHead={false} />
          </div>
        ) : (
          <WeekGrid days={weekDays(day)} today={today} events={events} hasHead />
        )}
      </Page>
      <NewEventDialog key={createDate} open={isCreating} onOpenChange={setCreating} date={createDate} />
    </>
  )
}
