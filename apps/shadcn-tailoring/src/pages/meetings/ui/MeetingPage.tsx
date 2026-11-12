import { Link, useNavigate, useParams } from "@tanstack/react-router"
import { useState } from "react"
import {
  MeetingStatusBadge, clockText, copyMeetingLink, heldText, isInProgress, minutesMarkdown, useDeleteMeeting, useMeeting,
  type Meeting, type TranscriptLine,
} from "@/entities/meeting"
import { paths } from "@/shared/config"
import { useComposeParam } from "@/shared/lib/use-compose-param"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { ActionMenu } from "@/shared/ui/action-menu"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import {
  CalendarIcon, ClockIcon, FileTextIcon, InfoIcon, LinkIcon, MeetingIcon, NotesIcon, PencilIcon, ProjectsIcon, Trash2Icon,
  TriangleAlertIcon, UsersIcon,
} from "@/shared/ui/icon"
import { InfoPill } from "@/shared/ui/info-pill"
import { Page, PageViews, type PageView } from "@/shared/ui/page"
import { PageState } from "@/shared/ui/page-state"
import { PersonAvatar } from "@/shared/ui/person-avatar"
import { PropertyPill } from "@/shared/ui/property-pill"
import { DetailLayout, MarkdownBody, type DetailSection } from "@/shared/ui/reading"
import { Skeleton } from "@/shared/ui/skeleton"
import { toast } from "@/shared/ui/toast"
import { MeetingCompose } from "./MeetingCompose"
import { MeetingFiles } from "./MeetingFiles"

type Tab = "minutes" | "transcript"
const TABS: PageView<Tab>[] = [{ value: "minutes", label: "회의록", icon: MeetingIcon }, { value: "transcript", label: "전사원문", icon: FileTextIcon }]

const PROGRESS_TEXT = { waiting: "차례를 기다리고 있습니다.", transcribing: "녹음을 받아쓰고 있습니다.", summarizing: "받아쓴 내용으로 회의록을 만들고 있습니다." }

const created = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })

/** 머리 줄 끝의 페이지 메뉴(…): 링크 복사 · 수정 · 삭제. 삭제는 확인을 받고, 지우면 목록으로 돌아간다. */
function MeetingMenu({ meeting, onEdit }: { meeting: Meeting; onEdit: () => void }) {
  const navigate = useNavigate()
  const remove = useDeleteMeeting()
  const [isConfirming, setConfirming] = useState(false)
  const confirm = () => remove.mutate(meeting.id, {
    onSuccess: () => {
      toast.add({ type: "success", title: "회의록을 지웠습니다", description: meeting.title })
      void navigate({ to: paths.meetings, replace: true })
    },
  })
  return (
    <>
      <ActionMenu label="회의록 메뉴" title={meeting.title} actions={[
        { label: "링크 복사", icon: LinkIcon, onSelect: () => void copyMeetingLink(meeting.id) },
        { label: "수정", icon: PencilIcon, onSelect: onEdit },
        { label: "삭제", icon: Trash2Icon, onSelect: () => setConfirming(true) },
      ]} />
      <ConfirmDialog open={isConfirming} onOpenChange={setConfirming} title="회의록을 지울까요?"
        description={`'${meeting.title}' 회의록과 전사원문이 목록에서 사라집니다.`}
        action={{ label: "삭제", onAction: confirm, isPending: remove.isPending }} />
    </>
  )
}

/** 참석자 알약: 몇 명인지 보이고, 누르면 누가 왔는지 펼친다. */
function AttendeesPill({ people }: { people: Meeting["attendees"] }) {
  return (
    <PropertyPill label="참석자" icon={<UsersIcon />} text={people.length > 0 ? `참석자 ${people.length}명` : undefined}>
      {() => (
        <ul aria-label="참석자" className="flex flex-col">
          {people.map(person => (
            <li key={person.id} className="flex h-9 items-center gap-2 px-2 text-sm max-md:h-12">
              <PersonAvatar id={person.id} name={person.name} />{person.name}
            </li>
          ))}
          {people.length === 0 && <li className="px-2 py-1.5 text-sm text-muted-foreground">참석자를 적지 않았습니다.</li>}
        </ul>
      )}
    </PropertyPill>
  )
}

/** 속성(상태 · 회의 일시 · 참석자), 프로젝트, 정보(만든 사람 · 만든 때). */
function sectionsOf(meeting: Meeting): DetailSection[] {
  return [
    {
      title: "속성",
      items: (
        <>
          <MeetingStatusBadge status={meeting.status} />
          <InfoPill label="회의 일시" icon={<ClockIcon />}>{heldText(meeting)}</InfoPill>
          {meeting.event && <InfoPill label="일정" icon={<CalendarIcon />}>{meeting.event.title}</InfoPill>}
          <AttendeesPill people={meeting.attendees} />
        </>
      ),
    },
    ...(meeting.project ? [{ title: "프로젝트", items: <InfoPill label="프로젝트" icon={<ProjectsIcon />}>{meeting.project}</InfoPill> }] : []),
    {
      title: "정보",
      items: (
        <>
          <InfoPill label="만든 사람" icon={<PersonAvatar id={meeting.author.id} name={meeting.author.name} className="size-4" />}>{meeting.author.name}</InfoPill>
          <InfoPill label="만든 때" icon={<CalendarIcon />}>{created.format(new Date(meeting.createdAt))}</InfoPill>
        </>
      ),
    },
  ]
}

