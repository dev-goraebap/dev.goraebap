import { Link, useNavigate } from "@tanstack/react-router"
import { Fragment, useEffect, useRef, type ReactNode } from "react"
import {
  decisionLabel, kindLabel, useDecideApproval, useMarkNotification,
  type ApprovalDecision, type ApprovalNotification, type EventNotification, type MentionNotification, type NoticeNotification,
  type Notification,
} from "@/entities/notification"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import {
  ArrowLeftIcon, CalendarIcon, CheckIcon, ChevronLeftIcon, CircleCheckIcon, CircleXIcon, ClockIcon, CopyIcon, FileTextIcon,
  ListChecksIcon, MailIcon, MapPinIcon, MaximizeIcon, UserIcon, XIcon, type Icon,
} from "@/shared/ui/icon"
import { Skeleton } from "@/shared/ui/skeleton"
import { toast } from "@/shared/ui/toast"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"
import { pageHrefOf } from "../model/views"
import { ActionMenu, type MenuAction } from "@/shared/ui/action-menu"

/** 상세 머리 줄 왼쪽의 "무엇인지": 결재 · 공지 · 일정, 업무 멘션은 업무 키. */
const labelOf = (item: Notification) => (item.kind === "mention" ? item.key : kindLabel[item.kind])

/**
 * 데스크톱 알림함 오른쪽 칸의 고른 알림. 페이지 머리 줄과 같은 높이(52px) · 같은 가는 선의 줄에 ← 와 무엇인지,
 * 오른쪽에 메뉴와 "페이지로 열기". 내용은 그 아래에서 스크롤한다.
 */
export function NotificationPane({ item }: { item: Notification }) {
  useMarkReadOnOpen(item)
  return (
    <>
      <header className="flex h-13 shrink-0 items-center justify-between gap-2 border-b px-4">
        <div className="flex min-w-0 items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="고른 항목 닫기" nativeButton={false} render={<Link to="/notifications" search={true} />}>
            <ChevronLeftIcon />
          </Button>
          <span className="truncate text-xs text-muted-foreground">{labelOf(item)}</span>
        </div>
        <ItemTools item={item} />
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain"><NotificationColumn item={item} /></div>
    </>
  )
}

/** 휴대폰에서 고른 알림의 전체 화면: ← (목록으로) · 제목 · 메뉴 · "페이지로 열기"의 앱 바와 그 아래 내용. */
export function NotificationScreen({ item }: { item: Notification }) {
  useMarkReadOnOpen(item)
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-13 shrink-0 items-center gap-1 border-b px-2">
        <Button variant="ghost" size="icon" aria-label="알림함(으)로" nativeButton={false} render={<Link to="/notifications" search={true} />}>
          <ArrowLeftIcon />
        </Button>
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold">{item.kind === "mention" ? item.key : item.title}</h1>
        <ItemTools item={item} />
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain"><NotificationColumn item={item} /></div>
    </div>
  )
}

/** 상세 자리에서 알림을 읽는 동안의 자리. */
export function NotificationColumnSkeleton() {
  return (
    <div aria-busy="true" aria-label="알림을 읽는 중" className="mx-auto flex w-full max-w-[45rem] flex-col gap-3 px-4 py-10">
      <Skeleton className="h-8 w-3/5" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  )
}

/** 고른 알림을 읽음으로. 연 알림마다 한 번만 하므로 메뉴의 "읽지 않음으로 표시"를 되돌리지 않는다. */
function useMarkReadOnOpen(item: Notification) {
  const { mutate: mark } = useMarkNotification()
  const marked = useRef<string>(undefined)
  useEffect(() => {
    if (marked.current === item.id) return
    marked.current = item.id
    if (item.isUnread) mark({ id: item.id, isUnread: false })
  }, [item.id, item.isUnread, mark])
}

/** 상세 머리 줄 오른쪽: 이 알림의 메뉴와 가리키는 것의 단독 페이지로. */
function ItemTools({ item }: { item: Notification }) {
  const navigate = useNavigate()
  const { mutate: mark } = useMarkNotification()
  const actions: MenuAction[] = [
    {
      label: "읽지 않음으로 표시", icon: MailIcon,
      onSelect: () => {
        mark({ id: item.id, isUnread: true })
        void navigate({ to: "/notifications", search: true })
      },
    },
    {
      label: "링크 복사", icon: CopyIcon,
      onSelect: () => {
        void navigator.clipboard?.writeText(window.location.href)
        toast.add({ title: "링크를 복사했습니다" })
      },
    },
  ]
  return (
    <div className="flex shrink-0 items-center gap-1">
      <ActionMenu label="알림 메뉴" actions={actions} />
      <Tooltip>
        <TooltipTrigger render={
          <Button variant="ghost" size="icon" aria-label="페이지로 열기" nativeButton={false} render={<Link to={pageHrefOf[item.kind]} />}>
            <MaximizeIcon />
          </Button>
        } />
        <TooltipContent>페이지로 열기</TooltipContent>
      </Tooltip>
    </div>
  )
}

