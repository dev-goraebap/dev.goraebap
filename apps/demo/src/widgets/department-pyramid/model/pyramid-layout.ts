import { byDepartmentOrder, roleOf, type Department, type Member } from "@/entities/member"

/** 상자의 한 줄: 부서장 먼저, 그다음 부서 사람을 조직도 순서(직급 · 이름)로. */
export type RosterLine = { member: Member; rank: string; isLead: boolean }
/** 상자에 적는 사람(최대 MAX_LINES명)과 나머지 수. */
export type Roster = { lines: RosterLine[]; more: number; hasLead: boolean }
export type DepartmentBox = {
  id: string; department: Department; depth: number; childCount: number; memberCount: number; roster: Roster
  x: number; y: number; width: number; height: number
}
/** 위 부서의 아래에서 다음 층 사이의 가로 막대로, 막대를 따라, 아래 부서로 내려가는 선. */
export type DepartmentLink = { id: string; source: string; target: string }
export type DepartmentLayout = { boxes: DepartmentBox[]; links: DepartmentLink[]; levelGap: number }

/**
 * 상자 너비, 머리(이름 · 사람 수), 줄 하나, 바닥, 층 사이 · 형제 사이 간격(rem). 상자의 클래스가 같은 값을 쓰고(PyramidNode),
 * 배치는 이 값을 루트 글자 크기로 픽셀로 바꾼다. 큰 화면에서 글자가 커져도 상자에 맞는다.
 */
const BOX = { width: 14.5, head: 3.625, line: 1.625, foot: 0.625 } as const
const LEVEL_GAP = 4.5
const SIBLING_GAP = 1.75
/** 사촌(부모가 다른 이웃)은 형제보다 조금 더 떨어뜨려 한 집안이 묶여 보이게 한다(호호코워크 separation 1.2). */
const COUSIN_SEPARATION = 1.2
export const MAX_LINES = 10

/**
 * 부서의 사람: 부서장, 그다음 부서 사람을 조직도 순서로. MAX_LINES에서 자르고 나머지는 센다. 부서장 아이디가 있어도
 * 구성원 중에 없으면 없는 것과 같다.
 */
export function rosterOf(department: Department, members: readonly Member[]): Roster {
  const lead = members.find(member => member.id === department.lead)
  const own = members.filter(member => member.departmentId === department.id && member.id !== lead?.id).sort(byDepartmentOrder)
  const all: RosterLine[] = [
    ...(lead ? [{ member: lead, rank: roleOf(lead), isLead: true }] : []),
    ...own.map(member => ({ member, rank: roleOf(member), isLead: false })),
  ]
  return { lines: all.slice(0, MAX_LINES), more: Math.max(all.length - MAX_LINES, 0), hasLead: Boolean(lead) }
}

/** 상자는 적힌 사람마다, "부서장 미지정"과 "외 N명"이 있으면 그만큼 한 줄씩 길어진다(rem). */
const boxHeight = (roster: Roster) =>
  BOX.head + (roster.lines.length + (roster.hasLead ? 0 : 1) + (roster.more > 0 ? 1 : 0)) * BOX.line + BOX.foot

type TreeNode = { department: Department; depth: number; children: TreeNode[]; parent?: TreeNode; span: number; x: number }

/**
 * 부서를 위에서 아래로 피라미드로: 층마다 한 줄, 한 부모의 부서는 그 아래 나란히, 맨 위 부서들은 맨 위에 나란히.
 * 호호코워크는 d3-hierarchy의 tidy tree를 쓰지만 이 앱에는 그 패키지가 없어 같은 규칙을 직접 계산한다: 가지마다 아래
 * 부서가 필요한 만큼 폭을 차지하고, 부모는 자식들의 가운데에 선다. 상자 높이는 사람 수를 따르고, 한 층의 상자는 윗변을
 * 맞추며, 다음 층은 그 층의 가장 긴 상자 아래에서 시작한다. rem: 루트 글자 크기(px).
 */
export function pyramidLayout(departments: readonly Department[], members: readonly Member[], rem: number): DepartmentLayout {
  const width = BOX.width * rem
  const step = width + SIBLING_GAP * rem
  const known = new Set(departments.map(department => department.id))
  const grow = (department: Department, depth: number, parent?: TreeNode): TreeNode => {
    const node: TreeNode = { department, depth, children: [], parent, span: 0, x: 0 }
    node.children = departments.filter(each => each.parent === department.id).map(child => grow(child, depth + 1, node))
    return node
  }
  // 부모가 목록에 없는 부서도 맨 위에 둔다(잃어버리지 않는다).
  const forest = departments.filter(department => !department.parent || !known.has(department.parent)).map(department => grow(department, 0))

  // 이웃한 두 가지의 간격(상자 중심 사이, step 단위): 둘 다 잎이면 형제 간격, 아래가 있으면 사촌 간격.
  const gapBetween = (left: TreeNode, right: TreeNode) => (left.children.length || right.children.length ? COUSIN_SEPARATION : 1)
  // span: 가지가 차지하는 폭(첫 잎 중심에서 끝 잎 중심까지, step 단위).
  const measure = (node: TreeNode): number => {
    node.children.forEach(measure)
    node.span = node.children.reduce((sum, child, index) => sum + child.span + (index ? gapBetween(node.children[index - 1]!, child) : 0), 0)
    return node.span
  }
  // 왼쪽 끝에서부터 자식을 놓고 부모는 첫 자식과 끝 자식의 가운데에 둔다.
  const place = (nodes: TreeNode[], start: number) => {
    let cursor = start
    nodes.forEach((node, index) => {
      if (index) cursor += gapBetween(nodes[index - 1]!, node)
      place(node.children, cursor)
      node.x = cursor + node.span / 2
      cursor += node.span
    })
  }
  forest.forEach(measure)
  place(forest, 0)

  const nodes: TreeNode[] = []
  const walk = (node: TreeNode) => { nodes.push(node); node.children.forEach(walk) }
  forest.forEach(walk)

  const rosters = new Map(nodes.map(node => [node.department.id, rosterOf(node.department, members)]))
  const heightOf = (id: string) => boxHeight(rosters.get(id)!) * rem
  const tallest: number[] = []
  for (const node of nodes) tallest[node.depth] = Math.max(tallest[node.depth] ?? 0, heightOf(node.department.id))
  const levelGap = LEVEL_GAP * rem
  const levelTop = tallest.reduce<number[]>((tops, _, level) => [...tops, level === 0 ? 0 : tops[level - 1]! + tallest[level - 1]! + levelGap], [])

  const boxes = nodes.map(node => ({
    id: node.department.id, department: node.department, depth: node.depth, childCount: node.children.length,
    memberCount: members.filter(member => member.departmentId === node.department.id).length, roster: rosters.get(node.department.id)!,
    x: node.x * step - width / 2, y: levelTop[node.depth]!, width, height: heightOf(node.department.id),
  }))
  const links = nodes.filter(node => node.parent).map(node => ({
    id: `${node.parent!.department.id}-${node.department.id}`, source: node.parent!.department.id, target: node.department.id,
  }))
  return { boxes, links, levelGap }
}
