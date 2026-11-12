import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { documentIcon } from "../model/marks"
import type { DocumentLabel, ProjectDocument } from "../model/types"

/** 라벨 색 점. 저장된 색을 그대로 그린다. */
export function DocumentLabelDot({ color, className }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" width="1rem" height="1rem" aria-hidden="true" focusable="false" className={cn("shrink-0", className)}>
      <circle cx="8" cy="8" r="6" fill={color} stroke="color-mix(in srgb, currentColor 20%, transparent)" strokeWidth="0.75" />
    </svg>
  )
}

/** 라벨 알약 줄: 색 점 + 이름. */
export function DocumentLabels({ labels, className }: { labels: readonly DocumentLabel[]; className?: string }) {
  if (labels.length === 0) return null
  return (
    <span className={cn("flex flex-wrap items-center gap-1", className)}>
      {labels.map(label => (
        <Badge key={label.id} variant="label">
          <DocumentLabelDot color={label.color} />
          {label.name}
        </Badge>
      ))}
    </span>
  )
}

/** 문서 표식 아이콘(고른 아이콘, 없으면 문서). */
export function DocumentIcon({ document, chosen, className }: { document: Pick<ProjectDocument, "icon">; chosen?: boolean; className?: string }) {
  const Icon = documentIcon(document.icon)
  return <Icon chosen={chosen} className={cn("shrink-0", className)} />
}
