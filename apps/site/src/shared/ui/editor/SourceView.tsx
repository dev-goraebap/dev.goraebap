import { closeHistory } from "@tiptap/pm/history"
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react"
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { GlobeIcon, PencilIcon, ZoomInIcon } from "@/shared/ui/icon"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { diagramColors, embedURL, useDiagram } from "./diagram"
import { LinkCard } from "./LinkCard"
import { BlockTool, BlockTools, CopyButton, useEditable } from "./MediaView"
import { SOURCE_EXAMPLES, sourceNode, type SourceKind } from "./schema"
import { ZONE, ZONE_ART } from "./upload-zone"
import { diagramSlide, useEditorHost } from "./zoom"

const LABELS: Record<SourceKind, string> = { mermaidBlock: "Mermaid", webEmbed: "링크 카드" }
const ERROR = "rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-xs text-destructive"

/** 그린 SVG는 Mermaid가 만든 글이라(securityLevel strict) 그대로 넣는다. 높이는 36rem까지다. */
function MermaidSvg({ html }: { html: string }) {
  const box = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => { if (box.current) box.current.innerHTML = html }, [html])
  return <div ref={box} className="block w-full text-center [&_svg]:mx-auto [&_svg]:block [&_svg]:max-h-[36rem]" />
}

/**
 * 원문 하나로 그리는 블록의 노드 뷰: Mermaid 도표와 링크 카드. 도표는 틀 없이 칸 폭을 채우고(원래 크기의 3배까지, 높이 36rem 안),
 * 도구(크게 보기 · 원문 복사 · 편집)는 포인터를 올리거나 초점이 들어오면 오른쪽 위에 뜬다. 원문 편집 칸은 테마 색을 따른다.
 * 링크 카드는 주소를 넣는 점선 칸(올리는 칸과 같은 모양)과 카드로 보인다.
 */
