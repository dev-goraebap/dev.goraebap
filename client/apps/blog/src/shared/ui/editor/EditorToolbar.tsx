import { useEffect, useReducer, useState, type ReactNode } from "react"
import {
  BoldIcon, ChevronDownIcon, CodeIcon, EraserIcon, ItalicIcon, Link2Icon, ListChecksIcon, ListIcon, ListOrderedIcon, PlusIcon, Redo2Icon,
  StrikethroughIcon, UnderlineIcon, Undo2Icon,
} from "@/shared/ui/icon"
import { ALIGN_LABELS, AlignGlyph, Swatch, TEXT_BLOCKS, colorEntries, textBlockOf, turnInto, turnIntoEntries, type Align } from "./format"
import { LinkPanel } from "./LinkPanel"
import { EditorMenu, EditorPopover, keepSelection, MOD, type MenuEntry } from "./menu"
import type { EditorHandle } from "./RichEditor"
import { COMMAND_ICONS, COMMANDS, type CommandId } from "./schema"
import { setFill, setInk } from "./SelectionMenu"
import { ToolButton, ToolDivider } from "./tool"
import type { LinkChoice } from "./types"

type Panel = "type" | "color" | "link" | "align" | "insert"

/** 넣기 메뉴의 블록: `/` 명령(COMMANDS)과 같은 이름 · 아이콘을 쓴다. 글 블록 종류는 블록 종류 메뉴가 맡는다. */
const INSERT_IDS: CommandId[] = ["table", "file", "codeBlock", "mermaidBlock", "blockquote", "horizontalRule"]

/** 에디터가 바뀔 때마다(선택 · 입력) 다시 그려 눌림 상태를 맞춘다. */
function useEditorTick(handle: EditorHandle | null) {
  const [, tick] = useReducer((value: number) => value + 1, 0)
  useEffect(() => {
    const editor = handle?.editor
    if (!editor) return undefined
    editor.on("transaction", tick)
    return () => { editor.off("transaction", tick) }
  }, [handle?.editor])
}

/**
 * 상단 서식 막대. 문서 편집기처럼 본문 위에 늘 붙어 있는 도구 줄이며, 글을 고르지 않아도 지금 커서 자리의 서식이 보인다.
 * 왼쪽부터 (start), 되돌리기, 블록 종류, 글자 서식, 색 · 링크, 정렬, 목록, 넣기 메뉴(표 · 파일 · 코드 · 도표 · 인용 · 구분선), 서식 지우기.
 * 위 · 아래 첨자와 들여쓰기 · 내어쓰기는 글을 고르면 뜨는 서식 도구의 더 보기와 Tab · Shift+Tab에 있다(막대를 한 줄로 두려고 뺐다).
 * 넣기는 `/` 명령과 같은 방식이라 파일은 올리는 칸이 뜬다. 좁으면 줄을 바꾼다(가로로 밀면 메뉴를 여닫을 때 스크롤바가 생겼다
 * 사라지며 막대가 흔들린다). 휴대폰은 도구가 44px라 줄을 바꾸면 화면을 덮으므로 한 줄에서 가로로 민다(메뉴는 바텀시트라 흔들리지 않는다).
 * 오른쪽 끝(end)은 늘 첫 줄 끝에 있다. 핸들이 없으면(에디터 준비 전) 흐리게 그린다.
 */
