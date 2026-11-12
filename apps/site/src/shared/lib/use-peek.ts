import { useLocation, useNavigate, useRouter } from "@tanstack/react-router"
import { useEffect } from "react"
import { useIsMobile } from "@/shared/lib/use-mobile"

declare module "@tanstack/react-router" {
  interface HistoryState {
    /** 이 기록에서 미리보기를 열었는지. 있으면 닫기가 한 걸음 뒤로 가서 기록에 미리보기가 남지 않는다. */
    peekOpenedHere?: boolean
  }
}

const KEY = "peek"
type Search = Record<string, unknown>

/**
 * 목록 옆 미리보기의 상태(PeekPanel · InboxPane). 대상은 목록 주소의 ?peek=ID에 두어 뒤로 · 새로고침 · 공유가 같은 화면을 연다.
 * - open: 처음 열 때 기록을 하나 쌓는다. 뒤로 가기가 미리보기를 닫는다. 열린 채 다른 항목이면 move와 같다.
 * - move: 열린 채 다른 항목으로 옮길 때는 기록을 쌓지 않는다.
 * - close: 이 기록에서 열었으면 한 걸음 뒤로(목록의 조건 · 스크롤이 그대로), 아니면 peek만 뺀 주소로 바꾼다.
 * 휴대폰에는 옆 칸이 없어 ?peek=가 오면(창을 좁혔을 때) 대상 페이지(pageHref)로 옮긴다.
 * ?panel=(목록 위 대화상자, lib/panel)과 달리 목록을 가리지 않고 주소를 가리지도 않는다.
 */
export function usePeek(pageHref: (id: string) => string) {
  const location = useLocation()
  const navigate = useNavigate()
  const router = useRouter()
  const isMobile = useIsMobile()
  const { [KEY]: raw, ...rest } = location.search as Search
  const id = typeof raw === "string" && raw ? raw : typeof raw === "number" ? String(raw) : undefined
  const isOpenedHere = Boolean(location.state.peekOpenedHere)
  useEffect(() => {
    if (isMobile && id) void navigate({ href: pageHref(id), replace: true })
  }, [isMobile, id, navigate, pageHref])
  const go = (next: string, replace: boolean) => void navigate({
    to: location.pathname,
    search: { ...rest, [KEY]: next } as never,
    replace,
    state: current => ({ ...current, peekOpenedHere: replace ? isOpenedHere : true }),
  })
  return {
    id: isMobile ? undefined : id,
    open: (next: string) => (isMobile ? void navigate({ href: pageHref(next) }) : go(next, Boolean(id))),
    move: (next: string) => go(next, true),
    close: () => (isOpenedHere ? router.history.back() : void navigate({ to: location.pathname, search: rest as never, replace: true })),
    /** 미리보기 대상의 주소(목록 주소 + ?peek=). 처리 목록의 줄 링크를 이 주소로 두면 새 탭 · 주소 복사도 같은 화면이다. */
    hrefOf: (next: string) => {
      const query = new URLSearchParams(Object.entries(rest).filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, typeof value === "string" ? value : JSON.stringify(value)]))
      query.set(KEY, next)
      return `${location.pathname}?${query}`
    },
  }
}

export type Peek = ReturnType<typeof usePeek>
