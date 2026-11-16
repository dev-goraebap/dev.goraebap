import type { Editor } from "@tiptap/react"
import { useEffect, useState } from "react"
import { BoldIcon, ChevronDownIcon, CodeIcon, EraserIcon, ItalicIcon, Link2Icon, MoreHorizontalIcon, StrikethroughIcon, UnderlineIcon } from "@/shared/ui/icon"
import { ALIGN_LABELS, AlignGlyph, IndentGlyph, Script, Swatch, TEXT_BLOCKS, colorEntries, textBlockOf, turnInto, turnIntoEntries, type Align } from "./format"
import { LinkPanel } from "./LinkPanel"
import { EditorMenu, EditorPopover, keepSelection, MOD, type MenuEntry } from "./menu"
import { ToolButton, ToolDivider } from "./tool"
import type { LinkChoice } from "./types"

type Panel = "type" | "color" | "more" | "link"

/** 색을 입히거나 지운다. 빈 값은 기본(색 없음)이다. */
export const setInk = (editor: Editor, color: string) => color ? editor.chain().focus().setColor(color).run() : editor.chain().focus().unsetColor().run()
export const setFill = (editor: Editor, color: string) => color ? editor.chain().focus().setHighlight({ color }).run() : editor.chain().focus().unsetHighlight().run()

/**
 * 글을 고르면 그 위에 뜨는 서식 도구. 왼쪽부터 블록 종류, 굵게 · 기울임 · 밑줄 · 취소선 · 코드, 링크, 색, 더 보기다. 종류 · 색 ·
 * 더 보기(위 · 아래 첨자, 줄 정렬, 내어쓰기 · 들여쓰기, 서식 지우기)는 메뉴, 링크는 입력 판으로 펼친다(휴대폰은 바텀시트).
 * 좁은 화면에서 도구가 넘치면 띠 안에서 가로로 민다.
 */
export function SelectionMenu({ editor, links }: { editor: Editor; links?: LinkChoice[] }) {
  const [open, setOpen] = useState<Panel | null>(null)
  const isEmpty = editor.state.selection.empty
  // 선택이 풀려 도구가 사라지면 펼친 것도 접는다.
  useEffect(() => { if (isEmpty) setOpen(null) }, [isEmpty])
  const chain = () => editor.chain().focus()
  const toggle = (panel: Panel) => (next: boolean) => setOpen(next ? panel : null)
  const type = textBlockOf(editor), ink = String(editor.getAttributes("textStyle").color ?? ""), fill = String(editor.getAttributes("highlight").color ?? "")
  const align = (editor.getAttributes("paragraph").textAlign ?? editor.getAttributes("heading").textAlign ?? "left") as Align
  const listItem = editor.isActive("taskItem") ? "taskItem" : "listItem"
  const mark = (label: string, name: string, run: () => unknown, Icon: typeof BoldIcon, shortcut?: string) =>
    <ToolButton label={label} tip={shortcut ? `${label} (${shortcut})` : label} aria-pressed={editor.isActive(name)} onMouseDown={keepSelection} onClick={() => run()}><Icon /></ToolButton>
  const more: MenuEntry[] = [
    { kind: "item", label: "위 첨자", icon: <Script isUp />, isChecked: editor.isActive("superscript"), onSelect: () => chain().toggleSuperscript().run() },
    { kind: "item", label: "아래 첨자", icon: <Script isUp={false} />, isChecked: editor.isActive("subscript"), onSelect: () => chain().toggleSubscript().run() },
    { kind: "separator" },
    ...(["left", "center", "right", "justify"] as const).map(kind => ({ kind: "item" as const, label: ALIGN_LABELS[kind], icon: <AlignGlyph kind={kind} />, isChecked: align === kind,
      onSelect: () => chain().setTextAlign(kind).run() })),
    { kind: "separator" },
    { kind: "item", label: "내어쓰기", icon: <IndentGlyph isOut />, hint: "Shift+Tab", isDisabled: !editor.can().liftListItem(listItem), onSelect: () => chain().liftListItem(listItem).run() },
    { kind: "item", label: "들여쓰기", icon: <IndentGlyph />, hint: "Tab", isDisabled: !editor.can().sinkListItem(listItem), onSelect: () => chain().sinkListItem(listItem).run() },
    { kind: "separator" },
    { kind: "item", label: "서식 지우기", icon: <EraserIcon />, onSelect: () => chain().unsetAllMarks().run() },
  ]
  return (
    <div role="toolbar" aria-label="선택 텍스트 서식"
      className="flex items-center gap-0.5 rounded-xl border border-input bg-popover p-1 text-popover-foreground shadow-md max-md:max-w-[calc(100vw-1.25rem)] max-md:overflow-x-auto">
      <EditorMenu label="블록 종류" open={open === "type"} onOpenChange={toggle("type")}
        entries={turnIntoEntries(type, id => turnInto(editor, id))}
        trigger={<ToolButton label="블록 종류" tip="블록 종류" isWide onMouseDown={keepSelection}>
          {TEXT_BLOCKS.find(block => block.id === type)?.label ?? "텍스트"}<ChevronDownIcon />
        </ToolButton>} />
      <ToolDivider />
      {mark("굵게", "bold", () => chain().toggleBold().run(), BoldIcon, `${MOD}+B`)}
      {mark("기울임", "italic", () => chain().toggleItalic().run(), ItalicIcon, `${MOD}+I`)}
      {mark("밑줄", "underline", () => chain().toggleUnderline().run(), UnderlineIcon, `${MOD}+U`)}
      {mark("취소선", "strike", () => chain().toggleStrike().run(), StrikethroughIcon)}
      {mark("인라인 코드", "code", () => chain().toggleCode().run(), CodeIcon)}
      <ToolDivider />
      <EditorPopover label="링크" open={open === "link"} onOpenChange={toggle("link")}
        trigger={<ToolButton label="링크" aria-pressed={editor.isActive("link")} onMouseDown={keepSelection}><Link2Icon /></ToolButton>}>
        <LinkPanel editor={editor} links={links} onDone={() => setOpen(null)} />
      </EditorPopover>
      <EditorMenu label="색" open={open === "color"} onOpenChange={toggle("color")} align="end"
        entries={colorEntries(ink, fill, color => setInk(editor, color), color => setFill(editor, color))}
        trigger={<ToolButton label="색" isWide onMouseDown={keepSelection}><Swatch ink={ink || undefined} fill={fill || undefined} isFramed /><ChevronDownIcon /></ToolButton>} />
      <ToolDivider />
      <EditorMenu label="더 많은 서식" open={open === "more"} onOpenChange={toggle("more")} align="end" entries={more}
        trigger={<ToolButton label="더 보기" onMouseDown={keepSelection}><MoreHorizontalIcon className="rotate-90" /></ToolButton>} />
    </div>
  )
}
