import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"
import { cn } from "@/shared/lib/utils"

/**
 * 업무 제목을 상세로 잇는 링크. ::after가 가장 가까운 relative 조상(줄 · 카드 · 표 줄)을 덮어 어디를 눌러도 상세로 가고,
 * 그 위에 relative z-1로 띄운 것(… 메뉴 · 고르기 상자)만 따로 눌린다. 키보드 초점은 덮은 면 전체에 테를 두른다.
 */
export function WorkItemLink({ itemKey, className, children }: { itemKey: string; className?: string; children: ReactNode }) {
  return (
    <Link to="/work-items/$workItemKey" params={{ workItemKey: itemKey }}
      className={cn("outline-none after:absolute after:inset-0 after:rounded-[inherit] focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring", className)}>
      {children}
    </Link>
  )
}
