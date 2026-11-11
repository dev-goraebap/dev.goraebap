import { useLocation, useNavigate, useRouter } from "@tanstack/react-router"
import { STATUSES, workItemHref, type WorkItemStatus } from "@/entities/work-item"
import { paths } from "@/shared/config"
import { useIsMobile } from "@/shared/lib/use-mobile"

/**
 * 새 업무의 주소(호호코워크 shared/lib/panel). 자기 페이지는 /work-items/new(?status=처음 상태)다. 데스크톱에서 목록의
 * 버튼으로 열면 목록 주소에 ?panel=new를 달고 주소창에는 TanStack Router의 mask로 /work-items/new를 보인다
 * (unmaskOnReload: 새로고침 · 복사한 주소는 페이지로 연다). 휴대폰에는 대화상자가 없어 늘 페이지로 간다.
 */
export const NEW_WORK_ITEM_PATH = `${paths.workItems}/new`

const PANEL = "panel"
const PANEL_VALUE = "new"

declare module "@tanstack/react-router" {
  interface HistoryState {
    /** 새 업무 대화상자를 연 기록의 표시. 있으면 닫기가 한 걸음 뒤로 가서 기록에 대화상자가 남지 않는다. */
    newWorkItemPanel?: boolean
  }
}

type Search = Record<string, unknown>

/** 주소의 처음 상태(?status=). 모르는 값은 버린다. */
export const statusFromSearch = (search: Search): WorkItemStatus | undefined =>
  STATUSES.find(status => status.value === search.status)?.value

const statusSearch = (status?: WorkItemStatus) => (status ? { status } : {})

/** 새 업무를 연다: 데스크톱은 지금 목록 위 대화상자, 휴대폰은 페이지. status는 처음 고를 상태(상태 묶음의 +). */
export function useOpenNewWorkItem() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  return (status?: WorkItemStatus) => {
    if (isMobile) return void navigate({ to: NEW_WORK_ITEM_PATH, search: statusSearch(status) })
    void navigate({
      to: paths.workItems,
      search: (current: Search) => ({ ...current, [PANEL]: PANEL_VALUE, status }),
      state: current => ({ ...current, newWorkItemPanel: true }),
      mask: { to: NEW_WORK_ITEM_PATH, search: statusSearch(status), unmaskOnReload: true },
    })
  }
}

/**
 * 목록 위에 열린 새 업무 대화상자. close는 연 기록이면 한 걸음 뒤로, 아니면 표시를 뗀 목록 주소로 바꾼다.
 * expand는 같은 양식을 페이지로, done은 만든 업무의 상세로 대화상자 자리를 바꾼다.
 */
export function useNewWorkItemPanel() {
  const router = useRouter()
  const navigate = useNavigate()
  const location = useLocation()
  const { [PANEL]: panel, status: chosen, ...rest } = location.search as Search
  const status = statusFromSearch({ status: chosen })
  const isOpenedHere = Boolean(location.state.newWorkItemPanel)
  return {
    isOpen: panel === PANEL_VALUE,
    status,
    close: () => {
      if (isOpenedHere) return router.history.back()
      void navigate({ to: location.pathname, search: rest, replace: true })
    },
    expand: () => void navigate({ to: NEW_WORK_ITEM_PATH, search: statusSearch(status), replace: true }),
    done: (key: string) => void navigate({ to: workItemHref(key), replace: true }),
  }
}
