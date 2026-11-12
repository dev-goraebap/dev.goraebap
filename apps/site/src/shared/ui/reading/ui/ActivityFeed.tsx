import { useId, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react"
import { cn } from "cn"
import { ActionMenu, type MenuAction } from "@/shared/ui/action-menu"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { PersonAvatar } from "@/shared/ui/person-avatar"
import { ArrowUpIcon, PencilIcon, Trash2Icon, type Icon } from "@/shared/ui/icon"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "@/shared/ui/input-group"

/**
 * 활동의 한 칸: 일어난 일(누가 한 뒤의 한 문장과 그 종류의 아이콘) 또는 댓글. 댓글은 답글(parentId: 그 댓글의 카드 안에 선다),
 * 본문에서 고른 인용(quote), 고친 때(editedAt)를 가질 수 있다. actorId는 내 댓글(고치기 · 지우기)을 가릴 때 쓴다.
 */
export type ActivityItem = { id: string; at: string; actorName: string; actorId?: string } & (
  | { kind: "event"; text: string; icon: Icon }
  | { kind: "comment"; body: string; parentId?: string; quote?: string; editedAt?: string }
)
type Comment = Extract<ActivityItem, { kind: "comment" }>

const when = new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit" })

function Time({ at, isEdited }: { at: string; isEdited?: boolean }) {
  const date = new Date(at)
  return (
    <time dateTime={at} title={date.toLocaleString("ko-KR")} className="text-xs whitespace-nowrap text-muted-foreground">
      {when.format(date)}{isEdited && " · 고침"}
    </time>
  )
}

/** 행위자 그림(20px): 이름 첫 글자(기본 그림은 제품이 PersonAvatar의 picture로 정한다). */
function ActorAvatar({ name }: { name: string }) {
  return <PersonAvatar name={name} />
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

/** 댓글 하나를 다루는 권한과 동작. 없으면 읽기만 한다. */
type CommentTools = {
  canEdit: (item: Comment) => boolean
  canDelete: (item: Comment) => boolean
  onEdit?: (id: string, body: string) => Promise<unknown>
  onAskDelete: (item: Comment) => void
  onQuote?: (quote: string) => void
}

/** 인용: 댓글이 가리키는 본문 한 토막. onQuote가 있으면 누르면 본문의 그 자리로 간다. */
export function Quote({ text, onQuote }: { text: string; onQuote?: (quote: string) => void }) {
  const className = "mr-4 ml-10 border-l-2 pl-3 text-left text-sm text-muted-foreground wrap-anywhere"
  return onQuote
    ? <button type="button" title="본문에서 보기" onClick={() => onQuote(text)} className={cn(className, "rounded-r-md hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring outline-none")}>{text}</button>
    : <blockquote className={className}>{text}</blockquote>
}

/** 카드 안의 댓글 한 벌(본 댓글 · 답글): 아바타 · 이름 · 때 · …, 인용, 글(고치는 동안은 입력 칸). */
function CommentBody({ item, tools, isReply = false }: { item: Comment; tools: CommentTools; isReply?: boolean }) {
  const [isEditing, setEditing] = useState(false)
  const actions: MenuAction[] = [
    ...(tools.onEdit && tools.canEdit(item) ? [{ label: "고치기", icon: PencilIcon, onSelect: () => setEditing(true) }] : []),
    ...(tools.canDelete(item) ? [{ label: "삭제", icon: Trash2Icon, onSelect: () => tools.onAskDelete(item) }] : []),
  ]
  return (
    <div aria-label={isReply ? `${item.actorName}의 답글` : undefined} className={cn("flex flex-col", isReply && "border-t")}>
      <header className="flex min-h-10 items-center gap-2 pt-2 pr-2 pl-3 text-sm">
        <ActorAvatar name={item.actorName} />
        <span className="font-medium">{item.actorName}</span>
        <Time at={item.at} isEdited={Boolean(item.editedAt)} />
        {actions.length > 0 && !isEditing && <span className="ml-auto"><ActionMenu label="댓글 메뉴" actions={actions} size="row" /></span>}
      </header>
      {item.quote && <Quote text={item.quote} onQuote={tools.onQuote} />}
      {isEditing && tools.onEdit ? (
        <div className="px-3 pt-1 pb-3">
          <CommentComposer initial={item.body} label="댓글 고치기" onCancel={() => setEditing(false)}
            onSend={body => tools.onEdit!(item.id, body).then(() => setEditing(false))} />
        </div>
      ) : (
        <p className="pt-1 pr-4 pb-4 pl-10 text-[0.875rem]/normal whitespace-pre-wrap wrap-anywhere max-md:text-base">{item.body}</p>
      )}
    </div>
  )
}

/** 답글 남기기: 처음에는 한 줄 단추, 누르면 입력 칸. 보내거나 취소하면 접는다. */
function ReplyBox({ onSend }: { onSend: (body: string) => Promise<unknown> }) {
  const [isOpen, setOpen] = useState(false)
  return (
    <div className="border-t px-3 py-2">
      {isOpen
        ? <CommentComposer label="답글" placeholder="답글을 남겨 주세요" onCancel={() => setOpen(false)} onSend={body => onSend(body).then(() => setOpen(false))} />
        : (
          <button type="button" onClick={() => setOpen(true)}
            className="h-8 w-full rounded-md px-2 text-left text-sm text-muted-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring max-md:h-11">
            답글 남기기…
          </button>
        )}
    </div>
  )
}

/** 댓글: 선을 덮는 카드(테두리 · 12px 초타원). 답글은 같은 카드 안에 선으로 나눠 잇고, 끝에 답글 남기기. */
function CommentCard({ item, replies, tools, onReply }: { item: Comment; replies: Comment[]; tools: CommentTools; onReply?: (body: string) => Promise<unknown> }) {
  return (
    <li className={cn(RAIL, "py-2 before:h-2 after:top-2")}>
      <article aria-label={`${item.actorName}의 댓글`} className="relative z-1 squircle rounded-xl border bg-card">
        <CommentBody item={item} tools={tools} />
        {replies.map(reply => <CommentBody key={reply.id} item={reply} tools={tools} isReply />)}
        {onReply && <ReplyBox onSend={onReply} />}
      </article>
    </li>
  )
}

/**
 * 댓글 입력(호호코워크 ChatComposer): 둥근 칸 안의 글 칸과 동그란 보내기. Enter는 보내기, Shift+Enter는 줄바꿈.
 * 보내는 동안 글은 남아 있다가 저장되면 비운다. onCancel이 있으면(고치기 · 답글) 취소 단추와 Esc로 접는다.
 */
export function CommentComposer({ label = "댓글", placeholder = "의견을 남겨 주세요", initial = "", onSend, onCancel }: {
  label?: string; placeholder?: string; initial?: string; onSend: (body: string) => Promise<unknown>; onCancel?: () => void
}) {
  const [text, setText] = useState(initial)
  const [isBusy, setBusy] = useState(false)
  const body = text.trim()
  const send = (event?: FormEvent) => {
    event?.preventDefault()
    if (!body || isBusy) return
    setBusy(true)
    onSend(body).then(() => { if (!onCancel) setText("") }, () => undefined).finally(() => setBusy(false))
  }
  const sendOnEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape" && onCancel) {
      event.preventDefault()
      onCancel()
      return
    }
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    send()
  }
  return (
    <form onSubmit={send}>
      <InputGroup className="squircle rounded-[0.875rem] bg-card">
        <InputGroupTextarea aria-label={label} placeholder={placeholder} rows={1} value={text} disabled={isBusy} autoFocus={Boolean(onCancel)}
          onChange={event => setText(event.target.value)} onKeyDown={sendOnEnter} className="max-h-60 min-h-10 py-2.5" />
        <InputGroupAddon align="inline-end" className="gap-1 self-end">
          {onCancel && <InputGroupButton size="xs" disabled={isBusy} onClick={onCancel}>취소</InputGroupButton>}
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
 * 답글은 그 댓글 카드 안에 서고(원 댓글이 지워졌으면 홀로 선다), onComment(body, parentId)로 남긴다.
 * meId의 댓글은 고치고(onEdit) 지울(onDelete) 수 있고, canModerate면 남의 댓글도 지운다. 지우기는 먼저 묻는다.
 */
export function ActivityFeed({ items, onComment, empty, meId, canModerate = false, onEdit, onDelete, onQuote }: {
  items: ActivityItem[]
  onComment?: (body: string, parentId?: string) => Promise<unknown>
  /** 기록이 없을 때 그 자리에 보일 것(읽는 중의 자리 등). */
  empty?: ReactNode
  meId?: string
  canModerate?: boolean
  onEdit?: (id: string, body: string) => Promise<unknown>
  onDelete?: (id: string) => Promise<unknown>
  /** 인용을 누르면 본문의 그 자리를 보인다. */
  onQuote?: (quote: string) => void
}) {
  const titleId = useId()
  const [deleting, setDeleting] = useState<Comment | null>(null)
  const [isBusy, setBusy] = useState(false)
  const isMine = (item: Comment) => Boolean(meId) && item.actorId === meId
  const tools: CommentTools = {
    canEdit: isMine,
    canDelete: item => Boolean(onDelete) && (isMine(item) || canModerate),
    onEdit,
    onAskDelete: setDeleting,
    onQuote,
  }
  const ids = new Set(items.map(item => item.id))
  const isReply = (item: ActivityItem) => item.kind === "comment" && Boolean(item.parentId) && ids.has(item.parentId!)
  const repliesOf = (id: string) => items.filter((item): item is Comment => item.kind === "comment" && item.parentId === id)
  const remove = () => {
    if (!deleting || !onDelete) return
    setBusy(true)
    onDelete(deleting.id).then(() => setDeleting(null), () => undefined).finally(() => setBusy(false))
  }
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3 pt-5">
      <h2 id={titleId} className="text-xs font-medium text-muted-foreground">활동</h2>
      {items.length > 0 ? (
        <ol aria-label="활동 기록" className="flex flex-col">
          {items.filter(item => !isReply(item)).map(item => item.kind === "comment"
            ? <CommentCard key={item.id} item={item} replies={repliesOf(item.id)} tools={tools} onReply={onComment && (body => onComment(body, item.id))} />
            : <EventLine key={item.id} item={item} />)}
        </ol>
      ) : empty}
      {onComment && <CommentComposer onSend={body => onComment(body)} />}
      {onDelete && (
        <ConfirmDialog open={Boolean(deleting)} onOpenChange={isOpen => { if (!isOpen) setDeleting(null) }}
          title="댓글을 지울까요?" description="지운 댓글은 활동에서 사라집니다."
          action={{ label: "삭제", onAction: remove, isPending: isBusy }} />
      )}
    </section>
  )
}
