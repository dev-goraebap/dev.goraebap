import type { ReactNode } from "react"
import { Field, FieldContent, FieldDescription, FieldTitle } from "@/shared/ui/field"

type SettingsRowProps = {
  /** 이름. 링크처럼 글자가 아닌 것도 된다(저장소 연동의 저장소 주소). */
  label: ReactNode
  description?: ReactNode
  /** 값이나 조작. 없으면 보조색 "-". */
  children?: ReactNode
  /** 값 없이 이름과 설명만 읽는 줄이면 false("-"도 두지 않는다). */
  hasValue?: boolean
  /**
   * 넓은 조작(고르기 묶음, 선택 상자)은 줄이 좁으면 이름 아래로 내려 전체 폭을 쓴다.
   * 스위치 같은 작은 조작은 좁아도 이름 옆에 둔다.
   */
  wide?: boolean
}

/** 설정 한 줄: 왼쪽에 이름과 설명, 오른쪽에 값이나 조작. 줄 높이 44px 이상, 안쪽 12px. */
export function SettingsRow({ label, description, children, hasValue = true, wide = false }: SettingsRowProps) {
  return (
    <Field
      orientation={wide ? "responsive" : "horizontal"}
      className="min-h-11 p-3 has-[>[data-slot=field-content]]:items-center @md/field-group:has-[>[data-slot=field-content]]:items-center"
    >
      <FieldContent>
        <FieldTitle>{label}</FieldTitle>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FieldContent>
      {hasValue && (children ?? <span className="text-muted-foreground">-</span>)}
    </Field>
  )
}
