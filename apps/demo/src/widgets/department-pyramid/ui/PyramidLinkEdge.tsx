import { BaseEdge, type Edge, type EdgeProps } from "@xyflow/react"
import type { DepartmentLink } from "../model/pyramid-layout"

export type PyramidLinkFlowEdge = Edge<{ link: DepartmentLink; levelGap: number }, "link">

/**
 * 종이 조직도처럼 직각으로 꺾이는 선: 부서 아래에서 다음 층까지의 절반에 놓인 가로 막대로 내려가, 막대를 따라 가서 아래
 * 부서로 내려간다. 한 부모의 부서들은 한 막대에 매달린다.
 */
export function PyramidLinkEdge({ id, sourceX, sourceY, targetX, targetY, data }: EdgeProps<PyramidLinkFlowEdge>) {
  // 한 층의 상자는 높이가 달라 윗변만 같으므로 막대 높이는 아래 층에서 잰다.
  const bar = targetY - (data?.levelGap ?? 0) / 2
  return <BaseEdge id={id} path={`M ${sourceX} ${sourceY} V ${bar} H ${targetX} V ${targetY}`} />
}
