import { useState } from "react"
import { INITIAL_DISPLAY, type Display, type FilterKey, type FilterState } from "./filters"

/**
 * 이 페이지의 필터와 표시(호호코워크 useFilters): 필터마다 고른 값, 데스크톱 칩 줄에 보이는 필터(걸렸거나 막 더해 아직 빈 것),
 * 필터 메뉴(열림과 어느 필터의 값 단계인지), 표시(정렬 · 방향 · 그룹).
 */
export function useWorkItemFilters() {
  const [state, setState] = useState<FilterState>({})
  const [shown, setShown] = useState<FilterKey[]>([])
  const [menu, setMenu] = useState<{ isOpen: boolean; step?: FilterKey }>({ isOpen: false })
  const [display, setDisplay] = useState<Display>(INITIAL_DISPLAY)
  const show = (key: FilterKey) => setShown(current => (current.includes(key) ? current : [...current, key]))
  const change = (key: FilterKey, values: string[]) => {
    setState(current => ({ ...current, [key]: values }))
    if (values.length > 0) show(key)
  }
  return {
    state, shown, menu, display, setDisplay, setMenu, setShown, change, show,
    remove: (key: FilterKey) => { change(key, []); setShown(current => current.filter(each => each !== key)) },
    clear: () => { setState({}); setShown([]) },
  }
}

export type WorkItemFilters = ReturnType<typeof useWorkItemFilters>
