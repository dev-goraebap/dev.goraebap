import { useCallback, useState } from "react"

/**
 * 사용자가 끌어 정하는 칸 너비(px). min~max로 자르고, 바꾼 너비는 이 브라우저(key)에 남는다. 처음 값은 initial(기본은 max).
 */
export function useStoredWidth({ key, min, max, initial = max }: { key: string; min: number; max: number; initial?: number }) {
  const clamp = useCallback((width: number) => Math.round(Math.min(max, Math.max(min, width))), [min, max])
  const [width, setWidth] = useState(() => {
    try {
      const saved = Number(localStorage.getItem(key))
      return saved ? clamp(saved) : initial
    } catch {
      return initial
    }
  })
  const resize = useCallback((next: number) => {
    const clamped = clamp(next)
    setWidth(clamped)
    try {
      localStorage.setItem(key, String(clamped))
    } catch {
      // 저장할 수 없어도 이번 화면에는 반영한다.
    }
  }, [clamp, key])
  return [width, resize] as const
}
