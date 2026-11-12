import { TextSelection } from "@tiptap/pm/state"
import type { Editor } from "@tiptap/react"
import { ArrowDownIcon, ArrowUpIcon, ClipboardIcon, CopyIcon, EraserIcon, Link2Icon, PaletteIcon, ReplaceIcon, Trash2Icon } from "@/shared/ui/icon"
import { colorEntries, TEXT_BLOCKS, turnInto, turnIntoEntries, type TextBlockId } from "./format"
import { MOD, type MenuEntry } from "./menu"

const TYPE_LABELS: Record<string, string> = { paragraph: "텍스트", bulletList: "글머리 목록", orderedList: "번호 목록", taskList: "할 일 목록", blockquote: "인용",
  codeBlock: "코드", table: "표", media: "파일", mermaidBlock: "다이어그램", horizontalRule: "구분선", webEmbed: "링크 카드" }
/** 색을 입히거나 종류를 바꿀 수 있는 글 블록. 코드는 색을 입히지 않는다. */
const TEXTUAL = ["paragraph", "heading", "bulletList", "orderedList", "taskList", "blockquote", "codeBlock"]

export type MenuBlock = { id: string; pos: number; size: number; type: string }

/** 그 블록의 주소: 지금 화면 주소에 블록 표시(#block-…)를 붙인다. 그 주소로 열면 그 블록으로 옮겨 간다(RichEditor). */
export const blockLink = (id: string) => `${window.location.origin}${window.location.pathname}${window.location.search}#block-${id}`

/** 블록을 클립보드에 담는다: 붙여 넣을 때 서식이 살도록 HTML과 글을 함께. */
export async function copyBlocks(editor: Editor, ranges: { pos: number; size: number }[]) {
  if (!ranges.length) return
  const from = Math.min(...ranges.map(range => range.pos)), to = Math.max(...ranges.map(range => range.pos + range.size))
  const { dom, text } = editor.view.serializeForClipboard(editor.state.doc.slice(from, to))
  try {
    await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([dom.innerHTML], { type: "text/html" }), "text/plain": new Blob([text], { type: "text/plain" }) })])
  } catch { await navigator.clipboard.writeText(text).catch(() => undefined) }
}

/**
 * 블록 손잡이를 누르면 뜨는 메뉴의 항목. 위에는 블록의 종류, 그 아래로 색(글자색 · 배경색)과 종류 바꾸기(하위 메뉴), 서식 지우기,
 * 복제 · 복사 · 링크 복사, 위 · 아래로 옮기기, 삭제가 묶음별로 놓인다. 단축키는 블록을 고른 채, 또는 손잡이에 초점을 둔 채 누르면 동작한다(RichEditor의 blockShortcut).
 */
export function blockMenuEntries({ editor, block, atomic, onStep }: {
  editor: Editor; block: MenuBlock; atomic: (fn: () => unknown) => void; onStep: (direction: number) => void
}): MenuEntry[] {
  const node = editor.state.doc.nodeAt(block.pos)
  const isTextual = TEXTUAL.includes(block.type), canColor = isTextual && block.type !== "codeBlock"
  const title = block.type === "heading" ? `제목 ${node?.attrs.level ?? ""}` : TYPE_LABELS[block.type] ?? "블록"
  // 지금 입혀진 색: 블록의 첫 글자에 있는 것으로 본다.
  let ink = "", fill = ""
  node?.descendants(child => {
    if (!child.isText) return true
    for (const mark of child.marks) { if (mark.type.name === "textStyle") ink = mark.attrs.color ?? ""; if (mark.type.name === "highlight") fill = mark.attrs.color ?? "" }
    return false
  })
  const current: TextBlockId | undefined = block.type === "heading" ? `heading${node?.attrs.level}` as TextBlockId : TEXT_BLOCKS.find(each => each.id === block.type)?.id
  /** 블록의 글 전체를 고른 채 명령을 돌리고, 커서를 블록 끝에 둔다(서식 도구가 따라 뜨지 않게). 한 번의 실행 취소 단위다. */
  const onBlock = (fn: () => unknown) => () => atomic(() => {
    const { doc, tr } = editor.state
    const from = TextSelection.near(doc.resolve(block.pos + 1), 1).from, to = TextSelection.near(doc.resolve(block.pos + block.size - 1), -1).to
    editor.view.dispatch(tr.setSelection(TextSelection.create(doc, from, Math.max(from, to))))
    fn()
    const after = editor.state
    editor.view.dispatch(after.tr.setSelection(TextSelection.near(after.doc.resolve(after.selection.to), -1)))
  })
  const chain = () => editor.chain().focus()
  const duplicate = () => { if (node) atomic(() => chain().insertContentAt(block.pos + block.size, node.toJSON()).run()) }
  const remove = () => atomic(() => chain().deleteRange({ from: block.pos, to: block.pos + block.size }).run())
  return [
    { kind: "title", label: title },
    { kind: "sub", label: "색", icon: <PaletteIcon />, isDisabled: !canColor, entries: colorEntries(ink, fill,
      color => onBlock(() => color ? chain().setColor(color).run() : chain().unsetColor().run())(),
      color => onBlock(() => color ? chain().setHighlight({ color }).run() : chain().unsetHighlight().run())()) },
    { kind: "sub", label: "종류 바꾸기", icon: <ReplaceIcon />, isDisabled: !isTextual, entries: turnIntoEntries(current, id => onBlock(() => turnInto(editor, id))()) },
    { kind: "item", label: "서식 지우기", icon: <EraserIcon />, isDisabled: !canColor, onSelect: onBlock(() => chain().unsetAllMarks().run()) },
    { kind: "separator" },
    { kind: "item", label: "복제", icon: <CopyIcon />, hint: `${MOD} D`, onSelect: duplicate },
    { kind: "item", label: "복사", icon: <ClipboardIcon />, hint: `${MOD} C`, onSelect: () => void copyBlocks(editor, [block]) },
    { kind: "item", label: "링크 복사", icon: <Link2Icon />, onSelect: () => void navigator.clipboard.writeText(blockLink(block.id)).catch(() => undefined) },
    { kind: "separator" },
    { kind: "item", label: "위로 옮기기", icon: <ArrowUpIcon />, hint: "Alt ↑", onSelect: () => onStep(-1) },
    { kind: "item", label: "아래로 옮기기", icon: <ArrowDownIcon />, hint: "Alt ↓", onSelect: () => onStep(1) },
    { kind: "separator" },
    { kind: "item", label: "삭제", icon: <Trash2Icon />, hint: "Del", isDanger: true, onSelect: remove },
  ]
}
