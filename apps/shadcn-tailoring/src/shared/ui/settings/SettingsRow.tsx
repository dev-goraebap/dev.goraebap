import type { ReactNode } from "react"
import { Field, FieldContent, FieldDescription, FieldTitle } from "@/shared/ui/field"

type SettingsRowProps = {
  label: string
  description?: ReactNode
  /** 값이나 조작. 없으면 보조색 "-". */
  children?: ReactNode
  /**
   * 넓은 조작(고르기 묶음, 선택 상자)은 줄이 좁으면 이름 아래로 내려 전체 폭을 쓴다.
   * 스위치 같은 작은 조작은 좁아도 이름 옆에 둔다.
   */
  wide?: boolean
}

/** 설정 한 줄: 왼쪽에 이름과 설명, 오른쪽에 값이나 조작. 줄 높이 44px 이상, 안쪽 12px. */
export function SettingsRow({ label, description, children, wide = false }: SettingsRowProps) {
  return (
    <Field
      orientation={wide ? "responsive" : "horizontal"}
      className="min-h-11 p-3 has-[>[data-slot=field-content]]:items-center @md/field-group:has-[>[data-slot=field-content]]:items-center"
    >
      <FieldContent>
        <FieldTitle>{label}</FieldTitle>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FieldContent>
      {children ?? <span className="text-muted-foreground">-</span>}
    </Field>
  )
}