export function EditorToolbar({ handle, links, start, end }: { handle: EditorHandle | null; links?: LinkChoice[]; start?: ReactNode; end?: ReactNode }) {
  useEditorTick(handle)
  const [open, setOpen] = useState<Panel | null>(null)
  const editor = handle?.editor ?? null
  const isReady = !!editor && editor.isEditable
  const chain = () => editor!.chain().focus()
  const active = (name: string) => !!editor?.isActive(name)
  const toggle = (panel: Panel) => (next: boolean) => setOpen(next ? panel : null)
  const tool = (label: string, drawing: ReactNode, run: () => unknown, options: { isActive?: boolean; isDisabled?: boolean; shortcut?: string } = {}) =>
    <ToolButton label={label} tip={options.shortcut ? `${label} (${options.shortcut})` : label} aria-pressed={options.isActive ?? undefined}
      disabled={!isReady || options.isDisabled} onMouseDown={keepSelection} onClick={() => run()}>{drawing}</ToolButton>
  const type = editor ? textBlockOf(editor) : "paragraph"
  const ink = String(editor?.getAttributes("textStyle").color ?? ""), fill = String(editor?.getAttributes("highlight").color ?? "")
  const align = (editor?.getAttributes("paragraph").textAlign ?? editor?.getAttributes("heading").textAlign ?? "left") as Align
  const inserts: MenuEntry[] = INSERT_IDS.map(id => {
    const Icon = COMMAND_ICONS[id]
    return { kind: "item", label: COMMANDS.find(command => command.id === id)!.label, icon: <Icon />, onSelect: () => handle?.insert(id) }
  })
  return (
    <div className="box-border flex min-h-11 w-full items-start gap-2 border-b bg-background px-3 py-1.5 max-md:items-center max-md:px-1">
      <div role="toolbar" aria-label="서식" className="flex min-h-8 min-w-0 flex-auto flex-wrap items-center gap-x-0.5 gap-y-1 max-md:flex-nowrap max-md:overflow-x-auto max-md:[scrollbar-width:none]">
        {start ? <>{start}<ToolDivider /></> : null}
        {tool("되돌리기", <Undo2Icon />, () => chain().undo().run(), { isDisabled: !editor?.can().undo(), shortcut: `${MOD}+Z` })}
        {tool("다시 하기", <Redo2Icon />, () => chain().redo().run(), { isDisabled: !editor?.can().redo(), shortcut: `${MOD}+Shift+Z` })}
        <ToolDivider />
        <EditorMenu label="블록 종류" open={open === "type"} onOpenChange={toggle("type")}
          entries={editor ? turnIntoEntries(type, id => turnInto(editor, id)) : []}
          trigger={<ToolButton label="블록 종류" isWide disabled={!isReady} className="min-w-22 justify-between">
            {TEXT_BLOCKS.find(block => block.id === type)?.label ?? "텍스트"}<ChevronDownIcon />
          </ToolButton>} />
        <ToolDivider />
        {tool("굵게", <BoldIcon />, () => chain().toggleBold().run(), { isActive: active("bold"), shortcut: `${MOD}+B` })}
        {tool("기울임", <ItalicIcon />, () => chain().toggleItalic().run(), { isActive: active("italic"), shortcut: `${MOD}+I` })}
        {tool("밑줄", <UnderlineIcon />, () => chain().toggleUnderline().run(), { isActive: active("underline"), shortcut: `${MOD}+U` })}
        {tool("취소선", <StrikethroughIcon />, () => chain().toggleStrike().run(), { isActive: active("strike") })}
        {tool("인라인 코드", <CodeIcon />, () => chain().toggleCode().run(), { isActive: active("code") })}
        <ToolDivider />
        <EditorMenu label="색" open={open === "color"} onOpenChange={toggle("color")}
          entries={editor ? colorEntries(ink, fill, color => setInk(editor, color), color => setFill(editor, color)) : []}
          trigger={<ToolButton label="색" isWide disabled={!isReady}><Swatch ink={ink || undefined} fill={fill || undefined} isFramed /><ChevronDownIcon /></ToolButton>} />
        <EditorPopover label="링크" open={open === "link" && !!editor} onOpenChange={toggle("link")}
          trigger={<ToolButton label="링크" tip={`링크 (${MOD}+K)`} aria-pressed={active("link")}
            disabled={!isReady || (editor?.state.selection.empty && !active("link"))}><Link2Icon /></ToolButton>}>
          {editor ? <LinkPanel editor={editor} links={links} onDone={() => setOpen(null)} /> : null}
        </EditorPopover>
        <ToolDivider />
        <EditorMenu label="정렬" open={open === "align"} onOpenChange={toggle("align")}
          entries={(["left", "center", "right", "justify"] as const).map(kind => ({ kind: "item", label: ALIGN_LABELS[kind], icon: <AlignGlyph kind={kind} />,
            isChecked: align === kind, onSelect: () => chain().setTextAlign(kind).run() }))}
          className="w-44"
          trigger={<ToolButton label="정렬" tip={ALIGN_LABELS[align]} isWide disabled={!isReady}><AlignGlyph kind={align} /><ChevronDownIcon /></ToolButton>} />
        {tool("글머리 기호 목록", <ListIcon />, () => chain().toggleBulletList().run(), { isActive: active("bulletList") })}
        {tool("번호 매기기 목록", <ListOrderedIcon />, () => chain().toggleOrderedList().run(), { isActive: active("orderedList") })}
        {tool("할 일 목록", <ListChecksIcon />, () => chain().toggleTaskList().run(), { isActive: active("taskList") })}
        <ToolDivider />
        <EditorMenu label="넣기" open={open === "insert"} onOpenChange={toggle("insert")} entries={inserts}
          trigger={<ToolButton label="넣기" tip="넣기 (표 · 이미지 · 코드 · 도표 · 인용 · 구분선)" isWide disabled={!isReady}><PlusIcon /><ChevronDownIcon /></ToolButton>} />
        <ToolDivider />
        {tool("서식 지우기", <EraserIcon />, () => chain().unsetAllMarks().run())}
      </div>
      {end ? (
        <div className="flex min-h-8 flex-none items-center gap-2 before:mr-2 before:ml-1 before:h-4.5 before:w-px before:flex-none before:bg-border">{end}</div>
      ) : null}
    </div>
  )
}
