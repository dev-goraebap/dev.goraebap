import type { CSSProperties } from "react"
import { cn } from "@/shared/lib/utils"
import { projectIcon } from "../model/marks"
import type { ProjectIconName } from "../model/types"

/**
 * 프로젝트 표식(호호코워크 Mark): 고른 색의 옅은 바탕에 그 색의 아이콘. 목록 줄 앞은 md(28px), 카드 · 칩은 sm(20px).
 * 색은 사용자가 고른 데이터라 --mark로 넘긴다.
 */
export function ProjectMark({ icon, color, size = "md", className }: { icon: ProjectIconName; color: string; size?: "sm" | "md"; className?: string }) {
  const Icon = projectIcon(icon)
  return (
    // check-ui: allow-style 표식 색은 사용자가 고른 데이터 값이다.
    <span aria-hidden style={{ "--mark": color } as CSSProperties}
      className={cn("grid shrink-0 place-items-center bg-[color-mix(in_srgb,var(--mark)_16%,transparent)] text-(--mark)",
        size === "md" ? "size-7 rounded-lg [&_svg]:size-4 max-md:size-9 max-md:[&_svg]:size-5" : "size-5 rounded-sm [&_svg]:size-3.5", className)}>
      <Icon />
    </span>
  )
}
