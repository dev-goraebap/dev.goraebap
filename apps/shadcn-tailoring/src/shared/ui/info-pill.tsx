import type { ReactNode } from "react"
import { pillVariants } from "@/shared/ui/property-pill"

/**
 * 읽기만 하는 속성 알약(호호코워크 PropertyPill isDisabled): 상세에서 바꿀 수 없는 값(작성자 · 게시 시각 · 읽은 사람 수 …).
 * 모양은 PropertyPill과 같고(pillVariants) 누를 수 없어 버튼이 아니다.
 */
export function InfoPill({ label, icon, children }: {
  /** 무슨 값인지(화면 읽기 · 가리킴 풀이). */
  label: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <span data-slot="info-pill" role="group" aria-label={label} title={label} className={pillVariants({ interactive: false })}>
      {icon}
      <span className="min-w-0 truncate">{children}</span>
    </span>
  )
}
