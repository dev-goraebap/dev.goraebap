import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router"
import { paths } from "@/shared/config"
import { GlobalSearch } from "@/widgets/global-search"
import { useSearchSources } from "../model/sources"

/**
 * 검색 페이지(/search): 휴대폰이 여는 곳이고, 데스크톱에서는 새로고침 · 링크로 온 경우다(평소에는 대화상자).
 * 결과를 고르면 그리로 가고, ←는 온 곳으로(온 곳이 없으면 알림함으로) 돌아간다.
 */
export function SearchPage() {
  const navigate = useNavigate()
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const { sources, shortcuts } = useSearchSources()
  return (
    <GlobalSearch surface="page" sources={sources} shortcuts={shortcuts} onGo={href => void navigate({ href })}
      onClose={() => (canGoBack ? router.history.back() : void navigate({ to: paths.notifications }))} />
  )
}

/** 데스크톱의 검색 대화상자. 셸이 사이드바 검색 · Ctrl/⌘+K로 연다. */
export function SearchDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { sources, shortcuts } = useSearchSources()
  return (
    <GlobalSearch surface="dialog" sources={sources} shortcuts={shortcuts} onClose={onClose}
      onGo={href => {
        onClose()
        void navigate({ href })
      }} />
  )
}
