import { currentDay, dayNumber, monthWeeks, shiftDay, shiftMonth, weekdayOf } from "../model/dates"
import type { CalendarEvent, EventCategory } from "../model/types"

/*
 * 회사 일정(호호코워크 플레이그라운드 fixtures를 옮긴 것). 날짜는 오늘을 기준으로 이번 달과 다음 달에 둔다.
 * 오늘은 겹치는 회의와 오후 반차, 이번 달에는 여러 날 행사 · 주말을 넘는 점검 · 일정이 몰린 날, 다음 달에는 교육과 마감이 있다.
 */
let serial = 0
const nextId = () => `event-${(serial += 1)}`
const timed = (day: string, from: string, to: string, title: string, category: EventCategory, location?: string): CalendarEvent =>
  ({ id: nextId(), title, start: `${day}T${from}`, end: `${day}T${to}`, category, location })
const allDay = (first: string, last: string, title: string, category: EventCategory, location?: string): CalendarEvent =>
  ({ id: nextId(), title, start: first, end: last, isAllDay: true, category, location })

export function mockEvents(today = currentDay()): CalendarEvent[] {
  const thisMonth = (day: number) => `${today.slice(0, 8)}${String(day).padStart(2, "0")}`
  const nextMonth = (day: number) => `${shiftMonth(thisMonth(1), 1).slice(0, 8)}${String(day).padStart(2, "0")}`
  const mondays = monthWeeks(today).flat().filter(day => weekdayOf(day) === 1 && day.slice(0, 7) === today.slice(0, 7))
  const tomorrow = shiftDay(today, 1)
  // 일정이 몰린 날: 오늘과 겹치지 않는 이번 달의 17일(오늘이 17일이면 24일).
  const crowded = thisMonth(dayNumber(today) === 17 ? 24 : 17)
  return [
    ...mondays.map(day => timed(day, "09:30", "10:30", "사업팀 정기회의", "meeting", "본사 3층 회의실")),
    timed(today, "10:00", "11:00", "한전KDN 고객사 미팅", "external", "화상"),
    timed(today, "10:30", "11:30", "스프린트 회의", "education", "본사 2층"),
    timed(today, "13:00", "18:00", "김하늘 반차(오후)", "leave"),
    timed(today, "14:00", "15:00", "회고회의(기록: 정승렬)", "event"),
    timed(tomorrow, "15:00", "16:00", "디자인 리뷰", "review"),
    allDay(shiftDay(today, 2), shiftDay(today, 2), "고재범 연차", "leave"),
    allDay(thisMonth(4), thisMonth(6), "빛가람 에너지밸리 ICT&보안 컨퍼런스 참가", "event", "나주 빛가람 혁신도시"),
    allDay(thisMonth(13), thisMonth(17), "정보보안 점검 기간", "inspection"),
    timed(crowded, "10:30", "11:30", "스프린트 회의", "education", "본사 2층"),
    timed(crowded, "13:00", "14:00", "신규 입사자 OT", "external"),
    timed(crowded, "15:00", "16:00", "주간 코드 리뷰", "meeting"),
    timed(crowded, "16:00", "17:00", "디자인 리뷰", "review"),
    allDay(thisMonth(26), thisMonth(27), "하반기 워크숍", "education", "여수"),
    allDay(thisMonth(28), thisMonth(28), "월간 실적 보고 마감", "deadline"),
    timed(nextMonth(2), "10:30", "11:30", "스프린트 회의", "education", "본사 2층"),
    allDay(nextMonth(8), nextMonth(9), "정보보호 교육", "education", "본사 대강당"),
    timed(nextMonth(15), "14:00", "15:30", "고객 만족도 조사 결과 공유", "event"),
    timed(nextMonth(18), "18:30", "21:00", "송년회", "event", "강남 한식당"),
    allDay(nextMonth(23), nextMonth(23), "연간 보고서 마감", "deadline"),
  ]
}
