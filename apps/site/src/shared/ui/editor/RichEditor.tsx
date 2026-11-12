import type { AnyExtension } from "@tiptap/core"
import { closeHistory, isHistoryTransaction } from "@tiptap/pm/history"
import { Plugin, PluginKey, Selection, TextSelection } from "@tiptap/pm/state"
import { CellSelection } from "@tiptap/pm/tables"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import { EditorContent, useEditor, type Editor, type JSONContent } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { ArrowUpDownIcon, CornerDownLeftIcon, GripIcon } from "@/shared/ui/icon"
import { blockMenuEntries, copyBlocks } from "./BlockMenu"
import { blockMove, blockTree, selectionRoots, siblingStep, type Destination, type TreeBlock } from "./block-tree"
import { EDITOR_COLOR_VARS } from "./colors"
import { MediaNodeView } from "./MediaView"
import { EditorMenu, keepSelection } from "./menu"
import { proseClass } from "./prose"
import { COMMAND_ICONS, COMMANDS, editorExtensions, insertBlock, prepareDocument, type CommandId } from "./schema"
import { SelectionMenu } from "./SelectionMenu"
import { sourceNodeViews } from "./SourceView"
import { TableControls } from "./TableControls"
import { Tip } from "./tool"
import type { LinkChoice, ReadLinkPreview, UploadFile } from "./types"
import { openUploadZone, uploadZoneKey, uploadZonePos, type UploadZoneKind } from "./upload-zone"
import { useUploads } from "./uploads"
import { EditorHostContext, ZoomHost, type HtmlPage, type ZoomSlide } from "./zoom"

const selectionKey = new PluginKey<string[]>("blockSelection")
type BlockInfo = TreeBlock & { size: number; top: number; left: number; width: number; type: string; gripTop?: number }
type DropInfo = { destination: Destination; top: number; left: number; width: number; label: string; error?: string }
type Slash = { from: number; to: number; query: string }

const GROUPS = [...new Set(COMMANDS.map(command => command.group))]
const matching = (query: string) => {
  const filtered = COMMANDS.filter(command => `${command.label} ${command.id}`.toLowerCase().includes(query.toLowerCase()))
  return GROUPS.flatMap(group => filtered.filter(command => command.group === group))
}
const noUpload: UploadFile = async () => { throw Error("이 화면에는 첨부 저장소가 연결되지 않았습니다.") }
/** 고른 블록을 칠하는 화면 표시(decoration)의 클래스. 문서에는 남지 않는다. */
const SELECTED_BLOCK = "rounded-[3px] bg-ring/15"

/** 탭으로 나뉜 글(TSV)을 붙여 넣으면 표로 바꾼다. 2~100행, 2~30열, 행마다 칸 수가 같을 때만. */
function tsvTableHTML(text: string): string | null {
  const rows = text.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n").map(row => row.split("\t"))
  if (rows.length < 2 || rows.length > 100 || rows[0].length < 2 || rows[0].length > 30 || rows.some(row => row.length !== rows[0].length)) return null
  const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
  return `<table><tbody>${rows.map(row => `<tr>${row.map(cell => `<td><p>${escape(cell)}</p></td>`).join("")}</tr>`).join("")}</tbody></table>`
}
/** 쓰는 동안은 여러 줄 입력 칸, 읽는 동안은 글(article)이다. */
const roleOf = (isEditable: boolean): Record<string, string> => isEditable ? { role: "textbox", "aria-multiline": "true" } : { role: "article" }
/** 에디터 뷰가 지금 화면에 붙어 있는지: 마운트 전이나 숨겨진 동안에는 잴 것이 없다. */
const hasView = (editor: Editor | null): editor is Editor => {
  if (!editor || !editor.isInitialized || editor.isDestroyed) return false
  try { return editor.view.dom.isConnected } catch { return false }
}

export type RichEditorProps = {
  value?: JSONContent; isEditable: boolean; onChange?: (value: JSONContent) => void; label?: string; placeholder?: string; isPage?: boolean
  /** 파일 · HTML 임베드를 올린다. 없으면 올리기 동작이 연결되지 않았다고 알린다. */
  upload?: UploadFile
  /** 링크 카드의 미리보기를 읽는다. 없으면 주소만 있는 카드가 된다. */
  readPreview?: ReadLinkPreview
  /** 링크 입력 칸에서 이름으로 찾아 걸 수 있는 문서들. */
  links?: LinkChoice[]
  /** 읽는 화면에서 앱 안의 주소(/…)로 가는 링크를 누르면 새 탭 대신 이 함수로 그 화면에 간다. */
  onNavigate?: (href: string) => void
  /** 덧붙일 Tiptap 확장(문서 편집기의 페이지 나누기 등). 에디터를 만들 때 한 번 읽는다: 바꾸려면 key를 바꾼다. */
  extensions?: AnyExtension[]
  /** 본문(EditorContent)을 감쌀 틀(종이 등). 손잡이 · 메뉴는 틀 밖에서 본문을 재어 자리를 잡는다. */
  frame?: (content: ReactNode) => ReactNode
  /** 에디터가 준비되거나 바뀌면 핸들을 넘긴다. 상단 서식 막대처럼 본문 밖에 두는 도구가 쓴다. */
  onReady?: (handle: EditorHandle | null) => void
}