/** 받아쓴 원문: 때 · 말한 사람 · 말. */
function Transcript({ lines }: { lines: TranscriptLine[] }) {
  return (
    <ol aria-label="전사원문" className="flex flex-col gap-4">
      {lines.map(line => (
        <li key={line.startMs} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-3 gap-y-0.5">
          <span className="row-span-2 pt-0.5 font-mono text-xs text-muted-foreground tabular-nums">{clockText(line.startMs)}</span>
          <span className="text-sm font-semibold">{line.speaker}</span>
          <p className="leading-relaxed">{line.text}</p>
        </li>
      ))}
    </ol>
  )
}

/** 만드는 중 · 실패 안내(호호코워크 PageBanner의 자리). */
function StatusNotice({ meeting }: { meeting: Meeting }) {
  if (meeting.status === "failed") {
    return (
      <Alert variant="destructive">
        <TriangleAlertIcon />
        <AlertTitle>회의록을 만들지 못했습니다</AlertTitle>
        {meeting.failure && <AlertDescription>{meeting.failure}</AlertDescription>}
      </Alert>
    )
  }
  if (!isInProgress(meeting.status)) return null
  return (
    <Alert>
      <InfoIcon />
      <AlertTitle>{PROGRESS_TEXT[meeting.status as keyof typeof PROGRESS_TEXT]}</AlertTitle>
      <AlertDescription>다 만들어지면 이 화면에 회의록이 보입니다.</AlertDescription>
    </Alert>
  )
}

/** 읽어 온 회의록: 소속 줄 · 제목 · 상태 안내 · 참고 메모 · 회의록(요약 · 안건 · 결정 사항 · 할 일)과 붙인 파일, 또는 전사원문. */
function MeetingNotes({ meeting, tab }: { meeting: Meeting; tab: Tab }) {
  const minutes = minutesMarkdown(meeting)
  return (
    <DetailLayout label={meeting.title} title={meeting.title} sections={sectionsOf(meeting)}
      head={
        <p className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <span>회의록</span>
          {meeting.project && <><span aria-hidden>·</span><span className="truncate">{meeting.project}</span></>}
        </p>
      }>
      <StatusNotice meeting={meeting} />
      {meeting.note && (
        <Alert>
          <NotesIcon />
          <AlertTitle>참고 메모</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">{meeting.note}</AlertDescription>
        </Alert>
      )}
      {tab === "transcript"
        ? <Transcript lines={meeting.transcript} />
        : minutes
          ? <MarkdownBody source={minutes} />
          : meeting.status === "completed" && <p className="text-muted-foreground">회의록이 아직 없습니다.</p>}
      {tab === "minutes" && <MeetingFiles meeting={meeting} />}
    </DetailLayout>
  )
}

/** 상세 면에는 점 무늬가 없다. 읽는 중 · 없음도 같은 바탕에 둔다. */
const PLAIN = "flex flex-1 flex-col bg-background"

function DetailSkeleton() {
  return (
    <div className={PLAIN}>
      <div aria-busy="true" aria-label="회의록을 읽는 중" className="mx-auto flex w-full max-w-180 flex-col gap-4 px-4 pt-5 md:pt-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className={PLAIN}>
      <PageState kind="not-found" title="회의록을 찾을 수 없습니다" description="삭제했거나 주소가 바뀐 회의록입니다."
        action={<Button variant="secondary" nativeButton={false} render={<Link to={paths.meetings} />}>회의록으로</Button>} />
    </div>
  )
}

/**
 * 회의록 상세(호호코워크 MeetingPage): 경로 회의록 › 제목, 머리 줄 끝에 페이지 메뉴. 받아쓴 원문이 있으면 툴바에 회의록 · 전사원문 탭.
 * 수정은 데스크톱에서 이 회의록 위 대화상자, 휴대폰에서는 이 자리를 대신하는 양식 페이지다(?compose). 호호코워크에는 회의록
 * 수정이 없어 자기 주소(/meetings/{id}/edit)도 없으므로 ?compose로 둔다.
 */
export function MeetingPage() {
  const { meetingId = "" } = useParams({ strict: false })
  const { data: meeting } = useMeeting(meetingId)
  const isMobile = useIsMobile()
  const compose = useComposeParam()
  const [tab, setTab] = useState<Tab>("minutes")
  const hasTranscript = Boolean(meeting && meeting.transcript.length > 0)
  const editor = meeting && compose.isOpen && (
    <MeetingCompose key={meeting.id} meeting={meeting} surface={isMobile ? "page" : "dialog"} onClose={compose.close} onSaved={compose.close} />
  )
  if (editor && isMobile) return editor
  return (
    <Page crumbs={[{ label: "회의록", href: paths.meetings }, { label: meeting?.title ?? "회의록", icon: MeetingIcon }]} isFullScreen
      actions={meeting && <MeetingMenu meeting={meeting} onEdit={compose.open} />}
      views={hasTranscript && <PageViews label="회의록 보기" views={TABS} value={tab} onChange={setTab} />}>
      {meeting === undefined ? <DetailSkeleton />
        : meeting === null ? <NotFound />
          : <MeetingNotes meeting={meeting} tab={hasTranscript ? tab : "minutes"} />}
      {editor}
    </Page>
  )
}
