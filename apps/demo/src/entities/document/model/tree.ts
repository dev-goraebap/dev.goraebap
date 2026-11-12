import type { ProjectDocument } from "./types"

/** 바로 아래 페이지(문서함 순서대로). */
export const childrenOf = (documents: readonly ProjectDocument[], id: string) => documents.filter(each => each.parentId === id)

/** 맨 위 문서부터 바로 위 페이지까지(자기는 빼고). 끊긴 고리는 거기서 멈춘다. */
export function ancestorsOf(documents: readonly ProjectDocument[], id: string) {
  const byId = new Map(documents.map(each => [each.id, each]))
  const chain: ProjectDocument[] = []
  const seen = new Set<string>()
  let current = byId.get(id)
  while (current?.parentId && !seen.has(current.id)) {
    seen.add(current.id)
    const parent = byId.get(current.parentId)
    if (!parent) break
    chain.unshift(parent)
    current = parent
  }
  return chain
}

/** 이 페이지가 속한 맨 위 문서. */
export const rootOf = (documents: readonly ProjectDocument[], document: ProjectDocument) => ancestorsOf(documents, document.id)[0] ?? document

/**
 * 본문이 비어 있고 하위 페이지만 묶는 페이지(호호코워크 isSectionPage): 사이드바에서 누를 항목이 아니라 구역 제목이다.
 * 따로 설정하지 않고 본문으로 판단하므로, 본문을 쓰면 다시 누를 수 있는 항목이 된다.
 */
export const isSectionPage = (document: ProjectDocument, documents: readonly ProjectDocument[]) =>
  !document.body.trim() && documents.some(each => each.parentId === document.id)

/** 읽을 차례: 맨 위 문서부터 깊이 우선. 구역 페이지는 빼서 이전 · 다음이 빈 화면으로 가지 않는다. */
export function readingOrderOf(documents: readonly ProjectDocument[], root: ProjectDocument) {
  const order: string[] = []
  const visit = (page: ProjectDocument) => {
    if (!isSectionPage(page, documents)) order.push(page.id)
    childrenOf(documents, page.id).forEach(visit)
  }
  visit(root)
  return order
}

/** 이 페이지와 그 아래 모든 페이지의 아이디(삭제할 때 함께 지운다). */
export function subtreeIds(documents: readonly ProjectDocument[], id: string) {
  const ids = [id]
  for (let at = 0; at < ids.length; at++) ids.push(...childrenOf(documents, ids[at]).map(each => each.id))
  return ids
}
