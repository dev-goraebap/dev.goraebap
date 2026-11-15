import type { ReactNode } from "react"
import { Button } from "@/shared/ui/button"
import { SparklesIcon } from "@/shared/ui/icon"

/**
 * 데스크톱 화면 아래 40px 줄(AppShell의 bottomBar, 화면 폭 전체). 오른쪽 끝에 에이전트를 여는 조용한 단추(보조 글자색),
 * 앱이 넣는 것(바코드 장식 · 상태)은 그 단추 바로 왼쪽에 붙는다.
 * 휴대폰에는 두지 않는다(하단 탭 자리다).
 */
export function AgentBar({ label = "Agent", onOpen, start, children }: {
  label?: string; onOpen?: () => void
  /** 줄 왼쪽 끝(앱의 버전 같은 조용한 정보). */
  start?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="flex h-10 shrink-0 items-center justify-end gap-2 px-3">
      {start && <div className="mr-auto flex min-w-0 items-center gap-2 pl-2 text-xs text-muted-foreground">{start}</div>}
      {children && <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">{children}</div>}
      <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onOpen}>
        <SparklesIcon data-icon="inline-start" />
        {label}
      </Button>
    </div>
  )
}
