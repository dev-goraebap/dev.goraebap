import type { ReactNode } from "react"

/*
 * 읽기만 하는 속성 알약(호호코워크 PropertyPill isDisabled): 상세에서 바꿀 수 없는 값(작성자 · 게시 시각 · 읽은 사람 수 …).
 * 모양은 property-pill과 같고(24px 알약, 휴대폰 44px, 넓은 상세의 옆 칸에서는 32px 줄) 누를 수 없다.
 */
const INFO_PILL = [
  "inline-flex h-6 max-w-64 min-w-0 shrink items-center gap-1.5 rounded-full bg-muted pr-2.5 pl-2 text-xs font-medium text-foreground ring-1 ring-input ring-inset",
  "[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  "max-md:h-11 max-md:pr-3 max-md:pl-2.5 max-md:text-sm",
  "@min-[60rem]/detail:h-8 @min-[60rem]/detail:max-w-full @min-[60rem]/detail:rounded-lg @min-[60rem]/detail:bg-transparent @min-[60rem]/detail:px-2",
  "@min-[60rem]/detail:text-[0.875rem] @min-[60rem]/detail:ring-0",
].join(" ")

export function InfoPill({ label, icon, children }: {
  /** 무슨 값인지(화면 읽기 · 가리킴 풀이). */
  label: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <span data-slot="info-pill" role="group" aria-label={label} title={label} className={INFO_PILL}>
      {icon}
      <span className="min-w-0 truncate">{children}</span>
    </span>
  )
}
