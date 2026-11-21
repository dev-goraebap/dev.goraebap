import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react"
import type { Icon } from "@/shared/ui/kit/icon"

/**
 * 휴대폰 목록 화면의 도구 자리(2026-11-14, Linear 모바일처럼). 휴대폰에서는 검색 · 필터 · 표시가 목록 위에 따로 서지 않는다:
 * 모두 머리 오른쪽 … 메뉴의 항목이 된다. 도구는
 * usePhoneTool로 자기를 알리고, 누르면 자기 시트 · 찾기 칸을 연다. Page가 휴대폰에서만 이 자리를 둔다.
 * 레이아웃(Page)이 이 모듈을 쓰고, 도구는 레이아웃을 모른다.
 */
export type PhoneTool = { id: string; label: string; icon: Icon; isOn?: boolean; order: number; onSelect: () => void }

type PhoneTools = {
  tools: PhoneTool[]
  register: (tool: PhoneTool) => () => void
  /** 화면의 … 메뉴(ActionMenu)가 도구 항목을 맡는다고 알린다. 아무도 맡지 않으면 머리가 … 메뉴를 따로 둔다. */
  claimMenu: () => () => void
  isMenuClaimed: boolean
}

const PhoneToolsContext = createContext<PhoneTools | undefined>(undefined)

/** Page가 휴대폰에서 두는 도구 자리. */
export function PhoneToolsProvider({ children }: { children: ReactNode }) {
  const [tools, setTools] = useState<PhoneTool[]>([])
  const [claims, setClaims] = useState(0)
  const register = useCallback((tool: PhoneTool) => {
    setTools(current => [...current.filter(each => each.id !== tool.id), tool].sort((one, other) => one.order - other.order))
    return () => setTools(current => current.filter(each => each.id !== tool.id))
  }, [])
  const claimMenu = useCallback(() => {
    setClaims(count => count + 1)
    return () => setClaims(count => count - 1)
  }, [])
  const value = useMemo(() => ({ tools, register, claimMenu, isMenuClaimed: claims > 0 }), [tools, register, claimMenu, claims])
  return <PhoneToolsContext.Provider value={value}>{children}</PhoneToolsContext.Provider>
}

/** 휴대폰 머리(앱 바) 안: 거기 놓인 화면 … 메뉴만 도구 항목을 담는다. */
const InAppBarContext = createContext(false)
export const InAppBarProvider = InAppBarContext.Provider
export const useIsInAppBar = () => useContext(InAppBarContext)

/** 휴대폰 도구 자리. 데스크톱(또는 Page 밖)에서는 없다. */
export const usePhoneTools = () => useContext(PhoneToolsContext)

/** 도구 하나를 휴대폰 자리에 알린다(tool이 없으면 알리지 않는다). 누르면 할 일은 늘 마지막 것을 부른다. */
export function usePhoneTool(tool: Omit<PhoneTool, "onSelect"> & { onSelect: () => void } | undefined) {
  const phone = usePhoneTools()
  const select = useRef(tool?.onSelect)
  select.current = tool?.onSelect
  const register = phone?.register
  const id = tool?.id
  const label = tool?.label
  const icon = tool?.icon
  const isOn = tool?.isOn
  const order = tool?.order ?? 0
  useLayoutEffect(() => {
    if (!register || !id || !label || !icon) return undefined
    return register({ id, label, icon, isOn, order, onSelect: () => select.current?.() })
  }, [register, id, label, icon, isOn, order])
}