function SourceView({ node, editor, updateAttributes, getPos, selected }: NodeViewProps) {
  const kind = node.type.name as SourceKind, source = String(node.attrs.source ?? ""), label = LABELS[kind]
  const isEditable = useEditable(editor)
  const [isEditing, setEditing] = useState(false), [draft, setDraft] = useState(source)
  const textarea = useRef<HTMLTextAreaElement>(null), address = useRef<HTMLInputElement>(null), previewBox = useRef<HTMLDivElement>(null)
  const { openZoom } = useEditorHost()
  const diagram = useDiagram(isEditing ? draft : source, kind === "mermaidBlock")
  const embed = useMemo(() => {
    if (kind !== "webEmbed") return { error: "" }
    const value = isEditing ? draft : source
    if (!value.trim()) return { error: "웹 주소를 입력하세요." }
    try { return { ...embedURL(value), error: "" } } catch (error) { return { error: (error as Error).message } }
  }, [kind, isEditing, draft, source])
  const preview = kind === "mermaidBlock" ? diagram : { pending: false, error: embed.error, html: "" }
  useEffect(() => { setEditing(editor.isEditable && !source.trim()); setDraft(source) }, [source])
  useEffect(() => { if (!isEditable) setEditing(false) }, [isEditable])
  useEffect(() => { if (isEditing) (textarea.current ?? address.current)?.focus() }, [isEditing])
  const start = () => { if (!isEditable) return; setDraft(source); setEditing(true) }
  // 도표를 크게 보기 창으로 연다(지금 화면 색표의 바탕을 깐 채로).
  const zoom = () => {
    const slide = diagramSlide(previewBox.current?.querySelector("svg"), diagramColors[diagram.scheme].background, `${label} 크게 보기`)
    if (slide) openZoom(slide)
  }
  // 취소: 아직 주소가 없는 새 링크 카드는 빈 블록을 남기지 않고 지운다.
  const cancel = () => {
    const pos = getPos()
    if (kind === "webEmbed" && !source.trim() && typeof pos === "number") { editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run(); return }
    setDraft(source); setEditing(false); editor.commands.focus()
  }
  const apply = () => {
    if (!isEditable || preview.pending || preview.error) return
    editor.view.dispatch(closeHistory(editor.state.tr))
    updateAttributes({ source: draft.trim() })
    editor.view.dispatch(closeHistory(editor.state.tr))
    setEditing(false)
    const pos = getPos()
    if (typeof pos === "number") editor.chain().focus().setNodeSelection(pos).run()
  }
  const keys = (isMultiline: boolean) => (event: KeyboardEvent) => {
    if (event.nativeEvent.isComposing) return
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); cancel() }
    if (event.key === "Enter" && (!isMultiline || event.ctrlKey || event.metaKey)) { event.preventDefault(); event.stopPropagation(); apply() }
  }
  const render = () => preview.pending ? <p role="status" className="text-xs text-muted-foreground">미리보기 만드는 중…</p>
    : preview.error ? <p role="alert" className={ERROR}>{label}를 표시할 수 없습니다. {preview.error}</p>
      : kind === "webEmbed" && "host" in embed && embed.host ? <LinkCard url={embed.original} host={embed.host} isEditable={isEditable} onEdit={start} />
        : <MermaidSvg html={diagram.html} />
  return (
    <NodeViewWrapper as="div" data-selected={selected && isEditable ? "" : undefined} data-rich-type={kind} data-block-id={node.attrs.blockId ?? undefined} contentEditable={false}
      className={cn("group/block relative", kind === "webEmbed" ? "my-3.5" : "my-(--block-gap)")}>
      {kind === "mermaidBlock" ? (
        <BlockTools>
          {!isEditing && !preview.pending && !preview.error ? <BlockTool label="다이어그램 크게 보기" tip="크게 보기" onClick={zoom}><ZoomInIcon /></BlockTool> : null}
          <CopyButton text={source} label="Mermaid 원문 복사" />
          {isEditable && !isEditing ? <BlockTool label={`${label} 편집`} tip="편집" onClick={start}><PencilIcon /></BlockTool> : null}
        </BlockTools>
      ) : null}
      {kind === "webEmbed" && isEditing ? null : (
        <div ref={previewBox} onDoubleClick={kind === "mermaidBlock" ? (isEditable ? start : zoom) : undefined}
          className={cn(kind === "mermaidBlock" && "flex justify-center rounded-[0.625rem] py-2 group-data-selected/block:outline-2 group-data-selected/block:outline-offset-4 group-data-selected/block:outline-ring",
            kind === "mermaidBlock" && !isEditable && "cursor-zoom-in")}>
          {render()}
        </div>
      )}
      {isEditable && isEditing && kind === "webEmbed" ? (
        <div role="group" aria-label="링크 카드 주소 넣기" className={cn(ZONE, "my-0 flex flex-col items-center gap-2 px-4 py-7 text-center text-sm text-foreground hover:border-input hover:bg-accent")}>
          <span className={ZONE_ART}><GlobeIcon /></span>
          <span>카드로 보여 줄 웹 페이지 주소를 붙여 넣으세요</span>
          <Input ref={address} aria-label="웹 주소" value={draft} placeholder="https://" className="w-[min(30rem,100%)] bg-card text-center"
            onChange={event => setDraft(event.target.value)} onKeyDown={keys(false)} />
          <span role={draft.trim() && preview.error ? "alert" : undefined} className={cn("text-xs text-muted-foreground", draft.trim() && preview.error && "text-destructive")}>
            {draft.trim() && preview.error ? preview.error : "그 페이지의 제목 · 설명 · 대표 사진을 카드로 보여 줍니다 · HTTPS 주소만 · Enter 넣기 · Esc 취소"}
          </span>
          <div className="flex gap-1.5">
            <Button variant="ghost" size="sm" className="max-md:h-11" onClick={cancel}>취소</Button>
            <Button size="sm" className="max-md:h-11" disabled={!draft.trim() || !!preview.error} onClick={apply}>넣기</Button>
          </div>
        </div>
      ) : null}
      {isEditable && isEditing && kind === "mermaidBlock" ? (
        <div role="group" aria-label={`${label} 원문 편집`} className="mt-2 flex flex-col gap-2 rounded-xl border bg-muted px-3.5 py-3 text-foreground">
          <span className="text-xs text-muted-foreground">Mermaid 원문</span>
          <Textarea ref={textarea} aria-label={`${label} 원문`} value={draft} rows={6} placeholder={SOURCE_EXAMPLES.mermaidBlock}
            className="bg-card font-mono text-[0.8125rem] leading-relaxed" onChange={event => setDraft(event.target.value)} onKeyDown={keys(true)} />
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground max-md:hidden">Ctrl+Enter 적용 · Esc 취소</span>
            <Button variant="ghost" size="sm" className="max-md:h-11" onClick={cancel}>취소</Button>
            <Button size="sm" className="max-md:h-11" disabled={preview.pending || !!preview.error} onClick={apply}>적용</Button>
          </div>
        </div>
      ) : null}
      {!isEditing && preview.error && kind === "mermaidBlock" ? <p className="mt-2 text-xs whitespace-pre-wrap text-muted-foreground">{source || `${label}를 편집해 주세요.`}</p> : null}
    </NodeViewWrapper>
  )
}

export const sourceNodeViews = (["mermaidBlock", "webEmbed"] as SourceKind[]).map(kind => sourceNode(kind).extend({ addNodeView() { return ReactNodeViewRenderer(SourceView) } }))