/** 본문 밖 도구가 쓰는 핸들: Tiptap 에디터와, `/` 명령과 같은 방식의 블록 넣기(파일 · HTML은 올리는 칸을 띄운다). */
export type EditorHandle = { editor: Editor; insert: (id: CommandId) => void }

/**
 * 리치 본문 칸. 읽기와 편집이 같은 에디터이고(isEditable로 오가며 실행 취소 기록을 지킨다), 편집할 때 블록 손잡이 · 블록 메뉴 · `/`
 * 명령 · 선택 서식 도구 · 표 도구 · 올리는 칸이 붙는다. value는 처음 값이다: 입력 중의 onChange를 다시 value로 넘겨도 에디터를 다시
 * 만들지 않는다. 다른 문서로 바꿀 때는 key를 바꾼다. 블록 손잡이 · `/` 목록 · 표 도구의 자리는 본문을 재서 정하므로 인라인 위치를 쓴다.
 */
export function RichEditor({ value, isEditable, onChange, label = "본문", placeholder, isPage = false, upload = noUpload, readPreview, links, onNavigate, extensions, frame, onReady }: RichEditorProps) {
  const initial = useRef<JSONContent | null>(null)
  if (!initial.current) initial.current = prepareDocument(value)
  const host = useRef<HTMLDivElement>(null), fileInput = useRef<HTMLInputElement>(null), change = useRef(onChange)
  change.current = onChange
  const extra = useRef(extensions ?? [])
  const [blocks, setBlocks] = useState<BlockInfo[]>([]), [selected, setSelected] = useState<string[]>([]), [context, setContext] = useState<string | null>(null)
  const [slash, setSlash] = useState<Slash | null>(null), [active, setActive] = useState(0), [refresh, setRefresh] = useState(0), [error, setError] = useState("")
  const [drop, setDrop] = useState<DropInfo | null>(null), [hovered, setHovered] = useState<string | null>(null), [isDragging, setDragging] = useState(false)
  const [paletteBox, setPaletteBox] = useState({ left: 0, top: 0, maxHeight: 380 })
  const [zoom, setZoom] = useState<ZoomSlide | null>(null), [htmlPage, setHtmlPage] = useState<HtmlPage | null>(null)
  const palette = useRef<HTMLDivElement>(null)
  const slashRef = useRef(slash), activeRef = useRef(active), selectedRef = useRef(selected), suppressed = useRef<string | null>(null), skipClick = useRef(false)
  slashRef.current = slash; activeRef.current = active; selectedRef.current = selected
  const dragging = useRef<{ ids: string[]; x: number; y: number; active: boolean } | null>(null)

  const measure = useCallback((editor: Editor) => {
    const box = host.current?.getBoundingClientRect()
    if (!box || !hasView(editor)) return
    const list: BlockInfo[] = []
    for (const block of blockTree(editor.state.doc)) {
      const dom = editor.view.nodeDOM(block.pos)
      if (!(dom instanceof HTMLElement)) continue
      const rect = dom.getBoundingClientRect()
      if (!rect.width || !rect.height) continue
      // 글 블록은 첫 줄보다 높을 수 있다. 손잡이를 블록 상자가 아니라 첫 글줄의 가운데에 맞춘다.
      const line = block.node.isTextblock ? editor.view.coordsAtPos(block.pos + 1) : undefined
      list.push({ ...block, size: block.node.nodeSize, top: rect.top - box.top, left: rect.left - box.left, width: rect.width, type: block.node.type.name,
        gripTop: line ? (line.top + line.bottom) / 2 - box.top : undefined })
    }
    setBlocks(list)
  }, [])

  const editor: Editor | null = useEditor({
    extensions: [...editorExtensions([MediaNodeView, ...sourceNodeViews]), ...extra.current], content: initial.current, editable: isEditable, immediatelyRender: false,
    editorProps: {
      attributes: { class: proseClass(isEditable), ...roleOf(isEditable), "aria-label": label,
        ...(placeholder ? { "data-placeholder": placeholder } : {}), ...(isPage ? { "data-page": "" } : {}) },
      handlePaste: (view, event): boolean => {
        if (!view.editable) return false
        if (event.clipboardData?.files.length) { pickFiles(Array.from(event.clipboardData.files)); return true }
        if (event.clipboardData?.getData("text/html")) return false
        const html = tsvTableHTML(event.clipboardData?.getData("text/plain") ?? "")
        return html ? editor?.commands.insertContent(html) ?? false : false
      },
      handleKeyDown: (view, event): boolean => {
        const menu = slashRef.current
        if (event.isComposing || view.composing) return false
        // 누른 자리로 브라우저 커서가 먼저 옮겨 가고 ProseMirror에는 나중에 알려질 수 있다. Tab은 눈에 보이는 커서가 있는 칸에서 움직여야 한다.
        if (view.editable && event.key === "Tab" && !event.ctrlKey && !event.metaKey && !event.altKey) {
          const dom = view.dom.ownerDocument.getSelection()
          if (!(view.state.selection instanceof CellSelection) && dom?.isCollapsed && dom.focusNode && view.dom.contains(dom.focusNode)
            && (dom.focusNode.nodeType === 1 ? dom.focusNode as Element : dom.focusNode.parentElement)?.closest("td,th")) {
            const head = view.posAtDOM(dom.focusNode, dom.focusOffset), resolved = view.state.doc.resolve(head)
            if (resolved.parent.inlineContent && view.state.selection.head !== head) view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, head)).setMeta("addToHistory", false))
          }
        }
        if (view.editable && event.ctrlKey && !event.altKey && !event.metaKey && ["Home", "End"].includes(event.key)) {
          const edge = event.key === "End" ? Selection.atEnd(view.state.doc) : Selection.atStart(view.state.doc)
          view.dispatch(view.state.tr.setSelection(event.shiftKey ? TextSelection.between(view.state.doc.resolve(view.state.selection.anchor), edge.$head) : edge).scrollIntoView())
          if (menu) { suppressed.current = menu.query; setSlash(null) }
          return true
        }
        if (!menu) return false
        const options = matching(menu.query)
        if (event.key === "ArrowDown") { setActive(n => (n + 1) % Math.max(1, options.length)); return true }
        if (event.key === "ArrowUp") { setActive(n => (n - 1 + options.length) % Math.max(1, options.length)); return true }
        if (event.key === "Escape") { suppressed.current = menu.query; setSlash(null); return true }
        if (event.key === "Enter" && options[activeRef.current]) { run(options[activeRef.current].id); return true }
        return false
      },
    },
    onUpdate: ({ editor: next, transaction }) => {
      if (next.isEditable) change.current?.(next.getJSON())
      measure(next)
      if (transaction.getMeta("blockMove") || isHistoryTransaction(transaction)) {
        const valid = new Set(blockTree(next.state.doc).map(block => block.id))
        setSelected(previous => previous.filter(id => valid.has(id)))
      } else setSelected([])
      setRefresh(n => n + 1)
      const { $from, empty } = next.state.selection, text = $from.parent.textBetween(0, $from.parentOffset, "")
      if (!text.startsWith("/")) suppressed.current = null
      if (empty && /^\/[^\n]{0,40}$/.test(text) && text.slice(1) !== suppressed.current) { setSlash({ from: $from.start(), to: $from.pos, query: text.slice(1) }); setActive(0) }
      else setSlash(null)
    },
    onSelectionUpdate: () => setRefresh(n => n + 1),
  })

  /** 명령 여럿을 실행 취소 한 단계로 묶는다. */
  const atomic = (action: () => unknown) => {
    if (!editor) return
    editor.view.dispatch(closeHistory(editor.state.tr)); action(); editor.view.dispatch(closeHistory(editor.state.tr))
  }
  function run(id: CommandId) {
    if (!editor) return
    const range = slashRef.current
    setSlash(null); suppressed.current = null
    if (id === "file" || id === "html") { if (range) editor.commands.deleteRange({ from: range.from, to: range.to }); openUploadZone(editor.view, id); return }
    atomic(() => insertBlock(editor, id, range ? { from: range.from, to: range.to } : undefined))
  }
  const runRef = useRef(run)
  runRef.current = run
  const readyRef = useRef(onReady)
  readyRef.current = onReady
  useEffect(() => {
    if (!editor) return undefined
    readyRef.current?.({ editor, insert: id => runRef.current(id) })
    return () => readyRef.current?.(null)
  }, [editor])
  const uploads = useUploads(editor, upload)
  function pickFiles(files: File[]) {
    if (!files.length) return
    // 올리는 칸이 열려 있으면 파일을 그 자리에 넣고 칸을 닫는다.
    const zone = editor ? uploadZonePos(editor.state) : null
    if (editor && zone !== null) {
      const { doc, tr } = editor.state
      editor.view.dispatch(tr.setSelection(TextSelection.near(doc.resolve(Math.min(zone, doc.content.size)))).setMeta(uploadZoneKey, { pos: null, kind: "file" }))
    }
    uploads.enqueue(files)
  }

  // 블록 링크(#block-…)로 열면 그 블록으로 옮겨 간다. 본문이 그려진 뒤 한 번만.
  const jumped = useRef(false)
  useEffect(() => {
    if (jumped.current || !editor) return
    const id = window.location.hash.startsWith("#block-") ? decodeURIComponent(window.location.hash.slice(7)) : ""
    const target = id ? host.current?.querySelector(`[data-block-id="${CSS.escape(id)}"]`) : null
    if (!id || target) jumped.current = true
    target?.scrollIntoView({ block: "start" })
  }, [editor, blocks.length])

  // 뷰가 붙을 때마다(처음, 그리고 숨었다 다시 보일 때) 다시 잰다.
  const [mounts, setMounts] = useState(0)
  useEffect(() => {
    if (!editor) return
    const count = () => setMounts(n => n + 1)
    editor.on("mount", count); editor.on("create", count)
    return () => { editor.off("mount", count); editor.off("create", count) }
  }, [editor])
  // 올리는 칸의 파일 고르기는 뷰가 붙은 뒤에 잇는다. HTML 칸은 .html만 하나 고른다.
  useEffect(() => {
    if (!hasView(editor)) return
    const storage = (editor.storage as unknown as { uploadZone?: { pick: (kind: UploadZoneKind) => void } }).uploadZone
    if (!storage) return
    const pick = (kind: UploadZoneKind) => {
      const input = fileInput.current
      if (!input) return
      input.accept = kind === "html" ? ".html,.htm,text/html" : ""
      input.multiple = kind !== "html"
      input.click()
    }
    storage.pick = pick
    return () => { if (storage.pick === pick) storage.pick = () => undefined }
  }, [editor, mounts])
  useEffect(() => {
    if (!editor) return
    // 편집 여부만 바꾸는 것은 본문 변경이 아니다(onChange를 부르지 않는다).
    if (editor.isEditable !== isEditable) editor.setEditable(isEditable, false)
    editor.setOptions({ editorProps: { ...editor.options.editorProps, attributes: { ...editor.options.editorProps.attributes,
      class: proseClass(isEditable), ...roleOf(isEditable) } } })
  }, [editor, isEditable])
  useEffect(() => {
    if (!hasView(editor)) return
    measure(editor)
    const resize = new ResizeObserver(() => measure(editor))
    resize.observe(editor.view.dom)
    if (host.current) resize.observe(host.current)
    const update = () => measure(editor)
    window.addEventListener("resize", update)
    return () => { resize.disconnect(); window.removeEventListener("resize", update) }
  }, [editor, mounts, measure])
  useEffect(() => { if (hasView(editor)) measure(editor) }, [editor, mounts, isEditable, error, refresh, measure])
  // 고른 블록은 화면 표시(decoration)로 칠한다. 문서에는 남지 않는다.
  useEffect(() => {
    if (!hasView(editor)) return
    editor.registerPlugin(new Plugin<string[]>({ key: selectionKey, state: { init: () => [], apply: (tr, value) => tr.getMeta(selectionKey) ?? value },
      props: { decorations: state => DecorationSet.create(state.doc, selectionRoots(blockTree(state.doc), selectionKey.getState(state) ?? [])
        .map(block => Decoration.node(block.pos, block.pos + block.node.nodeSize, { class: SELECTED_BLOCK }))) } }))
    return () => { if (!editor.isDestroyed) editor.unregisterPlugin(selectionKey) }
  }, [editor, mounts])
  useEffect(() => { if (hasView(editor)) editor.view.dispatch(editor.state.tr.setMeta(selectionKey, selected).setMeta("addToHistory", false)) }, [editor, mounts, selected])

  function move(ids: string[], destination: Destination) {
    if (!editor || !isEditable || !ids.length) return
    const result = blockMove(editor.state, ids, destination)
    if (result.error) { setError(result.error); return }
    setError(""); setContext(null); setDrop(null)
    if (result.transaction) { editor.view.dispatch(result.transaction); editor.view.dispatch(closeHistory(editor.state.tr)) }
    setSelected(result.ids)
  }
  function step(direction: number) {
    if (!editor) return
    const destination = siblingStep(blockTree(editor.state.doc), selectedRef.current, direction)
    if (destination) move(selectedRef.current, destination)
  }
  /**
   * 고른 블록의 단축키(블록 메뉴의 표기와 같다): Ctrl+D 복제, Ctrl+C 복사, Delete · Backspace 지우기, Alt+↑ · ↓ 옮기기, Ctrl+Z 되돌리기.
   * 처리했으면 true. 창의 키 듣기와 손잡이가 함께 부른다.
   */
  function blockShortcut(event: { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean; shiftKey: boolean }): boolean {
    if (!editor || !selectedRef.current.length) return false
    const mod = event.ctrlKey || event.metaKey, key = event.key.toLowerCase()
    const picked = () => selectionRoots(blockTree(editor.state.doc), selectedRef.current).map(block => ({ pos: block.pos, size: block.node.nodeSize, node: block.node })).sort((a, b) => b.pos - a.pos)
    if (mod && !event.altKey && key === "z") { if (event.shiftKey) editor.commands.redo(); else editor.commands.undo(); return true }
    if (mod && !event.altKey && key === "d") { atomic(() => { for (const block of picked()) editor.chain().insertContentAt(block.pos + block.size, block.node.toJSON()).run() }); return true }
    if (mod && !event.altKey && key === "c") { void copyBlocks(editor, picked()); return true }
    if (!mod && !event.altKey && (event.key === "Delete" || event.key === "Backspace")) {
      atomic(() => { for (const block of picked()) editor.chain().deleteRange({ from: block.pos, to: block.pos + block.size }).run() })
      setSelected([]); setContext(null)
      return true
    }
    if (event.altKey && !mod && (event.key === "ArrowUp" || event.key === "ArrowDown")) { step(event.key === "ArrowUp" ? -1 : 1); return true }
    return false
  }
  const shortcutRef = useRef(blockShortcut)
  shortcutRef.current = blockShortcut
  // 블록 끌어 옮기기와 고른 블록의 단축키.
  useEffect(() => {
    if (!editor || !isEditable) return
    const target = (x: number, y: number): DropInfo | null => {
      const element = document.elementFromPoint(x, y)
      if (!element || !host.current?.contains(element)) return null
      const tree = blockTree(editor.state.doc), box = host.current.getBoundingClientRect()
      let result: DropInfo | null = null
      if (element.closest("[data-editor-end]")) {
        const last = tree[tree.length - 1]
        if (last) result = { destination: { anchorId: last.id, side: "after" }, top: editor.view.dom.getBoundingClientRect().bottom - box.top, left: 0, width: box.width, label: "문서 맨 아래로" }
      } else {
        const id = element.closest("[data-block-id]")?.getAttribute("data-block-id"), block = tree.find(each => each.id === id)
        const dom = block && editor.view.nodeDOM(block.pos)
        if (block && dom instanceof HTMLElement) {
          const rect = dom.getBoundingClientRect(), side = y < rect.top + rect.height / 2 ? "before" : "after"
          result = { destination: { anchorId: block.id, side }, top: (side === "before" ? rect.top : rect.bottom) - box.top, left: rect.left - box.left, width: rect.width,
            label: side === "before" ? "이 블록 앞에" : "이 블록 뒤에" }
        }
      }
      if (result && selectionRoots(tree, dragging.current?.ids ?? selectedRef.current).some(root => root.id === result!.destination.anchorId)) result.error = "선택한 블록 위에는 놓을 수 없습니다."
      return result
    }
    const motion = (event: PointerEvent) => {
      const drag = dragging.current
      if (!drag) return
      if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 5) drag.active = true
      if (!drag.active) return
      setDragging(true); setContext(null); event.preventDefault(); setDrop(target(event.clientX, event.clientY))
      if (event.clientY < 90) window.scrollBy(0, -12)
      if (event.clientY > window.innerHeight - 70) window.scrollBy(0, 12)
    }
    const end = (event: PointerEvent) => {
      const drag = dragging.current
      if (!drag?.active) { dragging.current = null; setDragging(false); return }
      const location = target(event.clientX, event.clientY)
      dragging.current = null; setDragging(false); setDrop(null)
      skipClick.current = true; setTimeout(() => { skipClick.current = false }, 0)
      if (location && !location.error) move(drag.ids, location.destination)
    }
    const cancel = () => { dragging.current = null; setDragging(false); setDrop(null) }
    const keys = (event: KeyboardEvent) => {
      if (event.isComposing || event.defaultPrevented) return
      if (event.key === "Escape") { const wasDragging = dragging.current?.active; cancel(); if (!wasDragging) setSelected([]) }
      const element = event.target as HTMLElement
      // 메뉴(포털) 안의 키는 메뉴가 다룬다.
      if (element.closest("input,textarea,select,[contenteditable=true],[role=menu],[role=dialog]")) return
      if (shortcutRef.current(event)) event.preventDefault()
    }
    const scroll = () => measure(editor)
    window.addEventListener("pointermove", motion, { passive: false }); window.addEventListener("pointerup", end); window.addEventListener("pointercancel", cancel)
    window.addEventListener("keydown", keys); window.addEventListener("scroll", scroll, true)
    return () => {
      window.removeEventListener("pointermove", motion); window.removeEventListener("pointerup", end); window.removeEventListener("pointercancel", cancel)
      window.removeEventListener("keydown", keys); window.removeEventListener("scroll", scroll, true)
    }
  }, [editor, isEditable, blocks])
  // `/` 목록: 커서 아래(자리가 없으면 위)에 놓고, 화면 안에 머문다.
  useLayoutEffect(() => {
    if (!slash || !editor) return
    const position = () => {
      const rect = editor.view.coordsAtPos(slash.from), bottom = rect.bottom + 6, below = window.innerHeight - bottom - 12, above = rect.top - 12, isUp = below < 260 && above > below
      const maxHeight = Math.max(120, Math.min(380, isUp ? above : below)), height = Math.min(palette.current?.scrollHeight ?? 380, maxHeight)
      setPaletteBox({ left: Math.max(12, Math.min(rect.left, window.innerWidth - Math.min(320, window.innerWidth - 24) - 12)), top: isUp ? Math.max(12, rect.top - height - 6) : Math.max(12, bottom), maxHeight })
    }
    position()
    window.addEventListener("scroll", position, true); window.addEventListener("resize", position)
    return () => { window.removeEventListener("scroll", position, true); window.removeEventListener("resize", position) }
  }, [slash, editor])
  useEffect(() => { if (slash) palette.current?.querySelector("[data-active]")?.scrollIntoView({ block: "nearest" }) }, [active, slash?.query])
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (!palette.current?.contains(event.target as Element) && slashRef.current) { suppressed.current = slashRef.current.query; setSlash(null) }
    }
    document.addEventListener("pointerdown", dismiss)
    return () => document.removeEventListener("pointerdown", dismiss)
  }, [])
  useEffect(() => { if (!isEditable) { setContext(null); setSlash(null); setSelected([]) } }, [isEditable])
  const hostValue = useMemo(() => ({ openZoom: setZoom, openHtml: setHtmlPage, readPreview }), [readPreview])

  // 읽는 화면에서 앱 안의 주소로 가는 링크(문서 언급, 블록 링크)는 새 탭을 열지 않고 그 화면으로 간다. 편집 중에는 누르기가 글 고르기라 두지 않는다.
  const followInside = (event: MouseEvent<HTMLDivElement>) => {
    if (isEditable || !onNavigate || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const href = (event.target as Element).closest("a")?.getAttribute("href")
    if (!href || !/^\/(?!\/)/.test(href)) return
    event.preventDefault()
    onNavigate(href)
  }

  if (!editor) return null
  let scrollParent = editor.isInitialized ? editor.view.dom.parentElement : null
  while (scrollParent && !/(auto|scroll)/.test(getComputedStyle(scrollParent).overflowY)) scrollParent = scrollParent.parentElement
  // 서식 도구는 본문 칸의 좌우 안에 머문다: 창 전체를 기준으로 두면 줄 첫머리를 골랐을 때 왼쪽 메뉴 밑으로 들어가 눌리지 않았다.
  const column = host.current?.getBoundingClientRect()
  const menuPadding = { top: 12, bottom: 84, left: Math.max(12, (column?.left ?? 12) - 8), right: Math.max(12, window.innerWidth - (column?.right ?? window.innerWidth) - 8) }
  const options = matching(slash?.query ?? "")
  const contextBlock = blocks.find(block => block.id === context)
  return (
    <EditorHostContext value={hostValue}>
      <div ref={host} data-editable={isEditable || undefined} data-dragging={isDragging || undefined} onClickCapture={followInside}
        className={cn("relative flex min-w-0 flex-col", EDITOR_COLOR_VARS)}
        onDragOver={event => { if (isEditable && Array.from(event.dataTransfer.types).includes("Files")) { event.preventDefault(); event.dataTransfer.dropEffect = "copy" } }}
        onDropCapture={event => {
          if (!isEditable || !event.dataTransfer.files.length) return
          event.preventDefault(); event.stopPropagation()
          const position = editor.view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
          editor.chain().focus().setTextSelection(position ?? editor.state.selection.from).run()
          pickFiles(Array.from(event.dataTransfer.files))
        }}
        onPointerDownCapture={event => { if ((event.target as Element).closest(".ProseMirror")) { setSelected([]); setContext(null) } }}
        onPointerMove={event => {
          // 손잡이가 있는 가장 가까운 블록을 찾는다: 목록 항목 안의 문단처럼 손잡이가 없는 블록 위에서는 그 목록의 손잡이를 보인다.
          let at = (event.target as Element).closest("[data-block-id]")
          while (at && !blocks.some(block => block.id === at!.getAttribute("data-block-id"))) at = at.parentElement?.closest("[data-block-id]") ?? null
          setHovered(at?.getAttribute("data-block-id") ?? null)
        }} onPointerLeave={() => setHovered(null)}>
        {isEditable ? <BubbleMenu editor={editor} updateDelay={0} className="z-40"
          shouldShow={({ editor: current, state, view, element, from, to }) => current.isEditable && state.selection instanceof TextSelection && !state.selection.empty
            && !!state.doc.textBetween(from, to).length && (view.hasFocus() || element.contains(element.ownerDocument.activeElement))}
          options={{ strategy: "fixed", placement: "top", offset: 10, scrollTarget: scrollParent ?? window, flip: { padding: menuPadding, fallbackPlacements: ["bottom"] },
            shift: { padding: menuPadding, crossAxis: true } }}>
          <SelectionMenu editor={editor} links={links} />
        </BubbleMenu> : null}
        {isEditable ? <TableControls editor={editor} host={host} atomic={atomic} /> : null}
        {error ? <p role="alert" className="mb-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">{error}</p> : null}
        {uploads.panel}
        {frame ? frame(<EditorContent editor={editor} />) : <EditorContent editor={editor} />}
        {isEditable ? (
          // 손잡이는 글줄 왼쪽 바깥(1.625rem)에 둔다. 대화상자 · 페이지의 데스크톱 좌우 여백이 이 자리를 품는다.
          <div aria-label="본문 블록 조작" className="pointer-events-none absolute top-0 -left-6.5 w-6.5 print:hidden">
            {blocks.map((block, index) => (
              <div key={block.id} data-control-block={block.id} data-selected={selected.includes(block.id) || undefined} data-hovered={hovered === block.id || undefined}
                data-open={context === block.id || undefined} data-align-line={block.gripTop !== undefined || undefined}
                // 손잡이를 글줄 가운데에 맞춘다(높이의 절반만큼 올린다). transform으로 옮기면 그 안의 고정 위치 요소의 기준이 바뀌어 margin으로 옮긴다.
                className="pointer-events-auto absolute z-11 flex h-7.25 items-center opacity-0 transition-opacity hover:opacity-100 focus-within:opacity-100 data-hovered:opacity-100 data-open:z-30 data-open:opacity-100 data-selected:opacity-100 data-align-line:-mt-[0.90625rem] motion-reduce:transition-none"
                // check-ui: allow-style 손잡이 자리는 블록을 재서 정한다.
                style={{ top: block.gripTop ?? block.top, left: block.left }}>
                <EditorMenu label="블록 메뉴" side="left" open={context === block.id} onOpenChange={next => { if (!next) setContext(null) }}
                  entries={contextBlock && context === block.id ? blockMenuEntries({ editor, block: { id: block.id, pos: block.pos, size: block.size, type: block.type }, atomic, onStep: step }) : []}
                  trigger={<Tip label="끌어서 옮기기 · 눌러서 메뉴 · Shift/Ctrl 여러 개 고르기">
                    <Button variant="ghost" size="icon-sm" aria-label={`${index + 1}번 블록 선택`} data-grip="" aria-pressed={selected.includes(block.id)}
                      className="h-6.75 w-6 min-w-6 cursor-grab touch-none rounded-md p-0 text-icon-muted select-none hover:bg-accent hover:text-foreground aria-pressed:text-foreground"
                      onContextMenu={event => { event.preventDefault(); setSelected([block.id]); setContext(block.id) }}
                      // 손잡이는 블록 메뉴를 여는 단추라 ↓ 같은 키를 메뉴가 먼저 가져간다. 블록 단축키는 붙잡는 단계에서 먼저 처리하고
                      // 메뉴 쪽으로 넘기지 않는다. 고르지 않은 손잡이에서 누르면 그 블록 하나에 쓴다.
                      onKeyDownCapture={event => {
                        if (event.nativeEvent.isComposing) return
                        const isPicked = selectedRef.current.includes(block.id)
                        const previous = selectedRef.current
                        if (!isPicked) selectedRef.current = [block.id]
                        if (!shortcutRef.current(event)) { selectedRef.current = previous; return }
                        event.preventDefault(); event.stopPropagation()
                        // 지운 블록의 손잡이는 사라지므로 초점을 본문으로 돌린다.
                        if (event.key === "Delete" || event.key === "Backspace") editor.view.focus()
                        else if (!isPicked) setSelected([block.id])
                      }}
                      onPointerDown={event => {
                        if (event.button !== 0) return
                        event.preventDefault(); event.currentTarget.focus({ preventScroll: true })
                        dragging.current = { ids: selected.includes(block.id) ? selected : [block.id], x: event.clientX, y: event.clientY, active: false }
                      }}
                      onClick={event => {
                        if (skipClick.current) return
                        if (event.shiftKey && selected.length) {
                          const from = blocks.findIndex(each => each.id === selected[0])
                          setSelected(blocks.slice(Math.min(from, index), Math.max(from, index) + 1).map(each => each.id))
                        } else if (event.ctrlKey || event.metaKey) setSelected(previous => previous.includes(block.id) ? previous.filter(id => id !== block.id) : [...previous, block.id])
                        else setSelected([block.id])
                        setContext(event.shiftKey || event.ctrlKey || event.metaKey ? null : context === block.id ? null : block.id)
                      }}>
                      <GripIcon />
                    </Button>
                  </Tip>} />
              </div>
            ))}
          </div>
        ) : null}
        {drop ? (
          // check-ui: allow-style 놓을 자리는 블록을 재서 정한다.
          <div data-invalid={drop.error ? "" : undefined} className="pointer-events-none absolute z-17 h-[3px] bg-ring data-invalid:bg-destructive" style={{ top: drop.top, left: drop.left, width: drop.width }}>
            <span className="absolute top-1 left-1 rounded-sm bg-foreground px-1.75 py-0.75 text-[0.625rem] whitespace-nowrap text-background">{drop.error ?? drop.label}</span>
          </div>
        ) : null}
        {isEditable && isDragging ? <div data-editor-end="" aria-hidden className="min-h-6 cursor-grabbing" /> : null}
        {/* 파일 고르기는 브라우저의 파일 입력이 맡는다(보이지 않는 입력). */}
        <input hidden ref={fileInput} type="file" multiple aria-label="파일 첨부" onChange={event => { pickFiles(Array.from(event.target.files ?? [])); event.target.value = "" }} />
        {slash && isEditable ? (
          <div ref={palette} role="dialog" aria-label="블록 추가 메뉴"
            className="fixed z-55 box-border flex w-80 max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-lg border border-input bg-popover py-1.25 text-popover-foreground shadow-md"
            // check-ui: allow-style `/` 목록은 커서 자리를 재서 놓는다.
            style={paletteBox}>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1.25">
              {options.map((command, index) => {
                const Icon = COMMAND_ICONS[command.id]
                return (
                  <div key={command.id} className="contents">
                    {index === 0 || options[index - 1].group !== command.group
                      ? <div className="px-2.25 pt-2.5 pb-1.5 text-[0.625rem] font-medium tracking-[0.02em] text-muted-foreground">{command.group}</div> : null}
                    <button type="button" data-active={index === active || undefined} onMouseDown={keepSelection} onMouseEnter={() => setActive(index)} onClick={() => run(command.id)}
                      className="flex min-h-11.25 w-full items-center gap-2.5 rounded-md px-1.75 py-1.25 text-left outline-none data-active:bg-accent max-md:min-h-12">
                      <span className="grid size-7.5 flex-none place-items-center rounded-md border text-icon-muted [&_svg]:size-4.5"><Icon /></span>
                      <span className="flex min-w-0 flex-col leading-[1.35]">
                        <span className="text-sm font-medium">{command.label}</span><span className="text-xs text-muted-foreground">{command.hint}</span>
                      </span>
                    </button>
                  </div>
                )
              })}
              {!options.length ? <p className="p-3 text-xs text-muted-foreground">일치하는 블록이 없습니다.</p> : null}
            </div>
            <div className="mt-1.25 flex flex-none items-center justify-between border-t px-2.5 pt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 [&_svg]:size-3"><ArrowUpDownIcon />이동<CornerDownLeftIcon />추가</span>
              <Button variant="ghost" size="xs" onClick={() => { setSlash(null); editor.commands.focus() }}>
                닫기<kbd className="rounded border px-1 font-mono text-[0.625rem]">esc</kbd>
              </Button>
            </div>
          </div>
        ) : null}
      </div>
      <ZoomHost slide={zoom} page={htmlPage} onClose={() => { setZoom(null); setHtmlPage(null) }} />
    </EditorHostContext>
  )
}
