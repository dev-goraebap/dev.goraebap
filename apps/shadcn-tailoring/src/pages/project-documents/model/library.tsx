import {
  DocumentLabelDot, type DocumentDirection, type DocumentLabel, type DocumentLayout, type DocumentSavedView, type DocumentSort, type ProjectDocument,
} from "@/entities/document"
import type { FilterDef, FilterState } from "@/shared/ui/filter"
import { TagIcon } from "@/shared/ui/icon"

export type FilterKey = "label"

/** 문서함 필터(호호코워크 ProjectLibrary): 문서 라벨 하나. 라벨은 문서함마다 다르다. */
export const filtersOf = (labels: readonly DocumentLabel[]): FilterDef<FilterKey>[] => [
  { key: "label", label: "문서 라벨", icon: TagIcon, isSearchable: true,
    options: labels.map(label => ({ value: label.id, label: label.name, icon: <DocumentLabelDot color={label.color} /> })) },
]

/** 표시: 보기(그리드 · 리스트) · 정렬 기준 · 방향. 뷰마다 처음 값이 다르다. */
export type Display = { layout: DocumentLayout; sort: DocumentSort; direction: DocumentDirection }
export const INITIAL_DISPLAY: Display = { layout: "grid", sort: "custom", direction: "asc" }
export const displayOf = (view?: DocumentSavedView): Display => (view ? { layout: view.layout, sort: view.sort, direction: view.direction } : INITIAL_DISPLAY)

export const LAYOUTS: { value: DocumentLayout; label: string }[] = [{ value: "grid", label: "그리드" }, { value: "list", label: "리스트" }]
export const SORTS: { value: DocumentSort; label: string; kind: "rank" | "text" | "date" }[] = [
  { value: "custom", label: "사용자 지정", kind: "rank" }, { value: "title", label: "제목", kind: "text" },
  { value: "updated", label: "수정일", kind: "date" }, { value: "created", label: "작성일", kind: "date" },
]
/** 방향의 말은 정렬 기준에 맞춘다. 앞이 오름차순이다. */
export const DIRECTIONS = { rank: ["처음 → 끝", "끝 → 처음"], text: ["가 → 하", "하 → 가"], date: ["오래된 → 최신", "최신 → 오래된"] } as const

/**
 * 목록에 보일 맨 위 문서(서버가 하듯): 고른 라벨 중 하나 이상을 가졌고, 찾는 말이 제목이나 본문에 있다.
 * 하위 페이지는 목록에 따로 서지 않지만, 찾는 말이 하위 페이지에 있으면 그 맨 위 문서가 걸린다.
 */
export function applyFilters(documents: readonly ProjectDocument[], state: FilterState<FilterKey>, query: string) {
  const words = query.trim().toLowerCase()
  const has = (document: ProjectDocument) => `${document.title}\n${document.body}`.toLowerCase().includes(words)
  const matchedRoots = new Set<string>()
  if (words) {
    const byId = new Map(documents.map(each => [each.id, each]))
    for (const document of documents.filter(has)) {
      let root = document
      while (root.parentId && byId.has(root.parentId)) root = byId.get(root.parentId)!
      matchedRoots.add(root.id)
    }
  }
  return documents.filter(document => !document.parentId
    && (!state.label?.length || document.labelIds.some(id => state.label!.includes(id)))
    && (!words || matchedRoots.has(document.id)))
}

/** 정렬. 사용자 지정은 문서함의 순서다. */
export function orderDocuments(documents: readonly ProjectDocument[], display: Display) {
  const sorted = [...documents]
  if (display.sort !== "custom") {
    sorted.sort((a, b) => display.sort === "title" ? a.title.localeCompare(b.title, "ko")
      : display.sort === "created" ? a.createdAt.localeCompare(b.createdAt) : a.updatedAt.localeCompare(b.updatedAt))
  }
  return display.direction === "desc" ? sorted.reverse() : sorted
}
