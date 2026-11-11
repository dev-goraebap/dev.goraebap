import { covers, daysBetween, dayOf, isBar, spanOf, type CalendarEvent } from "@/entities/event"

/** 한 주(연속한 날들) 위에 놓인 막대: 첫 열, 걸친 칸 수, 차지한 줄. 주 앞뒤로 이어지면 그쪽 끝을 각지게 그린다. */
export type PlacedBar = { event: CalendarEvent; column: number; span: number; lane: number; fromBefore: boolean; toAfter: boolean }

/** 막대들을 걸친 날 모두에서 비어 있는 첫 줄에 놓는다. 일찍 시작하는 것, 그다음 긴 것이 위로 간다. */
export function layBars(events: readonly CalendarEvent[], days: readonly string[]): { bars: PlacedBar[]; lanes: number } {
  const from = days[0]
  const to = days[days.length - 1]
  const shown = events.filter(event => isBar(event) && spanOf(event).first <= to && spanOf(event).last >= from)
    .sort((a, b) => spanOf(a).first.localeCompare(spanOf(b).first)
      || daysBetween(spanOf(b).first, spanOf(b).last) - daysBetween(spanOf(a).first, spanOf(a).last))
  const taken: boolean[][] = []
  const bars = shown.map(event => {
    const { first, last } = spanOf(event)
    const column = Math.max(0, daysBetween(from, first))
    const end = Math.min(days.length - 1, daysBetween(from, last))
    let lane = 0
    while (taken[lane]?.slice(column, end + 1).some(Boolean)) lane += 1
    taken[lane] ??= []
    for (let index = column; index <= end; index += 1) taken[lane][index] = true
    return { event, column, span: end - column + 1, lane, fromBefore: first < from, toAfter: last > to }
  })
  return { bars, lanes: taken.length }
}

export const timedOn = (events: readonly CalendarEvent[], day: string) =>
  events.filter(event => !isBar(event) && dayOf(event.start) === day).sort((a, b) => a.start.localeCompare(b.start))

/**
 * 월간 격자의 한 주를 줄로 나눈 것: 막대 줄들, 그다음 날마다 시각 일정 줄들, 넘친 것이 있으면 "+N 더보기" 줄.
 * 같은 종류는 주 전체에서 같은 줄에서 시작하므로 막대가 곧게 이어진다.
 */
export type MonthWeek = { days: string[]; bars: PlacedBar[]; barLanes: number; timed: CalendarEvent[][]; timedLines: number; hidden: number[]; hasFoot: boolean }

/** 한 칸이 날짜 아래에 담는 줄 수(막대와 시각 일정을 합쳐). */
const LINES = 4

function layoutWeek(days: string[], events: readonly CalendarEvent[], capacity: number): MonthWeek {
  const laid = layBars(events, days)
  const barLanes = Math.min(laid.lanes, capacity)
  const bars = laid.bars.filter(bar => bar.lane < barLanes)
  const all = days.map(day => timedOn(events, day))
  const timedLines = Math.min(Math.max(0, ...all.map(list => list.length)), capacity - barLanes)
  const timed = all.map(list => list.slice(0, timedLines))
  const hidden = days.map((day, index) => laid.bars.filter(bar => bar.lane >= barLanes && covers(bar.event, day)).length
    + all[index].length - timed[index].length)
  return { days, bars, barLanes, timed, timedLines, hidden, hasFoot: hidden.some(count => count > 0) }
}

/* 줄 높이(rem): 날짜 줄, 막대, 시각 일정, 더보기, 주 아래 여백. 줄 사이는 3px. */
const ROW = { date: 1.875, bar: 1.25, line: 1.3125, foot: 1.25, end: 0.25 }
const GAP_PX = 3

/**
 * 정해진 주 높이(px)에 들어가는 만큼만 놓는다. 일정 수로 주 높이를 늘리지 않는다(여섯 주가 같은 높이).
 * 더보기 줄도 못 들어가면 더보기를 날짜 줄 오른쪽에 둔다(inlineFoot).
 */
export function fitWeek(days: string[], events: readonly CalendarEvent[], height: number, rem: number) {
  for (let capacity = LINES; capacity >= 0; capacity -= 1) {
    const week = layoutWeek(days, events, capacity)
    const tracks = week.barLanes + week.timedLines + (week.hasFoot ? 1 : 0)
    const required = (ROW.date + week.barLanes * ROW.bar + week.timedLines * ROW.line + (week.hasFoot ? ROW.foot : 0) + ROW.end) * rem
      + (tracks + 1) * GAP_PX + 1
    if (required <= height) return { week, inlineFoot: false }
  }
  return { week: layoutWeek(days, events, 0), inlineFoot: true }
}

/** 그 주의 grid-template-rows: 날짜, 막대 줄, 시각 줄, (더보기), 나머지. */
export function weekRows(week: MonthWeek, inlineFoot: boolean): string {
  const repeat = (count: number, size: number) => (count ? ` repeat(${count}, ${size}rem)` : "")
  return `${ROW.date}rem${repeat(week.barLanes, ROW.bar)}${repeat(week.timedLines, ROW.line)}${week.hasFoot && !inlineFoot ? ` ${ROW.foot}rem` : ""} minmax(0, 1fr)`
}
