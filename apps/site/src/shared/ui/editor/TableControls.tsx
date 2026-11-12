import { TextSelection } from "@tiptap/pm/state"
import { moveTableColumn, moveTableRow, selectedRect } from "@tiptap/pm/tables"
import type { Editor } from "@tiptap/react"
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react"
import { cn } from "@/shared/lib/utils"
import { ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon, GripIcon, MoreHorizontalIcon, PlusIcon, TableIcon, Trash2Icon } from "@/shared/ui/icon"
import { EditorMenu, keepSelection, type MenuEntry } from "./menu"
import { Tip } from "./tool"

/** 손잡이 · 단추가 놓일 자리(에디터 틀 기준 px). 표가 가로로 넘치면 보이는 부분에 맞춘다. */
type Box = { left: number; top: number; width: number; height: number; row?: { top: number; height: number }; col?: { left: number; width: number } }
type Kind = "row" | "col" | "table"
const LABEL = { row: "행 메뉴", col: "열 메뉴", table: "표 메뉴" } as const

const cellOf = (node: EventTarget | Node | null) => (node instanceof Element ? node : node instanceof Node ? node.parentElement : null)?.closest<HTMLTableCellElement>("td,th") ?? null

/** 표 손잡이: 테두리 있는 작은 단추. 가리키거나 메뉴가 열리면 글자색으로 칠한다. 손가락으로 누를 자리는 보이는 것보다 넓다. */
const HANDLE = "absolute grid place-items-center rounded-[0.3125rem] border border-input bg-card text-icon-muted shadow-xs outline-none [&_svg]:size-3 "
  + "hover:border-transparent hover:bg-foreground hover:text-background aria-expanded:border-transparent aria-expanded:bg-foreground aria-expanded:text-background "
  + "focus-visible:ring-3 focus-visible:ring-ring/50 after:absolute after:-inset-2 after:content-['']"
const ADD = "absolute grid place-items-center rounded-sm bg-accent text-icon-muted outline-none [&_svg]:size-3 hover:bg-pressed hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"

/**
 * 표 둘레의 편집 도구. 표 바로 옆에서 고친다: 포인터가 있는 칸(없으면 커서가 있는 칸)의 행 왼쪽 · 열 위쪽에 손잡이가 뜨고,
 * 누르면 그 행 · 열의 메뉴(추가 · 이동 · 머리글 · 삭제)가 열린다. 표 오른쪽 · 아래 가장자리의 + 막대는 끝에 열 · 행을 더하고, 왼쪽 위
 * 모서리 단추는 표 전체의 메뉴(셀 병합 · 나누기 · 머리글 · 표 삭제)다. 열 너비는 열 경계를 끌어 바꾼다(ResizableTable).
 * 병합된 칸이 섞인 표에서는 손잡이가 그 칸의 첫 행 · 열을 가리키며, 터치 화면에서는 커서가 있는 칸 기준으로만 뜬다.
 * 메뉴는 데스크톱 드롭다운, 휴대폰 바텀시트다. 손잡이 자리는 표를 재서 정하므로 인라인 위치를 쓴다.
 */
