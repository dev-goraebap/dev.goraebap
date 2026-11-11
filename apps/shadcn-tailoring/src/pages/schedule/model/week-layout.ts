import { dayOf, isBar, minuteOf, type CalendarEvent } from "@/entities/event"

/** 주간 격자가 보이는 시각(08:00–20:00, 호호코워크와 같음). */
export const START_HOUR = 8
export const END_HOUR = 20

/** 하루 열에 놓인 시각 일정: 첫 시각부터의 위치와 길이(시간), 겹치는 것들 사이의 칸(lane / lanes). */
export type PlacedBlock = { event: CalendarEvent; from: number; length: number; lane: number; lanes: number }

/** 블록의 최소 길이(시간). 짧은 일정도 제목이 들어간다. */
const SHORTEST = 0.5

/** 그 날의 시각 일정을 블록으로. 서로(또는 다른 것을 거쳐) 겹치는 것들은 열을 나란히 나눠 쓰고, 시작할 때 빈 첫 칸에 놓인다. */
export function layDay(events: readonly CalendarEvent[], day: string): PlacedBlock[] {
  const top = START_HOUR * 60
  const bottom = END_HOUR * 60
  const shown = events.filter(event => !isBar(event) && dayOf(event.start) === day)
    .map(event => ({ event, start: Math.max(minuteOf(event.start), top), end: Math.min(minuteOf(event.end), bottom) }))
    .filter(item => item.start < bottom && item.end > top)
    .map(item => ({ ...item, end: Math.min(Math.max(item.end, item.start + SHORTEST * 60), bottom) }))
    .sort((a, b) => a.start - b.start || b.end - a.end)
  const placed: PlacedBlock[] = []
  let group: { block: PlacedBlock; end: number }[] = []
  let groupEnd = -1
  const closeGroup = () => {
    const lanes = Math.max(1, ...group.map(item => item.block.lane + 1))
    group.forEach(item => { item.block.lanes = lanes })
    group = []
  }
  for (const item of shown) {
    if (item.start >= groupEnd) closeGroup()
    const laneEnds: number[] = []
    group.forEach(other => { laneEnds[other.block.lane] = Math.max(laneEnds[other.block.lane] ?? -1, other.end) })
    let lane = 0
    while ((laneEnds[lane] ?? -1) > item.start) lane += 1
    const block = { event: item.event, from: (item.start - top) / 60, length: (item.end - item.start) / 60, lane, lanes: 1 }
    placed.push(block)
    group.push({ block, end: item.end })
    groupEnd = Math.max(groupEnd, item.end)
  }
  closeGroup()
  return placed
}
