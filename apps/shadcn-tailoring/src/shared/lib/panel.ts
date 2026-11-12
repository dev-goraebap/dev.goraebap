import { useLocation, useNavigate, useRouter } from "@tanstack/react-router"
import { useEffect } from "react"
import { useIsMobile } from "@/shared/lib/use-mobile"

/*
 * 목록 위 대화상자로 여는 페이지(호호코워크 shared/lib/panel). 데스크톱은 지금 페이지 주소에 ?panel=<페이지 주소>를 달고
 * 주소창에는 TanStack Router의 mask로 그 페이지의 주소를 보인다(unmaskOnReload: 새로고침 · 복사한 주소는 페이지로 연다).
 * 휴대폰에는 대화상자가 없어 늘 그 페이지로 간다.
 * 공지사항 · 회의록 · 주간보고가 함께 쓴다. 업무 만들기(features/work-item-create)는 같은 방식의 앞선 사본이다.
 */
const KEY = "panel"

declare module "@tanstack/react-router" {
  interface HistoryState {
    /** 대화상자를 연 기록의 표시. 있으면 닫기가 한 걸음 뒤로 가서 기록에 대화상자가 남지 않는다. 대화상자 안에서 바꿔 열어도 이어진다. */
    panelOpenedHere?: boolean
  }
}

type Search = Record<string, unknown>

/** 값은 TanStack Router의 기본 parseSearch처럼 JSON으로 읽는다. 글자 "1"로 두면 mask 주소가 ?compose=%221%22로 따옴표가 붙는다. */
const parseValue = (value: string): unknown => {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function split(href: string) {
  const url = new URL(href, "http://cowork.invalid")
  return { pathname: url.pathname, search: Object.fromEntries([...url.searchParams].map(([key, value]) => [key, parseValue(value)])) as Search }
}

/**
 * href를 지금 페이지 위 대화상자로 연다(휴대폰은 그 페이지로 간다). inherit: 대화상자 안이면 그 자리를 바꾸고,
 * 페이지에서 불렀으면 페이지로 간다(호호코워크 surface: 'inherit'). replace: 기록을 쌓지 않는다.
 */
export function useOpenPanel() {
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()
  return (href: string, { inherit = false, replace = false }: { inherit?: boolean; replace?: boolean } = {}) => {
    const isPanel = typeof (location.search as Search)[KEY] === "string"
    if (isMobile || (inherit && !isPanel)) return void navigate({ href, replace })
    const target = split(href)
    void navigate({
      to: location.pathname,
      search: (current: Search) => ({ ...current, [KEY]: href }),
      replace: isPanel || replace,
      state: current => ({ ...current, panelOpenedHere: isPanel ? current.panelOpenedHere : true }),
      mask: { to: target.pathname, search: target.search, unmaskOnReload: true },
    })
  }
}

/**
 * 지금 열린 대화상자(href)와 나가는 길. close는 연 기록이면 한 걸음 뒤로, 아니면 표시를 뗀 주소로 바꾼다.
 * expand는 같은 것을 자기 페이지로, done은 다른 주소(만든 것의 상세)로 대화상자 자리를 바꾼다.
 * 휴대폰에서 대화상자 주소를 만나면(창을 좁혔을 때) 그 페이지로 옮긴다.
 */
export function usePanel() {
  const router = useRouter()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()
  const { [KEY]: raw, ...rest } = location.search as Search
  const href = typeof raw === "string" && raw.startsWith("/") ? raw : undefined
  const isOpenedHere = Boolean(location.state.panelOpenedHere)
  const expand = () => { if (href) void navigate({ href, replace: true }) }
  useEffect(() => {
    if (isMobile && href) void navigate({ href, replace: true })
  }, [isMobile, href, navigate])
  return {
    href: isMobile ? undefined : href,
    /** 대화상자 주소의 경로(검색 값 없이). */
    pathname: href && !isMobile ? split(href).pathname : undefined,
    search: href ? split(href).search : {},
    close: () => {
      if (href && isOpenedHere) return router.history.back()
      void navigate({ to: location.pathname, search: rest, replace: true })
    },
    expand,
    done: (next: string) => void navigate({ href: next, replace: true }),
  }
}

/*
 * 크게 보기로 넘기는 쓰던 내용(호호코워크 useComposeTransfer). 대화상자가 닫히기 전에 맡기고, 페이지의 양식이 처음 그릴 때 꺼낸다.
 * 메모리에만 두므로 새로고침하면 사라진다(File도 그대로 넘어간다).
 */
const carried = new Map<string, unknown>()

export const carryDraft = (key: string, draft: unknown) => void carried.set(key, draft)

/** 맡겨 둔 내용. 개발 모드의 두 번 그리기에도 같은 값을 읽도록 그릴 때는 보기만 하고, 그린 뒤에 지운다. */
export function useCarriedDraft<T>(key: string): T | undefined {
  const draft = carried.get(key) as T | undefined
  useEffect(() => { carried.delete(key) }, [key])
  return draft
}