export function TableControls({ editor, host, atomic }: { editor: Editor; host: RefObject<HTMLElement | null>; atomic: (fn: () => unknown) => void }) {
  const [hover, setHover] = useState<HTMLTableCellElement | null>(null), [box, setBox] = useState<Box | null>(null), [menu, setMenu] = useState<Kind | null>(null), [tick, setTick] = useState(0)
  const leave = useRef<number | undefined>(undefined), frozen = useRef<HTMLTableCellElement | null>(null)
  // 지금 가리키는 칸: 메뉴가 열려 있으면 그 칸을 붙잡고, 아니면 포인터가 있는 칸, 그것도 없으면 커서가 있는 칸.
  const caretCell = useCallback(() => { try { return cellOf(editor.view.domAtPos(editor.state.selection.from).node) } catch { return null } }, [editor])
  const current = useCallback(() => { const cell = frozen.current ?? hover; return cell?.isConnected && editor.view.dom.contains(cell) ? cell : caretCell() }, [editor, hover, caretCell])

  const measure = useCallback(() => {
    const frame = host.current, cell = current(), table = cell?.closest("table"), wrapper = table?.closest<HTMLElement>(".tableWrapper") ?? table
    if (!frame || !cell || !table || !wrapper) { setBox(null); return }
    const origin = frame.getBoundingClientRect(), outer = wrapper.getBoundingClientRect(), inner = table.getBoundingClientRect()
    const row = cell.parentElement!.getBoundingClientRect(), own = cell.getBoundingClientRect()
    const left = Math.max(outer.left, inner.left), right = Math.min(outer.right, inner.right), center = own.left + own.width / 2
    setBox({ left: left - origin.left, top: inner.top - origin.top, width: right - left, height: inner.height, row: { top: row.top - origin.top, height: row.height },
      col: center >= left && center <= right ? { left: own.left - origin.left, width: own.width } : undefined })
  }, [host, current])
  useLayoutEffect(measure, [measure, tick])
  // 본문이 바뀌거나 커서가 옮겨 가면, 창 크기가 바뀌면, 넘치는 표를 가로로 굴리면 다시 잰다.
  useEffect(() => {
    const again = () => setTick(value => value + 1)
    editor.on("transaction", again); window.addEventListener("resize", again)
    const frame = host.current, scrolled = (event: Event) => { if ((event.target as Element | null)?.classList?.contains("tableWrapper")) again() }
    frame?.addEventListener("scroll", scrolled, true)
    return () => { editor.off("transaction", again); window.removeEventListener("resize", again); frame?.removeEventListener("scroll", scrolled, true) }
  }, [editor, host])
  // 포인터가 표의 칸 위에 있으면 그 칸을, 도구 위에 있으면 그대로 두고, 벗어나면 잠시 뒤 놓는다(칸에서 손잡이로 건너갈 틈).
  useEffect(() => {
    const frame = host.current
    if (!frame) return
    const later = () => { window.clearTimeout(leave.current); leave.current = window.setTimeout(() => setHover(null), 220) }
    const moved = (event: MouseEvent) => {
      const target = event.target as Element | null
      if (target?.closest("[data-table-controls]")) { window.clearTimeout(leave.current); return }
      const cell = cellOf(target)
      if (cell && editor.view.dom.contains(cell)) { window.clearTimeout(leave.current); setHover(cell) } else later()
    }
    frame.addEventListener("mousemove", moved); frame.addEventListener("mouseleave", later)
    return () => { window.clearTimeout(leave.current); frame.removeEventListener("mousemove", moved); frame.removeEventListener("mouseleave", later) }
  }, [editor, host])
  const close = useCallback(() => { frozen.current = null; setMenu(null) }, [])

  if (!box) return null
  /** 커서를 그 칸 안에 둔다(표 명령은 커서가 있는 칸을 기준으로 움직인다). */
  const into = (cell: HTMLTableCellElement | null) => {
    if (!cell?.isConnected) return false
    const pos = editor.view.posAtDOM(cell, 0), { doc, tr } = editor.state
    editor.view.dispatch(tr.setSelection(TextSelection.near(doc.resolve(Math.min(pos + 1, doc.content.size)))))
    return true
  }
  /** 손잡이가 가리키는 칸에 커서를 두고 명령을 한 번의 실행 취소 단위로 돌린다. 표 메뉴는 고른 칸(셀 병합)을 지킨다. */
  const act = (fn: () => unknown, keepsSelection: boolean) => () => {
    const cell = frozen.current ?? current()
    close(); setHover(null)
    atomic(() => { if (!keepsSelection || caretCell()?.closest("table") !== cell?.closest("table")) into(cell); fn() })
    editor.commands.focus()
  }
  const chain = () => editor.chain().focus()
  const shift = (axis: "row" | "col", by: number) => () => {
    const rect = selectedRect(editor.state), from = axis === "row" ? rect.top : rect.left, size = axis === "row" ? rect.map.height : rect.map.width, to = from + by
    if (to < 0 || to >= size) return
    ;(axis === "row" ? moveTableRow : moveTableColumn)({ from, to })(editor.state, editor.view.dispatch)
  }
  /** 끝에 행 · 열을 더한다: 마지막 칸에 커서를 두고 그 뒤에 더한다. */
  const extend = (axis: "row" | "col") => () => {
    const cells = current()?.closest("table")?.querySelectorAll<HTMLTableCellElement>("td,th"), last = cells?.[cells.length - 1] ?? null
    setHover(null)
    atomic(() => { if (into(last)) (axis === "row" ? chain().addRowAfter() : chain().addColumnAfter()).run() })
  }
  const item = (label: string, icon: ReactNode, run: () => unknown, kind: Kind, options: { isEnabled?: boolean; isDanger?: boolean } = {}): MenuEntry =>
    ({ kind: "item", label, icon, isDisabled: options.isEnabled === false, isDanger: options.isDanger, onSelect: act(run, kind === "table") })
  const entries: Record<Kind, () => MenuEntry[]> = {
    row: () => [item("위에 행 추가", <ArrowUpIcon />, () => chain().addRowBefore().run(), "row"), item("아래에 행 추가", <ArrowDownIcon />, () => chain().addRowAfter().run(), "row"),
      item("위로 옮기기", <ArrowUpIcon />, shift("row", -1), "row"), item("아래로 옮기기", <ArrowDownIcon />, shift("row", 1), "row"),
      item("머리글 행 켜기 · 끄기", <TableIcon />, () => chain().toggleHeaderRow().run(), "row"), { kind: "separator" },
      item("행 삭제", <Trash2Icon />, () => chain().deleteRow().run(), "row", { isDanger: true })],
    col: () => [item("왼쪽에 열 추가", <ArrowLeftIcon />, () => chain().addColumnBefore().run(), "col"), item("오른쪽에 열 추가", <ArrowRightIcon />, () => chain().addColumnAfter().run(), "col"),
      item("왼쪽으로 옮기기", <ArrowLeftIcon />, shift("col", -1), "col"), item("오른쪽으로 옮기기", <ArrowRightIcon />, shift("col", 1), "col"),
      item("머리글 열 켜기 · 끄기", <TableIcon />, () => chain().toggleHeaderColumn().run(), "col"), { kind: "separator" },
      item("열 삭제", <Trash2Icon />, () => chain().deleteColumn().run(), "col", { isDanger: true })],
    table: () => [item("셀 병합", <PlusIcon />, () => chain().mergeCells().run(), "table", { isEnabled: editor.can().mergeCells() }),
      item("셀 나누기", <TableIcon />, () => chain().splitCell().run(), "table", { isEnabled: editor.can().splitCell() }),
      item("머리글 행 켜기 · 끄기", <TableIcon />, () => chain().toggleHeaderRow().run(), "table"), item("머리글 열 켜기 · 끄기", <TableIcon />, () => chain().toggleHeaderColumn().run(), "table"),
      { kind: "separator" }, item("표 삭제", <Trash2Icon />, () => chain().deleteTable().run(), "table", { isDanger: true })],
  }
  const handle = (kind: Kind, place: CSSProperties, drawing: ReactNode, size: string) => (
    <EditorMenu key={kind} label={LABEL[kind]} open={menu === kind} side={kind === "col" ? "bottom" : "right"} className="w-52"
      onOpenChange={next => { if (next) { frozen.current = current(); setMenu(kind) } else close() }} entries={menu === kind ? entries[kind]() : []}
      trigger={<Tip label={LABEL[kind]}>
        {/* check-ui: allow-style 손잡이 자리는 표를 재서 정한다. */}
        <button type="button" aria-label={LABEL[kind]} className={cn(HANDLE, size)} style={place} onMouseDown={keepSelection}>{drawing}</button>
      </Tip>} />
  )
  return (
    <div data-table-controls="" aria-label="표 편집" className="pointer-events-none absolute inset-0 z-12 *:pointer-events-auto">
      {handle("table", { left: box.left - 9, top: box.top - 9 }, <MoreHorizontalIcon />, "size-4.5 rounded-full")}
      {box.row ? handle("row", { left: box.left - 8, top: box.row.top + box.row.height / 2 - 11 }, <GripIcon />, "h-5.5 w-4") : null}
      {box.col ? handle("col", { left: box.col.left + box.col.width / 2 - 11, top: box.top - 8 }, <MoreHorizontalIcon />, "h-4 w-5.5") : null}
      <Tip label="끝에 열 추가">
        {/* check-ui: allow-style 막대 자리와 길이는 표를 재서 정한다. */}
        <button type="button" aria-label="끝에 열 추가" className={cn(ADD, "w-3.5")} style={{ left: box.left + box.width + 4, top: box.top, height: box.height }}
          onMouseDown={keepSelection} onClick={extend("col")}><PlusIcon /></button>
      </Tip>
      <Tip label="끝에 행 추가">
        {/* check-ui: allow-style 막대 자리와 길이는 표를 재서 정한다. */}
        <button type="button" aria-label="끝에 행 추가" className={cn(ADD, "h-3.5")} style={{ left: box.left, top: box.top + box.height + 4, width: box.width }}
          onMouseDown={keepSelection} onClick={extend("row")}><PlusIcon /></button>
      </Tip>
    </div>
  )
}
