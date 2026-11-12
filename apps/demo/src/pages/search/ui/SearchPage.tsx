import { useCanGoBack, useNavigate, useRouter, useSearch } from "@tanstack/react-router"
import { paths } from "@/shared/config"
import { GlobalSearch } from "@/widgets/global-search"
import { parseSearchPage, searchPageSearch } from "../model/search-param"
import { useSearchSources } from "../model/sources"

/**
 * 검색 페이지(/search?q=검색어): 휴대폰이 여는 곳이고, 데스크톱에서는 대화상자의 크게 보기 · 새로고침 · 링크로 온 경우다.
 * 검색어는 멈출 때마다 주소의 ?q를 바꿔(기록은 쌓지 않는다) 새로고침해도 같은 검색이 열린다.
 * 결과를 고르면 그리로 가고, ←는 온 곳으로(온 곳이 없으면 알림함으로) 돌아간다.
 */
export function SearchPage() {
  const navigate = useNavigate()
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const { q } = parseSearchPage(useSearch({ strict: false }) as Record<string, unknown>)
  const { sources, shortcuts } = useSearchSources()
  return (
    <GlobalSearch surface="page" sources={sources} shortcuts={shortcuts} initialWords={q} onGo={href => void navigate({ href })}
      onWordsChange={words => void navigate({ to: paths.search, search: searchPageSearch(words) as never, replace: true })}
      onClose={() => (canGoBack ? router.history.back() : void navigate({ to: paths.notifications }))} />
  )
}

/** 데스크톱의 검색 대화상자. 셸이 사이드바 검색 · Ctrl/⌘+K로 연다. 크게 보기는 지금 검색어를 들고 검색 페이지로 간다. */
export function SearchDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { sources, shortcuts } = useSearchSources()
  return (
    <GlobalSearch surface="dialog" sources={sources} shortcuts={shortcuts} onClose={onClose}
      onExpand={words => {
        onClose()
        void navigate({ to: paths.search, search: searchPageSearch(words) as never })
      }}
      onGo={href => {
        onClose()
        void navigate({ href })
      }} />
  )
}
