import { useMemo } from "react"
import { parseInline, parseMarkdown, type MarkdownBlock } from "../model/markdown"

/** 글 속 코드는 바탕 없이 옅은 밑줄과 조금 옅은 고정폭 글자(호호코워크 읽기 본문). */
function Inline({ text }: { text: string }) {
  return parseInline(text).map((part, index) =>
    part.kind === "code" ? (
      <code key={index} className="font-mono text-[0.9em] text-foreground/80 underline decoration-foreground/40 decoration-1 underline-offset-[0.32em]">{part.text}</code>
    ) : part.kind === "strong" ? (
      <strong key={index} className="font-semibold">{part.text}</strong>
    ) : (
      part.text
    ))
}

function Block({ block }: { block: MarkdownBlock }) {
  switch (block.kind) {
    case "heading":
      return block.level === 2
        ? <h2 className="mt-4 text-[1.625rem] leading-[1.35] font-bold tracking-[-0.02em]"><Inline text={block.text} /></h2>
        : <h3 className="mt-2 text-xl leading-[1.4] font-semibold"><Inline text={block.text} /></h3>
    case "list": {
      const List = block.isOrdered ? "ol" : "ul"
      return (
        <List className={block.isOrdered ? "flex list-decimal flex-col gap-1 pl-6" : "flex list-disc flex-col gap-1 pl-6"}>
          {block.items.map((item, index) => <li key={index} className="pl-1"><Inline text={item} /></li>)}
        </List>
      )
    }
    case "quote":
      return <blockquote className="border-l-2 border-input pl-4 text-muted-foreground"><Inline text={block.text} /></blockquote>
    case "code":
      return (
        <pre className="overflow-x-auto rounded-lg border bg-muted px-4 py-3 font-mono text-[0.8125rem] leading-relaxed">
          <code>{block.text}</code>
        </pre>
      )
    case "paragraph":
      return <p><Inline text={block.text} /></p>
  }
}

/**
 * 읽기 본문(호호코워크 MarkdownBody): 16px · 줄 높이 1.7, 문단 사이 한 줄. 긴 낱말과 주소는 칸을 넓히지 않고 접는다.
 * 소제목 · 목록 · 인용 · 코드 블록과 글 속 코드 · 굵게만 그린다.
 */
export function MarkdownBody({ source }: { source: string }) {
  const blocks = useMemo(() => parseMarkdown(source), [source])
  return (
    <div className="flex min-w-0 flex-col gap-4 text-[1rem]/[1.7] wrap-anywhere">
      {blocks.map((block, index) => <Block key={index} block={block} />)}
    </div>
  )
}
