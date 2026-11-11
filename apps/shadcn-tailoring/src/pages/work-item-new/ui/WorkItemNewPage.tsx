import { useLocation, useNavigate } from "@tanstack/react-router"
import { workItemHref } from "@/entities/work-item"
import { statusFromSearch, WorkItemCompose } from "@/features/work-item-create"
import { paths } from "@/shared/config"

/**
 * 새 업무의 자기 페이지(/work-items/new, ?status=처음 상태): 링크 · 새로고침 · 크게 보기, 그리고 휴대폰은 늘 여기로 온다
 * (데스크톱에서 목록의 버튼으로 열면 목록 위 대화상자다). 만들면 그 업무의 상세가 이 자리를 대신하고, 취소는 목록으로 간다.
 */
export function WorkItemNewPage() {
  const navigate = useNavigate()
  const status = useLocation({ select: location => statusFromSearch(location.search as Record<string, unknown>) })
  return (
    <WorkItemCompose key={status} surface="page" status={status}
      onClose={() => void navigate({ to: paths.workItems })}
      onCreated={item => void navigate({ to: workItemHref(item.key), replace: true })} />
  )
}
