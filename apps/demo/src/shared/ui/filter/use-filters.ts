import { useState, type ReactNode } from "react"
import type { Icon } from "@/shared/ui/icon"
import type { Option } from "@/shared/ui/option-list"

/** 필터 하나: 무엇으로 거르는지와 고를 수 있는 값. 값이 하나라도 골라져야 걸린다(연산자 없음, 고른 것 중 하나). */
export type FilterDef<K extends string> = { key: K; label: string; icon: Icon; options: Option[]; isSearchable?: boolean }
/** 필터마다 고른 값. 비었으면 걸리지 않은 것이다. */
export type FilterState<K extends string> = Partial<Record<K, string[]>>

/**
 * 목록 페이지의 필터 상태(호호코워크 useFilters): 고른 값, 데스크톱 칩 줄에 보이는 필터(걸렸거나 막 더해 아직 빈 것),
 * 필터 메뉴(열림과 어느 필터의 값 단계인지). 무엇으로 거르는지(defs)는 페이지가 정한다.
 */
export function useFilters<K extends string>(defs: readonly FilterDef<K>[]) {
  const [state, setState] = useState<FilterState<K>>({})
  const [shown, setShown] = useState<K[]>([])
  const [menu, setMenu] = useState<{ isOpen: boolean; step?: K }>({ isOpen: false })
  const show = (key: K) => setShown(current => (current.includes(key) ? current : [...current, key]))
  const change = (key: K, values: string[]) => {
    setState(current => ({ ...current, [key]: values }))
    if (values.length > 0) show(key)
  }
  const defOf = (key: K) => defs.find(def => def.key === key)!
  return {
    defs, state, shown, menu, setMenu, change, show, defOf,
    /** 걸린 필터. */
    active: defs.filter(def => (state[def.key]?.length ?? 0) > 0).map(def => def.key),
    /** 고른 값 이름: 둘까지 보이고 나머지는 +N. */
    chosenNames: (key: K) => {
      const names = (state[key] ?? []).map(value => defOf(key).options.find(option => option.value === value)?.label ?? value)
      return { shown: names.slice(0, 2).join(", "), more: Math.max(0, names.length - 2) }
    },
    remove: (key: K) => { change(key, []); setShown(current => current.filter(each => each !== key)) },
    clear: () => { setState({}); setShown([]) },
  }
}

export type Filters<K extends string> = ReturnType<typeof useFilters<K>>
/** 필터 값 옆에 그리는 표식(아이콘 · 아바타 · 색 점). */
export type FilterMark = ReactNode
