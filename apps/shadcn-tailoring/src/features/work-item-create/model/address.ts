import { useParams } from "@tanstack/react-router"
import { workItemHref, type WorkItemStatus } from "@/entities/work-item"
import { projectPath } from "@/shared/config"
import { useOpenPanel, usePanel } from "@/shared/lib/panel"

/**
 * 새 업무의 주소. 자기 페이지는 프로젝트의 work-items/new(?status=처음 상태)이고, 목록 위 대화상자 ↔ 페이지는
 * 공지사항 · 회의록 · 주간보고와 같은 shared/lib/panel이 맡는다(데스크톱은 mask 대화상자, 휴대폰은 페이지).
 */
const useProjectKey = () => (useParams({ strict: false }) as { projectKey?: string }).projectKey ?? ""

/** 주소의 처음 상태(?status=칸 id). 칸은 프로젝트마다 다르므로 여기서는 글자인지만 보고, 없는 칸은 양식이 대체 칸으로 바꾼다. */
export const statusFromSearch = (search: Record<string, unknown>): WorkItemStatus | undefined =>
  typeof search.status === "string" && search.status ? search.status : undefined

const newWorkItemHref = (projectKey: string, status?: WorkItemStatus) =>
  `${projectPath(projectKey, "work-items/new")}${status ? `?${new URLSearchParams({ status })}` : ""}`

/** 새 업무를 연다: 데스크톱은 지금 목록 위 대화상자, 휴대폰은 페이지. status는 처음 고를 상태(상태 묶음의 +). */
export function useOpenNewWorkItem() {
  const open = useOpenPanel()
  const projectKey = useProjectKey()
  return (status?: WorkItemStatus) => open(newWorkItemHref(projectKey, status))
}

/**
 * 목록 위에 열린 새 업무 대화상자. close는 연 기록이면 한 걸음 뒤로, expand는 같은 양식을 페이지로,
 * done은 만든 업무의 상세로 대화상자 자리를 바꾼다. 휴대폰에서 열린 채 좁아지면 panel이 페이지로 옮긴다.
 */
export function useNewWorkItemPanel() {
  const panel = usePanel()
  const isOpen = panel.pathname === projectPath(useProjectKey(), "work-items/new")
  return {
    isOpen,
    status: isOpen ? statusFromSearch(panel.search) : undefined,
    close: panel.close,
    expand: panel.expand,
    done: (key: string) => panel.done(workItemHref(key)),
  }
}
