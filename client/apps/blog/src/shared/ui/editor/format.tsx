import type { Editor } from "@tiptap/react"
import { cn } from "cn"
import { COLORS } from "./colors"
import type { MenuEntry } from "./menu"
import type { HeadingLevel } from "./schema"

/**
 * 서식 도구(블록 메뉴 · 선택 서식 도구 · 상단 막대)가 함께 쓰는 것: 블록 종류와 바꾸기, 색 목록, 색 견본, Solar에 없는 그림
 * (줄 정렬 · 들여쓰기 · 위아래 첨자).
 */

/** 서로 바꿀 수 있는 글 블록의 종류. glyph는 메뉴에 보이는 짧은 표시다. */
export const TEXT_BLOCKS = [
  { id: "paragraph", label: "텍스트", glyph: "T" },
  { id: "heading2", label: "제목 2", glyph: "H2" }, { id: "heading3", label: "제목 3", glyph: "H3" }, { id: "heading4", label: "제목 4", glyph: "H4" },
  { id: "bulletList", label: "글머리 목록", glyph: "•" }, { id: "orderedList", label: "번호 목록", glyph: "1." }, { id: "taskList", label: "할 일 목록", glyph: "☑" },
  { id: "blockquote", label: "인용", glyph: "❞" }, { id: "codeBlock", label: "코드", glyph: "</>" },
] as const
export type TextBlockId = typeof TEXT_BLOCKS[number]["id"]

/** 커서가 있는 글 블록의 종류. 목록 · 인용 안의 문단은 그 목록 · 인용으로 본다. */
export function textBlockOf(editor: Editor): TextBlockId {
  if (editor.isActive("heading")) return `heading${editor.getAttributes("heading").level}` as TextBlockId
  for (const id of ["bulletList", "orderedList", "taskList", "blockquote", "codeBlock"] as const) if (editor.isActive(id)) return id
  return "paragraph"
}

/** 고른 글 블록을 다른 종류로 바꾼다. 먼저 목록 · 인용을 풀어 문단으로 만든 뒤(clearNodes) 새 종류를 입힌다. */
export function turnInto(editor: Editor, id: TextBlockId) {
  const chain = editor.chain().focus().clearNodes()
  if (id.startsWith("heading")) return chain.setHeading({ level: Number(id.slice(-1)) as HeadingLevel }).run()
  if (id === "bulletList") return chain.toggleBulletList().run()
  if (id === "orderedList") return chain.toggleOrderedList().run()
  if (id === "taskList") return chain.toggleTaskList().run()
  if (id === "blockquote") return chain.setBlockquote().run()
  if (id === "codeBlock") return chain.setCodeBlock().run()
  return chain.run()
}

const Glyph = ({ text }: { text: string }) => <span aria-hidden className="inline-grid w-4.5 shrink-0 place-items-center text-[0.6875rem] font-semibold tracking-tight">{text}</span>

/** 블록 종류 목록(메뉴 항목). */
export const turnIntoEntries = (current: TextBlockId | undefined, onSelect: (id: TextBlockId) => void): MenuEntry[] => [
  { kind: "title", label: "종류 바꾸기" },
  ...TEXT_BLOCKS.map(block => ({ kind: "item" as const, label: block.label, icon: <Glyph text={block.glyph} />, isChecked: current === block.id, onSelect: () => onSelect(block.id) })),
]

/** 글자색과 배경색 목록(메뉴 항목). 빈 값은 기본(색 없음). */
export const colorEntries = (text: string, background: string, onText: (color: string) => void, onBackground: (color: string) => void): MenuEntry[] => [
  { kind: "title", label: "글자색" },
  ...COLORS.map(color => ({ kind: "item" as const, label: `${color.name} 글자`, icon: <Swatch ink={color.ink} />, isChecked: text === color.ink, onSelect: () => onText(color.ink) })),
  { kind: "separator" },
  { kind: "title", label: "배경색" },
  ...COLORS.map(color => ({ kind: "item" as const, label: `${color.name} 배경`, icon: <Swatch fill={color.fill || "var(--card)"} isRound />, isChecked: background === color.fill,
    onSelect: () => onBackground(color.fill) })),
]

/** 색 견본: 글자색은 A 한 글자, 배경색은 둥근 칸. isFramed는 상단 막대 · 서식 도구의 색 단추처럼 동그라미 안에 A를 둔다. */
export function Swatch({ ink, fill, isRound = false, isFramed = false }: { ink?: string; fill?: string; isRound?: boolean; isFramed?: boolean }) {
  return (
    <span aria-hidden
      className={cn(isRound ? "inline-block size-4 shrink-0 rounded-full border border-input"
        : "inline-grid size-4.5 shrink-0 place-items-center text-sm leading-none font-semibold", isFramed && "size-5.5 rounded-full border border-input text-xs")}
      // check-ui: allow-style 견본마다 다른 색 값(본문에 남는 색 변수)이다.
      style={{ ...(ink ? { color: ink } : {}), ...(fill ? { background: fill } : {}) }}>
      {isRound ? "" : "A"}
    </span>
  )
}

export type Align = "left" | "center" | "right" | "justify"
export const ALIGN_LABELS: Record<Align, string> = { left: "왼쪽 정렬", center: "가운데 정렬", right: "오른쪽 정렬", justify: "양쪽 정렬" }

/** 줄 정렬 그림: 길이가 다른 가로줄 넷을 정렬 방향에 맞춰 놓는다(Solar에 글 정렬 아이콘이 없다). */
export function AlignGlyph({ kind }: { kind: Align }) {
  const widths = kind === "justify" ? [14, 14, 14, 14] : [14, 9, 12, 7]
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      {widths.map((width, row) => {
        const start = kind === "center" ? (16 - width) / 2 : kind === "right" ? 15 - width : 1
        return <path key={row} d={`M${start} ${3 + row * 3.3}h${width}`} />
      })}
    </svg>
  )
}

/** 들여쓰기 · 내어쓰기 그림: 줄 셋과 방향 화살표. */
export function IndentGlyph({ isOut = false }: { isOut?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3h8M7 8h8M7 13h8" /><path d={isOut ? "M4 5.5 1.5 8 4 10.5" : "M1.5 5.5 4 8 1.5 10.5"} />
    </svg>
  )
}

export const Script = ({ isUp }: { isUp: boolean }) => <span aria-hidden className="text-[0.8125rem] leading-none font-semibold">x{isUp ? <sup className="text-[0.5625rem]">2</sup> : <sub className="text-[0.5625rem]">2</sub>}</span>
