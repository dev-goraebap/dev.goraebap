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

/**
 * 페이지 제목(h1)의 주인. 페이지마다 접근 가능한 h1은 하나다(layout-patterns.md): 기본은 Page가 지금 이름으로 h1을 두고
 * (휴대폰은 앱 바 이름, 데스크톱은 경로와 별개로 숨긴 h1), 본문이 자기 제목을 h1로 그리면(상세 · 설정 · 작성 양식)
 * 그 부품이 useOwnPageTitle()로 알리고 Page는 h1을 두지 않는다. 앱 바 이름은 그대로 보이되 글자일 뿐이다.
 */
type PageTitle = { claim: () => () => void }

const PageTitleContext = createContext<PageTitle>({ claim: () => () => {} })

export const PageTitleProvider = PageTitleContext.Provider

/** 본문이 이 페이지의 h1을 그린다고 Page에 알린다. isOwn이 false면(목록 옆 칸에서 h2로 그릴 때) 알리지 않는다. */
export function useOwnPageTitle(isOwn = true) {
  const { claim } = useContext(PageTitleContext)
  useLayoutEffect(() => (isOwn ? claim() : undefined), [isOwn, claim])
}
