import { useLocation, useNavigate, useRouter, useSearch } from "@tanstack/react-router"
import { paths } from "@/shared/config"
import { useIsMobile } from "@/shared/lib/use-mobile"

/** 목록 위 대화상자로 연 프로필의 주소 표시(?member=). 주소창에는 /members/{id}가 보인다(라우터 mask). */
const PARAM = "member"

/** 목록 주소에 실린, 대화상자로 연 구성원. */
export function useDialogMember() {
  const search = useSearch({ strict: false }) as Record<string, unknown>
  return typeof search[PARAM] === "string" ? search[PARAM] : undefined
}

const withMember = (memberId: string | undefined) => (previous: Record<string, unknown>) => {
  const { [PARAM]: _, ...rest } = previous
  return memberId ? { ...rest, [PARAM]: memberId } : rest
}

/**
 * 프로필을 여는 길(호호코워크 useOpenPanel): 데스크톱은 목록 주소에 ?member=를 싣고 주소창에는 /members/{id}를 보이는
 * mask로 목록 위 대화상자를 연다(새로고침하면 mask를 풀어 그 페이지). 휴대폰은 늘 그 페이지. 대화상자 안에서 이어 열면
 * 기록을 쌓지 않고 바꾸며, 닫기는 한 걸음 뒤로, 크게 보기는 그 페이지로 바꾼다.
 */
export function useProfileRoute() {
  const navigate = useNavigate()
  const router = useRouter()
  const isMobile = useIsMobile()
  const isMasked = useLocation({ select: location => Boolean(location.maskedLocation) })
  const page = (memberId: string, replace = false) => navigate({ to: "/members/$memberId", params: { memberId }, replace })
  return {
    page,
    open: (memberId: string, { replace = false } = {}) => isMobile ? page(memberId) : navigate({
      to: paths.members, search: withMember(memberId) as never, replace,
      mask: { to: "/members/$memberId", params: { memberId }, unmaskOnReload: true },
    }),
    close: () => isMasked ? router.history.back() : navigate({ to: paths.members, search: withMember(undefined) as never, replace: true }),
  }
}
