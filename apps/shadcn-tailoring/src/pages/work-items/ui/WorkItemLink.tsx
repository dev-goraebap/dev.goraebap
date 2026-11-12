import type { ReactNode } from "react"
import { workItemHref } from "@/entities/work-item"
import { RowLink } from "@/shared/ui/row-link"

/** 업무 제목을 상세로 잇는 줄 링크(줄 · 카드 · 표 줄 전체가 눌린다). */
export function WorkItemLink({ itemKey, className, children }: { itemKey: string; className?: string; children: ReactNode }) {
  return <RowLink to={workItemHref(itemKey)} className={className}>{children}</RowLink>
}
