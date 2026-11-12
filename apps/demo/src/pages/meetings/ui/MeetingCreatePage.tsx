import { useLocation, useNavigate } from "@tanstack/react-router"
import { meetingHref } from "@/entities/meeting"
import { paths } from "@/shared/config"
import { projectFrom } from "../model/address"
import { MeetingCompose } from "./MeetingCompose"

/**
 * 새 회의록의 자기 페이지(/meetings/new, ?project=처음 프로젝트, 호호코워크 MeetingCreatePage): 링크 · 새로고침 · 크게 보기,
 * 그리고 휴대폰은 늘 여기로 온다(데스크톱에서 목록의 버튼으로 열면 목록 위 대화상자다). 만들면 그 회의록이 이 자리를 대신하고,
 * 취소는 목록으로 간다.
 */
export function MeetingCreatePage() {
  const navigate = useNavigate()
  const project = useLocation({ select: location => projectFrom(location.search as Record<string, unknown>) })
  return (
    <MeetingCompose key={project} project={project} surface="page"
      onClose={() => void navigate({ to: paths.meetings })}
      onSaved={id => void navigate({ href: meetingHref(id), replace: true })} />
  )
}
