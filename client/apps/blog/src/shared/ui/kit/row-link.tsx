import { createLink } from "@tanstack/react-router"
import type { ComponentProps } from "react"
import { cn } from "cn"

function RowAnchor({ className, ...props }: ComponentProps<"a">) {
  return (
    <a data-slot="row-link" {...props}
      className={cn("outline-none after:absolute after:inset-0 after:rounded-[inherit] focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring", className)} />
  )
}

/**
 * 줄 전체를 여는 링크(줄의 이름 · 제목에 둔다). ::after가 가장 가까운 relative 조상(줄 · 카드 · 표 줄)을 덮어 어디를 눌러도
 * 열리고, 그 위에 relative z-1로 띄운 것(… 메뉴 · 별표 · 고르기 상자)만 따로 눌린다. 키보드 초점은 덮은 면 전체에 테를 두른다.
 * TanStack Link와 같은 주소 props(to · params · search)를 받는다.
 */
export const RowLink = createLink(RowAnchor)
