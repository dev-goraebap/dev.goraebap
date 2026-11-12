import { ME_ID, useMember } from "@/entities/member"
import { Button } from "@/shared/ui/button"

/**
 * 개발용 바로 들어가기(호호코워크 DevLogin). 호호코워크는 개발 서버가 주는 구성원 중 하나를 골라 들어가지만,
 * 목업의 "나"는 늘 한 사람이라 고르기 없이 그 사람으로 들어간다. 개발 서버(npm run dev)에서만 보인다.
 */
export function DevLogin({ onSignIn }: { onSignIn: (email: string) => void }) {
  const me = useMember(ME_ID).data
  if (!import.meta.env.DEV || !me) return null
  return (
    <Button type="button" variant="view" className="w-full" onClick={() => onSignIn(me.email)}>
      개발 로그인 · {me.name}
    </Button>
  )
}
