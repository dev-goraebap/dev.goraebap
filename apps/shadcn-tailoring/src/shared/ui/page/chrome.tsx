import { createContext, useContext, useLayoutEffect, type ReactNode } from "react"

/**
 * 셸과 페이지 사이의 약속. 셸은 휴대폰 앱 바 오른쪽의 공통 도구(검색 · 알림함 · 내 아바타)를 넣고,
 * 상세 · 양식 페이지는 휴대폰에서 전체 화면(하단 탭 없음)을 셸에 알린다(호호코워크 휴대폰 화면 구조).
 */
type PageChrome = { tools: ReactNode; setFullScreen: (isFullScreen: boolean) => void }

const PageChromeContext = createContext<PageChrome>({ tools: null, setFullScreen: () => {} })

export const PageChromeProvider = PageChromeContext.Provider
export const usePageChrome = () => useContext(PageChromeContext)

/** 이 페이지가 떠 있는 동안 휴대폰 하단 탭을 숨긴다. */
export function useFullScreen(isFullScreen: boolean) {
  const { setFullScreen } = usePageChrome()
  useLayoutEffect(() => {
    if (!isFullScreen) return undefined
    setFullScreen(true)
    return () => setFullScreen(false)
  }, [isFullScreen, setFullScreen])
}
