import { useQueryClient } from "@tanstack/react-query"
import { useLocation, useNavigate, useRouter } from "@tanstack/react-router"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useIsMobile } from "@/shared/lib/use-mobile"

/*
 * 목록 위 대화상자로 여는 페이지(BIT의 routed panel, Linear의 새 이슈). 목록 자기 주소에 ?panel=<페이지 주소>를 달고, 주소창에는
 * TanStack Router의 mask로 그 페이지의 주소를 보인다. 라우터가 새로고침에 mask를 푼다(router의 unmaskOnReload): 새로고침 · 복사한
 * 주소 · 링크는 그 페이지로 연다. 휴대폰에는 이런 대화상자가 없어 늘 그 페이지로 간다.
 *
 * cowork의 계약(?panel 주소, 기록 표시, 상세 페이지 예외)을 그대로 두고, Webapp 키트 panel의 이름(inherit 선택,
 * usePanel의 pathname · search, carryDraft)도 함께 받는다. 키트 부품(shared/ui/detail-surface)이 이 모듈을 가져다 쓴다.
 */
const KEY = "panel"
/** 대화상자를 연 기록의 표시. 닫기가 기록을 더하지 않고 한 걸음 뒤로 가게 한다. */
const MARK = "coworkPanel"
const ROOT_ENTRY = "root"
const EDITOR_MARK = "coworkEditor"
const DIALOG = "dialog"
const DIALOG_MARK = "coworkDialog"

declare module "@tanstack/react-router" {
  interface HistoryState {
    /** 대화상자를 연 기록(ROOT_ENTRY)과, 그 안에서 바꿔 연 기록이 이어받은 표시. */
    coworkPanel?: unknown
    /** 상세에서 수정 화면으로 들어온 기록. */
    coworkEditor?: boolean
    /** 주소가 있는 대화상자(useMaskedDialog)를 연 기록. */
    coworkDialog?: boolean
  }
}

type Search = Record<string, unknown>

export type PanelSurface = "dialog" | "page" | "inherit"
/**
 * surface: dialog(목록 위 대화상자), page(그 페이지로), inherit(대화상자 안이면 그 자리를 바꾸고 페이지에서 불렀으면 페이지로).
 * inherit: true는 키트의 같은 뜻(surface: 'inherit'). replace: 기록을 쌓지 않는다.
 */
export type OpenPanelOptions = { surface?: PanelSurface; inherit?: boolean; replace?: boolean }

function split(href: string) {
  const url = new URL(href, "http://cowork.invalid")
  return { pathname: url.pathname, search: Object.fromEntries(url.searchParams) as Search }
}

