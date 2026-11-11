import { createContext, useContext, type ReactNode } from "react"

/** 휴대폰 앱 바 오른쪽의 공통 도구(검색 · 알림함 · 내 아바타). 셸이 넣고 페이지가 읽는다. */
const PageChromeContext = createContext<ReactNode>(null)

export const PageChromeProvider = PageChromeContext.Provider
export const usePageChrome = () => useContext(PageChromeContext)
