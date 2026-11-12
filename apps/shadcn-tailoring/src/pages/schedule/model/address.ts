/**
 * 달력 위 대화상자의 주소(호호코워크 PanelHost의 일정 몫): 하루(/schedule/days/2026-11-12)와 일정 하나(/schedule/events/{id}).
 * 하루 목록의 줄이 연 일정은 같은 자리를 바꾼다.
 */
export function panelTarget(pathname: string | undefined): { kind: "day"; day: string } | { kind: "event"; id: string } | undefined {
  const day = /^\/schedule\/days\/(\d{4}-\d{2}-\d{2})$/.exec(pathname ?? "")?.[1]
  if (day) return { kind: "day", day }
  const id = /^\/schedule\/events\/([^/]+)$/.exec(pathname ?? "")?.[1]
  return id ? { kind: "event", id: decodeURIComponent(id) } : undefined
}
