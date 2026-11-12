import { Button } from "@/shared/ui/button"
import { SparklesIcon } from "@/shared/ui/icon"

/** 데스크톱 본문 아래 40px 줄. 끝에 Agent 버튼(보조 글자색). 휴대폰에는 없다. */
export function AgentBar() {
  return (
    <div className="flex h-10 shrink-0 items-center justify-end px-3">
      <Button variant="ghost" size="sm" className="text-muted-foreground">
        <SparklesIcon data-icon="inline-start" />
        Agent
      </Button>
    </div>
  )
}
