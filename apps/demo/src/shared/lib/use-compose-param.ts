import { useLocation, useNavigate, useRouter } from "@tanstack/react-router"

declare module "@tanstack/react-router" {
  interface HistoryState {
    /** 이 페이지에서 ?compose를 달아 양식을 연 기록의 표시. 있으면 닫기가 한 걸음 뒤로 가서 기록에 양식이 남지 않는다. */
    composeOpenedHere?: boolean
  }
}

const KEY = "compose"

/**
 * 지금 페이지 위에 연 만들기 · 고치기 양식(?compose=1). 따로 라우트가 없는 양식이 주소에 남아 새로고침 · 뒤로 가기를 따른다:
 * 데스크톱은 페이지 위 대화상자, 휴대폰은 페이지 자리를 대신하는 양식이 이 표시를 읽는다.
 * close는 연 기록이면 한 걸음 뒤로, 아니면 표시를 뗀 주소로 바꾼다. done은 양식 자리를 다른 주소(만든 것의 상세)로 바꾼다.
 */
export function useComposeParam() {
  const router = useRouter()
  const navigate = useNavigate()
  const location = useLocation()
  const { [KEY]: flag, ...rest } = location.search as Record<string, unknown>
  return {
    isOpen: flag !== undefined,
    open: () => void navigate({
      to: location.pathname,
      search: (current: Record<string, unknown>) => ({ ...current, [KEY]: 1 }),
      state: current => ({ ...current, composeOpenedHere: true }),
    }),
    close: () => {
      if (location.state.composeOpenedHere) return router.history.back()
      void navigate({ to: location.pathname, search: rest, replace: true })
    },
    done: (href: string) => void navigate({ to: href, replace: true }),
  }
}
