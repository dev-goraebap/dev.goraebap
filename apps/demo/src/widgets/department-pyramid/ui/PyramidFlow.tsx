import { Background, BackgroundVariant, Controls, ReactFlow, type EdgeTypes, type NodeTypes } from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Department, Member } from "@/entities/member"
import { cn } from "@/shared/lib/utils"
import { pyramidLayout } from "../model/pyramid-layout"
import { PyramidLinkEdge, type PyramidLinkFlowEdge } from "./PyramidLinkEdge"
import { PyramidNode, type PyramidFlowNode } from "./PyramidNode"

const nodeTypes: NodeTypes = { department: PyramidNode }
const edgeTypes: EdgeTypes = { link: PyramidLinkEdge }

/** 루트 글자 크기(px). 큰 화면에서 커지므로(app/styles/index.css) 상자를 이 크기로 배치한다. */
const rootRem = () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16

/**
 * React Flow의 색 변수를 테마 토큰으로 바꾼다. 라이브러리의 기본값 대신 이 값을 쓰므로 라이트 · 다크를 토큰이 따른다.
 * 바탕은 페이지 면과 같은 색으로 칠해 페이지의 고정된 점 무늬를 가리고, 캔버스와 함께 움직이는 점을 그린다.
 */
const CANVAS = cn(
  "[--xy-background-color:var(--background)] [--xy-edge-stroke:var(--muted-foreground)] [--xy-edge-stroke-width:1]",
  "[--xy-controls-button-background-color:var(--card)] [--xy-controls-button-background-color-hover:var(--muted)]",
  "[--xy-controls-button-color:var(--foreground)] [--xy-controls-button-color-hover:var(--foreground)]",
  "[--xy-controls-button-border-color:var(--border)] [--xy-controls-box-shadow:none]",
)
/** 페이지 점 무늬(bg-dots)와 같은 색. */
const DOT = "color-mix(in srgb, var(--foreground) 12%, transparent)"

/**
 * 조직도 캔버스(호호코워크 PyramidFlow): 부서를 층별 피라미드로 놓고 직각 선으로 잇는다. 점 무늬 바탕 위에서 끌어 옮기고
 * 확대 · 축소하며, 처음에는 전체가 보이게 맞춘다. 보기 전용이라 상자는 옮기거나 고르지 않고, 상자 안의 사람을 누르면
 * 프로필이 열린다. current: 프로필이 열린 사람의 부서(테두리로 표시).
 */
export function PyramidFlow({ departments, members, current, onOpen }: {
  departments: readonly Department[]; members: readonly Member[]; current: string | null; onOpen: (memberId: string) => void
}) {
  const [rem, setRem] = useState(rootRem)
  useEffect(() => {
    const resize = () => setRem(rootRem())
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [])
  // 페이지가 렌더마다 새 함수를 넘겨도 상자를 다시 만들지 않도록 최신 함수를 ref로 부른다.
  const openRef = useRef(onOpen)
  useEffect(() => { openRef.current = onOpen })
  const open = useCallback((memberId: string) => openRef.current(memberId), [])

  const layout = useMemo(() => pyramidLayout(departments, members, rem), [departments, members, rem])
  const nodes = useMemo<PyramidFlowNode[]>(() => layout.boxes.map(box => ({
    id: box.id, type: "department" as const, position: { x: box.x, y: box.y }, width: box.width, height: box.height,
    draggable: false, connectable: false, selectable: false, focusable: false, ariaLabel: box.department.name,
    data: { box, isCurrent: box.id === current, onOpen: open },
  })), [layout, current, open])
  const edges = useMemo<PyramidLinkFlowEdge[]>(() => layout.links.map(link => ({
    id: link.id, source: link.source, target: link.target, type: "link", selectable: false, focusable: false,
    data: { link, levelGap: layout.levelGap },
  })), [layout])

  return (
    <section aria-label="조직도" className="relative min-h-0 flex-1">
      <div className="absolute inset-0">
        <ReactFlow className={CANVAS} nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
          fitView fitViewOptions={{ padding: 0.15, maxZoom: 1 }} minZoom={0.3} maxZoom={1.5}
          nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} nodesFocusable={false} edgesFocusable={false}
          proOptions={{ hideAttribution: true }}>
          <Background variant={BackgroundVariant.Dots} gap={24} size={1.25} color={DOT} />
          <Controls showInteractive={false} position="bottom-right" className="overflow-hidden rounded-lg border" />
        </ReactFlow>
      </div>
    </section>
  )
}
