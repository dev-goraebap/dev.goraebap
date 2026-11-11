import { useCallback, useState } from "react"

const KEY = "notifications-list-width"
export const LIST_MIN_WIDTH = 288
/** 기본 너비이자 조절 범위의 최대(호호코워크 LIST_MAX_WIDTH). */
export const LIST_MAX_WIDTH = 560

const clamp = (width: number) => Math.round(Math.min(LIST_MAX_WIDTH, Math.max(LIST_MIN_WIDTH, width)))

function readSaved() {
  try {
    const saved = Number(localStorage.getItem(KEY))
    return saved ? clamp(saved) : LIST_MAX_WIDTH
  } catch {
    return LIST_MAX_WIDTH
  }
}

/** 알림함 목록 칸의 너비(px). 바꾼 너비는 이 브라우저에 남는다. */
export function usePaneWidth() {
  const [width, setWidth] = useState(readSaved)
  const resize = useCallback((next: number) => {
    const clamped = clamp(next)
    setWidth(clamped)
    try {
      localStorage.setItem(KEY, String(clamped))
    } catch {
      // 저장할 수 없어도 이번 화면에는 반영한다.
    }
  }, [])
  return [width, resize] as const
}
