import type { ReactNode } from "react"
import { Button } from "@/shared/ui/button"
import { SparklesIcon } from "@/shared/ui/icon"

/**
 * 데스크톱 본문 아래 40px 줄(AppShell의 bottomBar). 끝에 에이전트를 여는 조용한 단추(보조 글자색), 앞에는 앱이 넣는 상태.
 * 휴대폰에는 두지 않는다(하단 탭 자리다).
 */
export function AgentBar({ label = "Agent", onOpen, children }: { label?: string; onOpen?: () => void; children?: ReactNode }) {
  return (
    <div className="flex h-10 shrink-0 items-center justify-end gap-2 px-3">
      {children && <div className="mr-auto flex min-w-0 items-center gap-2 text-xs text-muted-foreground">{children}</div>}
      <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onOpen}>
        <SparklesIcon data-icon="inline-start" />
        {label}
      </Button>
    </div>
  )
}