/** 설정 페이지의 열처럼 가운데 한 열(최대 720px): 제목과 한 줄 설명, 그 아래 종류별 내용(호호코워크 InboxColumn). */
function NotificationColumn({ item }: { item: Notification }) {
  return (
    <article className="mx-auto flex w-full max-w-[45rem] flex-col gap-8 px-4 py-10 text-sm">
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold">{item.kind === "mention" ? item.workTitle : item.title}</h2>
        <p className="text-muted-foreground">{descriptionOf(item)}</p>
      </header>
      <KindContent item={item} />
    </article>
  )
}

const descriptionOf = (item: Notification) =>
  item.kind === "notice" ? `${item.author} · ${item.postedAt}` : item.meta

function KindContent({ item }: { item: Notification }) {
  switch (item.kind) {
    case "approval": return <ApprovalContent item={item} />
    case "notice": return <NoticeContent item={item} />
    case "event": return <EventContent item={item} />
    case "mention": return <MentionContent item={item} />
  }
}

type Fact = { label: string; icon: Icon; value: ReactNode }

/** 이름과 값의 줄. */
function Facts({ facts }: { facts: Fact[] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-3">
      {facts.map(fact => (
        <Fragment key={fact.label}>
          <dt className="flex items-center gap-2 text-muted-foreground"><fact.icon className="shrink-0 text-icon-muted" />{fact.label}</dt>
          <dd className="min-w-0">{fact.value}</dd>
        </Fragment>
      ))}
    </dl>
  )
}

const decisionToast: Record<ApprovalDecision, string> = { approved: "승인했습니다", rejected: "반려했습니다" }

/** 결재 요청: 신청자 · 기간 · 사유와 승인 · 반려. 결재를 마치면 그 결과를 보인다. */
function ApprovalContent({ item }: { item: ApprovalNotification }) {
  const decide = useDecideApproval()
  const onDecide = (decision: ApprovalDecision) =>
    decide.mutate({ id: item.id, decision }, {
      onSuccess: () => toast.add({ type: "success", title: decisionToast[decision], description: item.title }),
    })
  return (
    <>
      <Facts facts={[
        { label: "신청자", icon: UserIcon, value: `${item.requester} · ${item.team}` },
        { label: "기간", icon: CalendarIcon, value: item.period },
        { label: "사유", icon: FileTextIcon, value: item.reason },
      ]} />
      {item.decision ? (
        <Badge variant="secondary">
          {item.decision === "approved" ? <CircleCheckIcon data-icon="inline-start" /> : <CircleXIcon data-icon="inline-start" />}
          {decisionLabel[item.decision]}
        </Badge>
      ) : (
        <div className="flex gap-2">
          <Button disabled={decide.isPending} onClick={() => onDecide("approved")}>
            <CheckIcon data-icon="inline-start" />승인
          </Button>
          <Button variant="outline" disabled={decide.isPending} onClick={() => onDecide("rejected")}>
            <XIcon data-icon="inline-start" />반려
          </Button>
        </div>
      )}
    </>
  )
}

/** 공지: 본문. */
function NoticeContent({ item }: { item: NoticeNotification }) {
  return (
    <div className="flex flex-col gap-3 leading-relaxed">
      {item.body.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
    </div>
  )
}

/** 일정: 날짜 · 시간 · 장소. */
function EventContent({ item }: { item: EventNotification }) {
  return (
    <Facts facts={[
      { label: "날짜", icon: CalendarIcon, value: item.date },
      { label: "시간", icon: ClockIcon, value: item.hours },
      { label: "장소", icon: MapPinIcon, value: item.place },
    ]} />
  )
}

/** 업무 멘션: 업무 키와 제목, 나를 언급한 댓글. */
function MentionContent({ item }: { item: MentionNotification }) {
  return (
    <>
      <Facts facts={[
        { label: "업무", icon: ListChecksIcon, value: <span className="flex min-w-0 items-center gap-2"><Badge variant="outline">{item.key}</Badge><span className="truncate">{item.workTitle}</span></span> },
      ]} />
      <Card>
        <CardHeader>
          <CardTitle>{item.author}</CardTitle>
          <CardDescription>{item.receivedAt} 댓글</CardDescription>
        </CardHeader>
        <CardContent><p className="leading-relaxed">{item.comment}</p></CardContent>
      </Card>
    </>
  )
}
