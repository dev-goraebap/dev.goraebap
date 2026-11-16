import type { Editor } from "@tiptap/react"
import { useState } from "react"
import { Button } from "@/shared/ui/button"
import { FileTextIcon, Link2Icon, SquareArrowOutUpRightIcon, Trash2Icon } from "@/shared/ui/icon"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/shared/ui/input-group"
import type { LinkChoice } from "./types"

/** 주소로 쓸 수 있게 다듬는다: 앱 안의 주소(/…)와 https · http · mailto는 그대로, 점이 든 낱말(example.com)은 https://를 붙인다. 그 밖은 빈 글. */
export function hrefOf(text: string): string {
  const value = text.trim()
  if (/^(https?:\/\/|mailto:)/i.test(value) || /^\/(?!\/)/.test(value)) return value
  return /^[^\s/]+\.[^\s]{2,}$/.test(value) ? `https://${value}` : ""
}

const ROW = "h-auto min-h-8 w-full justify-start gap-2.5 rounded-md px-2.5 py-1.5 font-normal [&_svg]:text-icon-muted max-md:min-h-12"

/**
 * 링크 입력 칸: 주소를 붙여 넣거나, 문서 이름을 쳐서 호스트가 넘긴 문서(links)를 골라 건다. Enter는 주소면 그 주소로,
 * 아니면 맨 위 문서로 건다. 이미 링크가 걸린 글이면 열기와 지우기가 함께 보인다. 판(EditorPopover) 안에 둔다.
 */
export function LinkPanel({ editor, links, onDone }: { editor: Editor; links?: LinkChoice[]; onDone: () => void }) {
  const current = String(editor.getAttributes("link").href ?? "")
  const [text, setText] = useState(current)
  const href = hrefOf(text), word = text.trim().toLowerCase()
  const found = !href && word && links ? links.filter(link => link.title.toLowerCase().includes(word)).slice(0, 7) : !text.trim() && links ? links.slice(0, 5) : []
  const apply = (target: string) => { editor.chain().focus().extendMarkRange("link").setLink({ href: target }).run(); onDone() }
  const submit = () => { if (href) apply(href); else if (found[0]) apply(found[0].href) }
  return (
    <>
      <div className="flex items-center gap-1">
        <InputGroup className="h-9 border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0 max-md:h-11">
          <InputGroupAddon><Link2Icon /></InputGroupAddon>
          <InputGroupInput aria-label="링크 주소 또는 문서 이름" autoFocus value={text}
            placeholder={links ? "주소를 붙여 넣거나 문서 이름으로 찾기" : "주소를 붙여 넣기 (https://…)"}
            onChange={event => setText(event.target.value)}
            onKeyDown={event => { if (event.key === "Enter" && !event.nativeEvent.isComposing) { event.preventDefault(); event.stopPropagation(); submit() } }} />
        </InputGroup>
        {current ? <>
          <Button variant="ghost" size="icon-sm" aria-label="링크 열기" title="링크 열기" className="max-md:size-11"
            render={<a href={current} target="_blank" rel="noopener noreferrer" />} nativeButton={false}><SquareArrowOutUpRightIcon /></Button>
          <Button variant="ghost" size="icon-sm" aria-label="링크 지우기" title="링크 지우기" className="max-md:size-11"
            onClick={() => { editor.chain().focus().extendMarkRange("link").unsetLink().run(); onDone() }}><Trash2Icon /></Button>
        </> : null}
      </div>
      {href && href !== current ? (
        <Button variant="ghost" className={ROW} onClick={() => apply(href)}>
          <Link2Icon /><span className="min-w-0 flex-1 truncate text-left">{href} 로 연결</span><span className="text-xs text-muted-foreground">Enter</span>
        </Button>
      ) : null}
      {found.length > 0 ? <>
        <div className="px-2.5 pt-2 pb-1 text-xs font-semibold text-muted-foreground">문서</div>
        {found.map(link => (
          <Button key={link.href} variant="ghost" className={ROW} onClick={() => apply(link.href)}>
            <FileTextIcon /><span className="min-w-0 flex-1 truncate text-left">{link.title}</span>
            {link.hint ? <span className="max-w-32 truncate text-xs text-muted-foreground">{link.hint}</span> : null}
          </Button>
        ))}
      </> : null}
      {!href && word && !found.length
        ? <p className="px-2.5 py-2 text-xs text-muted-foreground">{links ? "찾은 문서가 없습니다. 주소는 https://로 시작해 주세요." : "https:// 또는 mailto:로 시작하는 주소를 넣어 주세요."}</p>
        : null}
    </>
  )
}