/** 업무 · 프로젝트 문서의 상세는 읽는 화면이라 대화상자가 아니라 늘 자기 페이지로 연다. */
const isPageDetail = (href: string) => {
  const path = href.split(/[?#]/, 1)[0]
  return /^\/my-work\/[^/]+-\d+$/.test(path)
    || /^\/workspace\/projects\/[^/]+\/work-items\/\d+$/.test(path)
    || /^\/workspace\/projects\/[^/]+\/documents\/[0-9a-fA-F-]{36}$/.test(path)
    // 주간보고는 목록 · 상세 · 작성 · 수정 모두 자기 페이지다(2026-11-14, 대화상자 없음).
    || /^\/office\/weekly-reports(?:\/|$)/.test(path)
}

/** href를 지금 페이지 위 대화상자로 연다(휴대폰은 그 페이지로 간다). */
export function useOpenPanel() {
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()
  return (href: string, { surface = "dialog", inherit = false, replace = false }: OpenPanelOptions = {}) => {
    const isPanel = typeof (location.search as Search)[KEY] === "string"
    const asInherit = inherit || surface === "inherit"
    if (isPageDetail(href) || isMobile || surface === "page" || (asInherit && !isPanel)) return void navigate({ href, replace })
    const target = split(href)
    // 대화상자 안에서 바꿔 열면 처음 연 기록의 표시를 이어받아, 닫기가 여전히 목록으로 한 걸음 돌아간다.
    const marker = isPanel ? location.state[MARK] : ROOT_ENTRY
    void navigate({
      replace: isPanel || replace, to: location.pathname, search: { ...(location.search as Search), [KEY]: href }, state: { [MARK]: marker },
      mask: { to: target.pathname, search: target.search, state: { [MARK]: marker } },
    })
  }
}

/**
 * 지금 페이지 위에 열린 대화상자(href)와 나가는 길. close는 그 아래 페이지로(여기서 열었으면 한 걸음 뒤로, 아니면 표시를 뗀
 * 주소로; 대화상자가 아닐 때 fallbackHref가 있으면 그리로), expand는 같은 것을 자기 페이지로, done은 다른 주소(만든 것의
 * 상세)로 대화상자 자리를 바꾼다. 휴대폰 폭에서 남은 ?panel은 PanelHost(app/layout)가 expand로 페이지로 옮긴다:
 * 양식이 그 전에 쓰던 내용을 맡길 수 있도록 href는 휴대폰에서도 그대로 돌려준다.
 */
/**
 * 크게 보기의 화면 전환(2026-11-15): 떠 있는 대화상자가 그 자리 · 크기에서 페이지의 콘텐츠 영역으로 커지며 페이지가 된다.
 * 라우터의 viewTransition은 주소를 바꾼 뒤에 화면을 찍어(그때 이미 대화상자가 닫혀 있다) 쓰지 않고, 여기서 직접 건다:
 * 다음 페이지를 미리 준비(preloadRoute)해 두고, 대화상자가 떠 있는 지금을 찍은 뒤 전환 안에서 이동한다. 이름은 전환하는 동안만
 * CSS가 붙인다(index.css의 panel-expand: 전환 전에는 대화상자, 전환 뒤에는 콘텐츠 영역).
 * 대화상자가 없거나(휴대폰에서 남은 ?panel) 지원하지 않거나 움직임 줄이기면 그냥 이동한다.
 */
/** 목록 위 대화상자가 걷힐 때까지 기다린다(최대 1초). */
function dialogGone() {
  return new Promise<void>(done => {
    const started = performance.now()
    const check = () => (!document.querySelector("[data-slot=dialog-content][data-panel]") || performance.now() - started > 1000 ? done() : setTimeout(check, 16))
    check()
  })
}

function canExpandWithTransition() {
  return !!document.querySelector("[data-slot=dialog-content][data-panel]") && "startViewTransition" in document
    && CSS.supports("selector(:active-view-transition-type(panel-expand))") && !matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function usePanel() {
  const router = useRouter()
  const navigate = useNavigate()
  const location = useLocation()
  const { [KEY]: raw, ...rest } = location.search as Search
  const href = typeof raw === "string" && raw.startsWith("/") ? raw : undefined
  const isOpenedHere = location.state[MARK] === ROOT_ENTRY
  return {
    href,
    /** 대화상자 주소의 경로(검색 값 없이). */
    pathname: href ? split(href).pathname : undefined,
    /** 대화상자 주소의 검색 값(글자). */
    search: href ? split(href).search : {},
    close: (fallbackHref?: string) => {
      if (typeof raw === "string" && isOpenedHere) return router.history.back()
      if (typeof raw !== "string" && typeof fallbackHref === "string") return void navigate({ href: fallbackHref, replace: true })
      return void navigate({ to: location.pathname, search: rest, replace: true })
    },
    expand: () => {
      if (typeof raw !== "string") return
      const go = () => navigate({ href: raw, replace: true, viewTransition: false })
      if (!canExpandWithTransition()) return void go()
      const target = split(raw)
      void router.preloadRoute({ to: target.pathname, search: target.search }).catch(() => undefined).then(() => {
        // 이동이 끝나고 React가 새 페이지를 그려 대화상자가 걷힌 뒤에 새 화면을 찍는다. 전환 동안은 화면 그리기가 멈춰
        // requestAnimationFrame이 돌지 않으므로 DOM을 보고 기다린다(최대 1초).
        const transition = document.startViewTransition({ update: () => go().then(() => dialogGone()), types: ["panel-expand"] })
        transition.finished.catch(() => undefined)
      })
    },
    done: (next: string) => void navigate({ href: next, replace: true }),
  }
}

/** 상세에서 그 수정 화면(…/edit)으로 간다. 들어온 기록에 표시를 남겨, 끝나면 한 걸음 뒤(상세)로 돌아가게 한다. */
export function useOpenEditor() {
  const navigate = useNavigate()
  return (href: string) => void navigate({ href, state: { [EDITOR_MARK]: true } })
}

/**
 * 수정 화면에서 상세로 돌아간다: 상세에서 들어왔으면 한 걸음 뒤로(기록에 수정 화면이 남지 않는다), 주소로 바로 열었으면
 * 상세의 주소로 바꿔 간다.
 */
export function useLeaveEditor() {
  const router = useRouter()
  const navigate = useNavigate()
  const location = useLocation()
  return (detailHref: string) => {
    if (location.state[EDITOR_MARK]) return router.history.back()
    return void navigate({ href: detailHref, replace: true })
  }
}

/**
 * 지금 페이지(또는 대화상자)의 주소가 있는 대화상자(버전 기록 같은 것): 페이지 주소에 ?dialog=name을 달고 주소창에는 페이지
 * 주소 뒤에 /name을 붙여 보인다(패널처럼 mask). 새로고침 · 복사한 주소는 /name 경로를 거쳐 대화상자가 열린 채 돌아온다
 * (옛 주소 라우트의 unmaskDialogHref). 닫으면 여기서 열었을 때 한 걸음 뒤로, 아니면 그 값만 뗀다.
 */
export function useMaskedDialog(name: string) {
  const router = useRouter()
  const navigate = useNavigate()
  const location = useLocation()
  const { [DIALOG]: open, ...rest } = location.search as Search
  const state = location.state
  const panel = rest[KEY]
  const shown = (typeof panel === "string" ? split(panel).pathname : location.pathname).replace(/\/$/, "")
  return {
    isOpen: open === name,
    open: () => void navigate({
      to: location.pathname, search: { ...rest, [DIALOG]: name }, state: { ...state, [DIALOG_MARK]: true },
      mask: { to: `${shown}/${name}`, state: { ...state, [DIALOG_MARK]: true } },
    }),
    close: () => {
      if (open !== name) return
      if (state[DIALOG_MARK]) return router.history.back()
      void navigate({ to: location.pathname, search: rest, replace: true, state })
    },
  }
}

/** 대화상자 자기 주소(/name)가 가리키는 주소: 페이지 주소에 ?dialog=name(useMaskedDialog 참고). */
export function unmaskDialogHref(pathname: string, searchStr: string, name: string) {
  const params = new URLSearchParams(searchStr)
  params.set(DIALOG, name)
  return `${pathname.slice(0, -(name.length + 1))}?${params}`
}

/** 대화상자 ↔ 페이지를 건너 한 번 넘기는 내용. initial은 처음 그릴 때 받은 것, keep은 맡기기, clear는 버리기. */
export function useComposeTransfer<T>(id: string) {
  const client = useQueryClient()
  const [key] = useState(() => ["compose-transfer", id] as const)
  const [initial] = useState(() => client.getQueryData<T>(key))
  useEffect(() => { client.removeQueries({ queryKey: key, exact: true }) }, [client, key])
  return {
    initial,
    keep: (snapshot: T) => client.setQueryData(key, snapshot),
    clear: () => client.removeQueries({ queryKey: key, exact: true }),
  }
}

/** 대화상자로 열린 양식이 휴대폰 폭이 되면, PanelHost가 페이지로 바꾸기 전에(layout effect) keep을 부른다. */
export function useComposeExpansion(surface: "page" | "dialog" | "pane", keep: () => void) {
  const isMobile = useIsMobile()
  const latest = useRef(keep)
  latest.current = keep
  useLayoutEffect(() => {
    if (surface === "dialog" && isMobile) latest.current()
  }, [surface, isMobile])
}
