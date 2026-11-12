import { MeetingStatusBadge, meetingHref, rowHeldText, type Meeting } from "@/entities/meeting"
import { cn } from "cn"
import { Badge } from "@/shared/ui/badge"
import { DetailLink } from "@/shared/ui/detail-surface"
import { ProjectsIcon } from "@/shared/ui/icon"
import { PersonAvatar } from "@/shared/ui/person-avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

/** 줄은 자기 바탕을 칠해 페이지의 점 무늬를 가리고, 가리키면 옅게 덮는다. */
const ROW_SURFACE = "relative bg-background hover:bg-row-hover"

/** 회의록 제목을 상세로 잇는 줄 링크(DetailLink): 줄 어디를 눌러도 열리고, 데스크톱은 목록 위 대화상자, 휴대폰은 페이지, 보조 키는 새 탭. */
function TitleLink({ meeting, className }: { meeting: Meeting; className?: string }) {
  return <DetailLink href={meetingHref(meeting.id)} className={cn("truncate", className)}>{meeting.title}</DetailLink>
}

/** 프로젝트 이름 알약(호호코워크 RowLabel). */
function ProjectLabel({ project }: { project: string }) {
  return <Badge variant="label" className="max-w-full"><ProjectsIcon /><span className="truncate">{project}</span></Badge>
}

/**
 * 데스크톱의 회의록 표(호호코워크 MeetingsPage의 PageTable): 회의록 · 만든 사람 · 프로젝트 · 상태 · 회의 일시.
 * 머리 줄은 위에 붙고, 첫 · 끝 칸은 면 가장자리에서 16px.
 */
export function MeetingTable({ items }: { items: Meeting[] }) {
  return (
    <Table className="table-fixed bg-background">
      <TableHeader className="sticky top-0 z-10 bg-background">
        <TableRow className="hover:bg-transparent">
          <TableHead className="h-11 pl-4 text-muted-foreground">회의록</TableHead>
          <TableHead className="w-36 text-muted-foreground">만든 사람</TableHead>
          <TableHead className="w-40 text-muted-foreground">프로젝트</TableHead>
          <TableHead className="w-32 text-muted-foreground">상태</TableHead>
          <TableHead className="w-44 pr-4 text-right text-muted-foreground">회의 일시</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map(meeting => (
          <TableRow key={meeting.id} className={ROW_SURFACE}>
            <TableCell className="h-12.25 pl-4 compact:h-10.25"><span className="flex min-w-0"><TitleLink meeting={meeting} /></span></TableCell>
            <TableCell>
              <span className="flex min-w-0 items-center gap-2">
                <PersonAvatar id={meeting.author.id} name={meeting.author.name} />
                <span className="truncate">{meeting.author.name}</span>
              </span>
            </TableCell>
            <TableCell>{meeting.project && <ProjectLabel project={meeting.project} />}</TableCell>
            <TableCell><MeetingStatusBadge status={meeting.status} /></TableCell>
            <TableCell className="pr-4 text-right text-muted-foreground tabular-nums">{rowHeldText(meeting)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/**
 * 휴대폰의 회의록 줄(호호코워크 PageList): 앞에 만든 사람 아바타(32px), 제목과 그 아래 만든 사람 · 회의 일시,
 * 끝에 프로젝트와 (완료가 아니면) 상태.
 */
export function MeetingRows({ items }: { items: Meeting[] }) {
  return (
    <ul aria-label="회의록 목록" className="flex flex-col">
      {items.map(meeting => (
        <li key={meeting.id} className={cn("flex items-center gap-3 border-b px-4 py-3", ROW_SURFACE)}>
          <PersonAvatar id={meeting.author.id} name={meeting.author.name} className="size-8" />
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <TitleLink meeting={meeting} />
            <span className="truncate text-sm text-muted-foreground tabular-nums">{meeting.author.name} · {rowHeldText(meeting)}</span>
          </span>
          {(meeting.project || meeting.status !== "completed") && (
            <span className="flex max-w-32 shrink-0 flex-wrap items-center justify-end gap-1">
              {meeting.project && <ProjectLabel project={meeting.project} />}
              {meeting.status !== "completed" && <MeetingStatusBadge status={meeting.status} />}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
