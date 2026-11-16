import { useId, type ReactNode } from "react"
import { Card } from "@/shared/ui/card"
import { FieldGroup } from "@/shared/ui/field"

type SettingsSectionProps = {
  title: string
  /** 이름 줄 끝의 동작(저장, 새 토큰). */
  action?: ReactNode
  /** 카드 아래 한 줄 메모. */
  note?: ReactNode
  /** SettingsRow들. */
  children: ReactNode
}

/** 설정 한 묶음: 작은 이름, 줄을 선으로 나눈 안쪽 여백 없는 Card, 선택적인 메모. */
export function SettingsSection({ title, action, note, children }: SettingsSectionProps) {
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-2">
      <div className="flex min-h-7 items-center justify-between gap-2">
        <h2 id={titleId} className="text-sm font-medium text-muted-foreground">{title}</h2>
        {action}
      </div>
      <Card className="py-0">
        {/* divide-y는 줄 사이에만 선을 그어 마지막 줄 아래가 카드 테두리와 겹치지 않는다. */}
        <FieldGroup className="gap-0 divide-y divide-border">{children}</FieldGroup>
      </Card>
      {note && <p className="text-sm text-muted-foreground">{note}</p>}
    </section>
  )
}
