import { Handle, Position, type Node, type NodeProps } from "@xyflow/react"
import { memo } from "react"
import { MemberAvatar } from "@/entities/member"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import type { DepartmentBox } from "../model/pyramid-layout"

export type PyramidFlowNode = Node<{ box: DepartmentBox; isCurrent: boolean; onOpen: (memberId: string) => void }, "department">

/**
 * React Flow는 고를 수도 옮길 수도 없는 상자에 pointer-events: none을 준다. 상자 안의 사람 단추가 눌리도록 상자에서 되살린다
 * (끌기는 여전히 캔버스를 옮긴다).
 */
const PRESSABLE = "pointer-events-auto"
/** 선의 끝점만 정한다. 이어 그리기는 막았으니 보이지 않게 둔다. */
const HANDLE = "pointer-events-none opacity-0"

/**
 * 부서 상자(호호코워크 PyramidNode): 이름, 사람 수와 바로 아래 부서 수, 그 아래 사람이 한 줄씩(부서장 먼저, 표식),
 * 최대 열 명과 나머지 수. 사람을 누르면 프로필이 열린다. 높이는 pyramid-layout의 BOX(rem)와 맞춘다: 머리 3.625rem
 * (위 여백 0.625 + 이름 · 수 2.625 + 0.375), 줄 1.625rem, 바닥 0.625rem.
 */
export const PyramidNode = memo(function PyramidNode({ data }: NodeProps<PyramidFlowNode>) {
  const { box, isCurrent, onOpen } = data
  const { department, depth, childCount, memberCount, roster } = box
  return (
    <section aria-label={department.name} data-current={isCurrent || undefined}
      className={cn(PRESSABLE, "flex size-full min-w-0 flex-col rounded-xl border px-3 py-2.5 text-card-foreground",
        depth === 0 ? "bg-muted" : "bg-card", "data-current:border-ring data-current:ring-3 data-current:ring-ring/25")}>
      <Handle type="target" position={Position.Top} className={HANDLE} isConnectable={false} />
      <Handle type="source" position={Position.Bottom} className={HANDLE} isConnectable={false} />
      <header className="mb-1.5 flex h-10.5 min-w-0 flex-col justify-center">
        <h3 className="truncate text-sm font-semibold">{department.name}</h3>
        <p className="text-xs text-muted-foreground tabular-nums">{memberCount}명{childCount > 0 && ` · 하위 ${childCount}개`}</p>
      </header>
      <ul className="flex min-w-0 flex-col">
        {!roster.hasLead && <li className="flex h-6.5 items-center text-xs text-muted-foreground">부서장 미지정</li>}
        {roster.lines.map(line => (
          <li key={line.member.id} className="h-6.5">
            <button type="button" onClick={() => onOpen(line.member.id)}
              className="-mx-1.5 flex h-full w-[calc(100%+0.75rem)] items-center gap-1.5 rounded-md px-1.5 text-left text-xs outline-none hover:bg-row-hover focus-visible:ring-3 focus-visible:ring-ring/50">
              <MemberAvatar member={line.member} className="size-4" />
              <span className="min-w-0 flex-1 truncate">{line.member.name}<span className="text-muted-foreground"> · {line.rank}</span></span>
              {line.isLead && <Badge variant="label">부서장</Badge>}
            </button>
          </li>
        ))}
        {roster.more > 0 && <li className="flex h-6.5 items-center text-xs text-muted-foreground tabular-nums">외 {roster.more}명</li>}
      </ul>
    </section>
  )
})
