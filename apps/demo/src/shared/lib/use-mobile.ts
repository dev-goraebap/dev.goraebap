import { useSyncExternalStore } from "react"

/** 휴대폰과 데스크톱을 가르는 분기점. CSS의 md:(64rem)와 같다(호호코워크 MOBILE_QUERY). */
export const MOBILE_QUERY = "(width < 64rem)"

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(MOBILE_QUERY)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

/** 창이 휴대폰 폭인지. 첫 렌더부터 실제 값을 돌려준다. */
export function useIsMobile() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(MOBILE_QUERY).matches, () => false)
}
