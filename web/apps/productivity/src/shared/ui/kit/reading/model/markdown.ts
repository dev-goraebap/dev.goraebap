/** 본문 Markdown의 한 덩어리. 읽기 본문이 그리는 만큼만 다룬다(소제목 · 문단 · 목록 · 인용 · 코드 블록). */
export type MarkdownBlock =
  | { kind: "heading"; level: 2 | 3; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; isOrdered: boolean; items: string[] }
  | { kind: "quote"; text: string }
  | { kind: "code"; text: string }

const FENCE = /^```/
const HEADING = /^(#{1,3})\s+(.*)$/
const ITEM = /^\s*(?:[-*]|\d+\.)\s+/
const QUOTE = /^>\s?/
const startsBlock = (line: string) => FENCE.test(line) || HEADING.test(line) || ITEM.test(line) || QUOTE.test(line)

/** 빈 줄로 나뉜 Markdown을 덩어리로 읽는다. # · ## 는 2단계, ### 는 3단계 소제목이다. */
export function parseMarkdown(source: string): MarkdownBlock[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n")
  const blocks: MarkdownBlock[] = []
  let index = 0
  const takeWhile = (test: (line: string) => boolean) => {
    const taken: string[] = []
    while (index < lines.length && test(lines[index])) taken.push(lines[index++])
    return taken
  }
  while (index < lines.length) {
    const line = lines[index]
    if (!line.trim()) {
      index++
    } else if (FENCE.test(line)) {
      index++
      blocks.push({ kind: "code", text: takeWhile(each => !FENCE.test(each)).join("\n") })
      index++
    } else if (HEADING.test(line)) {
      const [, marks, text] = HEADING.exec(line)!
      blocks.push({ kind: "heading", level: marks.length === 3 ? 3 : 2, text })
      index++
    } else if (ITEM.test(line)) {
      const isOrdered = /^\s*\d+\./.test(line)
      blocks.push({ kind: "list", isOrdered, items: takeWhile(each => ITEM.test(each)).map(each => each.replace(ITEM, "")) })
    } else if (QUOTE.test(line)) {
      blocks.push({ kind: "quote", text: takeWhile(each => QUOTE.test(each)).map(each => each.replace(QUOTE, "")).join(" ") })
    } else {
      blocks.push({ kind: "paragraph", text: takeWhile(each => Boolean(each.trim()) && !startsBlock(each)).join(" ") })
    }
  }
  return blocks
}

/** 글 속 표시: `코드`와 **굵게**. 나머지는 글자 그대로다. */
export type InlinePart = { kind: "text" | "code" | "strong"; text: string }

export function parseInline(text: string): InlinePart[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/).filter(Boolean).map(part =>
    part.startsWith("`") ? { kind: "code", text: part.slice(1, -1) }
      : part.startsWith("**") ? { kind: "strong", text: part.slice(2, -2) }
        : { kind: "text", text: part })
}
