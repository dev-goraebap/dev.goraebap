import type { AnyExtension } from "@tiptap/core"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import type { EditorHandle } from "@/shared/ui/editor"
import { formatOf, type PageLook, type PageSetup } from "./model"
import { PageCanvas, type PageArea } from "./PageCanvas"
import { Pagination, refreshPagination, type PageLayout } from "./pagination"

/**
 * 리치 에디터를 페이지 보기로 만드는 연결: 페이지 나누기 확장(extensions), 종이 틀(frame), 지금 배치(layout).
 * 편집기(DocumentEditor)와 보기(DocumentView)가 함께 쓴다. 확장은 isPaged가 바뀔 때만 새로 만들고(그때 호스트가 에디터 key를 바꾼다),
 * 용지 · 여백 · 간격이 바뀌면 에디터를 새로 만들지 않고 handle로 다시 나눈다.
 */
export function usePagedFrame({ isPaged, setup, look, zoom, handle, onLayout, onEditArea, activeArea, isInline }: {
  isPaged: boolean; setup: PageSetup; look?: PageLook; zoom: number; handle: EditorHandle | null
  onLayout?: (layout: PageLayout) => void; onEditArea?: (area: PageArea) => void; activeArea?: PageArea | null; isInline?: boolean
}): { extensions: AnyExtension[]; frame?: (content: ReactNode) => ReactNode; layout: PageLayout | null } {
  const [layout, setLayout] = useState<PageLayout | null>(null)
  const format = formatOf(setup)
  const formatRef = useRef(format), notify = useRef(onLayout)
  formatRef.current = format
  notify.current = onLayout
  const extensions = useMemo(() => isPaged ? [Pagination.configure({ format: () => formatRef.current, onLayout: next => {
    setLayout(current => current && JSON.stringify(current) === JSON.stringify(next) ? current : next)
    notify.current?.(next)
  } })] : [], [isPaged])
  useEffect(() => { if (handle && isPaged) refreshPagination(handle.editor.view) }, [handle, isPaged, format.name, format.gap])
  const frame = isPaged ? (content: ReactNode) => <PageCanvas setup={setup} layout={layout} zoom={zoom} look={look} isInline={isInline}
    onEditArea={onEditArea} activeArea={activeArea}>{content}</PageCanvas> : undefined
  return { extensions, frame, layout }
}

/** 내용이 실제로 바뀔 때만 올라가는 번호. 읽기 전용 에디터를 새 내용으로 다시 그릴 key로 쓴다(같은 내용이면 선택 · 그림을 지킨다). */
export function useContentVersion(value: unknown): number {
  const versions = useRef({ text: "", version: 0 })
  const text = JSON.stringify(value)
  if (text !== versions.current.text) versions.current = { text, version: versions.current.version + 1 }
  return versions.current.version
}
