import { useEffect, useEffectEvent } from "react"

/** 글을 쓰는 중이거나, 보조 키를 누르거나, 대화상자 · 팝오버가 떠 있으면 달력 키가 아니다. */
function isForCalendar(event: KeyboardEvent) {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return false
  const target = event.target as HTMLElement | null
  if (target?.closest("input, textarea, select, [contenteditable='true'], [role='combobox'], [role='listbox'], [role='menu']")) return false
  return !document.querySelector("[role='dialog']")
}

/** 데스크톱 달력 키(호호코워크와 같음): ← → 이전 · 다음, T 오늘, N 새 일정. */
export function useCalendarKeys(isEnabled: boolean, actions: { onStep: (by: number) => void; onToday: () => void; onCreate: () => void }) {
  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (!isForCalendar(event)) return
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
    if (key === "ArrowLeft" || key === "ArrowRight") actions.onStep(key === "ArrowLeft" ? -1 : 1)
    else if (key === "t") actions.onToday()
    else if (key === "n") actions.onCreate()
    else return
    event.preventDefault()
  })
  useEffect(() => {
    if (!isEnabled) return
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isEnabled])
}
