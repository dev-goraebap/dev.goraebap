import { useId, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react"
import { cn } from "@/shared/lib/utils"
import { PersonAvatar } from "@/shared/ui/person-avatar"
import { ArrowUpIcon, type Icon } from "@/shared/ui/icon"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "@/shared/ui/input-group"

/** 활동의 한 칸: 일어난 일(누가 한 뒤의 한 문장과 그 종류의 아이콘) 또는 댓글. */
export type ActivityItem = { id: string; at: string; actorName: string } & (
  | { kind: "event"; text: string; icon: Icon }
  | { kind: "comment"; body: string }
)

const when = new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit" })

function Time({ at }: { at: string }) {
  const date = new Date(at)
  return <time dateTime={at} title={date.toLocaleString("ko-KR")} className="text-xs whitespace-nowrap text-muted-foreground">{when.format(date)}</time>
}

/** 행위자 그림(20px): 호호코워크 기본 그림(이름으로 정한다). */
function ActorAvatar({ name }: { name: string }) {
  return <PersonAvatar id={name} name={name} />
}

/*
 * 세로선 하나(호호코워크 activity.module.css): 선은 댓글 카드 아바타의 가운데(카드 테두리 1px + 안쪽 12px + 아바타 반 10px = 23px)를 지난다.
 * 칸마다 자기 몫의 선을 위(::before) · 아래(::after) 두 토막으로 그려 표식 둘레를 비우고, 첫 칸 위와 끝 칸 아래는 그리지 않는다.
 */
const RAIL = "relative before:absolute before:top-0 before:left-[calc(1.4375rem-0.5px)] before:w-px before:bg-input after:absolute after:bottom-0 after:left-[calc(1.4375rem-0.5px)] after:w-px after:bg-input first:before:hidden last:after:hidden"

/** 변경: 선 위의 16px 아이콘, 아바타와 13px 한 문장(이름은 진한 글자), 때. */
function EventLine({ item }: { item: Extract<ActivityItem, { kind: "event" }> }) {
  return (
    <li className={cn(RAIL, "grid grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-x-3 py-1 pl-3.25 before:h-1 after:top-6")}>
      <span aria-hidden className="grid size-5 place-items-center text-icon-muted"><item.icon /></span>
      <p className="flex min-w-0 items-start gap-2 text-sm/5 text-muted-foreground max-md:leading-normal">
        <ActorAvatar name={item.actorName} />
        <span className="min-w-0 break-keep wrap-anywhere">
          <span className="font-medium text-foreground">{item.actorName}</span> {item.text} · <Time at={item.at} />
        </span>
      </p>
    </li>
  )
}

/** 댓글: 선을 덮는 카드(테두리 · 12px 초타원): 아바타 · 이름 · 때, 그 아래 이름 줄에 맞춰 들여 쓴 글. */
function CommentCard({ item }: { item: Extract<ActivityItem, { kind: "comment" }> }) {
  return (
    <li className={cn(RAIL, "py-2 before:h-2 after:top-2")}>
      <article aria-label={`${item.actorName}의 댓글`} className="relative z-1 squircle rounded-xl border bg-card">
        <header className="flex min-h-10 items-center gap-2 pt-2 pr-2 pl-3 text-sm">
          <ActorAvatar name={item.actorName} />
          <span className="font-medium">{item.actorName}</span>
          <Time at={item.at} />
        </header>
        <p className="pt-1 pr-4 pb-4 pl-10 text-[0.875rem]/normal whitespace-pre-wrap wrap-anywhere max-md:text-base">{item.body}</p>
      </article>
    </li>
  )
}

/**
 * 댓글 입력(호호코워크 ChatComposer): 둥근 칸 안의 글 칸과 동그란 보내기. Enter는 보내기, Shift+Enter는 줄바꿈.
 * 보내는 동안 글은 남아 있다가 저장되면 비운다.
 */
export function CommentComposer({ label = "댓글", placeholder = "의견을 남겨 주세요", onSend }: {
  label?: string; placeholder?: string; onSend: (body: string) => Promise<unknown>
}) {
  const [text, setText] = useState("")
  const [isBusy, setBusy] = useState(false)
  const body = text.trim()
  const send = (event?: FormEvent) => {
    event?.preventDefault()
    if (!body || isBusy) return
    setBusy(true)
    onSend(body).then(() => setText(""), () => undefined).finally(() => setBusy(false))
  }
  const sendOnEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    send()
  }
  return (
    <form onSubmit={send}>
      <InputGroup className="squircle rounded-[0.875rem] bg-card">
        <InputGroupTextarea aria-label={label} placeholder={placeholder} rows={1} value={text} disabled={isBusy}
          onChange={event => setText(event.target.value)} onKeyDown={sendOnEnter} className="max-h-60 min-h-10 py-2.5" />
        <InputGroupAddon align="inline-end" className="self-end">
          <InputGroupButton type="submit" variant="default" size="icon-sm" aria-label="보내기" disabled={!body || isBusy} className="rounded-full">
            <ArrowUpIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  )
}

/**
 * 활동(호호코워크 ActivityFeed): 변경 기록과 댓글을 오래된 것부터 세로선 하나에 잇고, 끝에 댓글 입력을 둔다.
 * 변경은 선 위의 아이콘과 한 문장, 댓글은 선을 덮는 카드다. onComment가 없으면 읽기만 한다.
 */
export function ActivityFeed({ items, onComment, empty }: {
  items: ActivityItem[]
  onComment?: (body: string) => Promise<unknown>
  /** 기록이 없을 때 그 자리에 보일 것(읽는 중의 자리 등). */
  empty?: ReactNode
}) {
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3 pt-5">
      <h2 id={titleId} className="text-xs font-medium text-muted-foreground">활동</h2>
      {items.length > 0 ? (
        <ol aria-label="활동 기록" className="flex flex-col">
          {items.map(item => item.kind === "comment" ? <CommentCard key={item.id} item={item} /> : <EventLine key={item.id} item={item} />)}
        </ol>
      ) : empty}
      {onComment && <CommentComposer onSend={onComment} />}
    </section>
  )
}
