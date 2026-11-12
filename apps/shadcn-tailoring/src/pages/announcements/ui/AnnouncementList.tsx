import { announcementHref, categoryLabel, listDateText, type Announcement } from "@/entities/announcement"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { DetailLink } from "@/shared/ui/detail-surface"
import { EyeIcon, PaperclipIcon, PinIcon } from "@/shared/ui/icon"
import { PersonAvatar } from "@/shared/ui/person-avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

/** 줄은 자기 바탕을 칠해 페이지의 점 무늬를 가리고, 가리키면 옅게 덮는다. */
const ROW_SURFACE = "relative bg-background hover:bg-row-hover"

/**
 * 공지 제목을 상세로 잇는 줄 링크(DetailLink): 줄 어디를 눌러도 열리고, 데스크톱은 목록 위 대화상자, 휴대폰은 페이지, 보조 키는 새 탭.
 * 읽지 않은 공지는 굵게 쓴다.
 */
function TitleLink({ item, className }: { item: Announcement; className?: string }) {
  return (
    <DetailLink href={announcementHref(item.id)} title={item.isRead ? undefined : "읽지 않음"} className={cn("truncate", !item.isRead && "font-semibold", className)}>
      {item.title}
    </DetailLink>
  )
}

/** 분류와 중요 표시. */
function Marks({ item }: { item: Announcement }) {
  return (
    <>
      <Badge variant="label">{categoryLabel(item.category)}</Badge>
      {item.isImportant && <Badge variant="destructive">중요</Badge>}
    </>
  )
}

const Count = ({ icon: Mark, value, label }: { icon: typeof EyeIcon; value: number; label: string }) => (
  <span className="inline-flex items-center gap-1 text-muted-foreground tabular-nums" aria-label={`${label} ${value}`}>
    <Mark className="text-icon-muted" />{value}
  </span>
)

/**
 * 데스크톱의 공지 표(호호코워크 AnnouncementsPage의 PageTable): 제목(고정 표식 · 분류) · 작성자 · 첨부 · 읽은 사람 · 게시일.
 * 머리 줄은 위에 붙고, 첫 · 끝 칸은 면 가장자리에서 16px.
 */
export function AnnouncementTable({ items }: { items: Announcement[] }) {
  return (
    <Table className="table-fixed bg-background">
      <TableHeader className="sticky top-0 z-10 bg-background">
        <TableRow className="hover:bg-transparent">
          <TableHead className="h-11 pl-4 text-muted-foreground">제목</TableHead>
          <TableHead className="w-40 text-muted-foreground">작성자</TableHead>
          <TableHead className="w-20 text-right text-muted-foreground">첨부</TableHead>
          <TableHead className="w-24 text-right text-muted-foreground">읽은 사람</TableHead>
          <TableHead className="w-32 pr-4 text-right text-muted-foreground">게시일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map(item => (
          <TableRow key={item.id} className={ROW_SURFACE}>
            <TableCell className="h-12.25 pl-4 compact:h-10.25">
              <span className="flex min-w-0 items-center gap-2">
                {item.isPinned && <PinIcon role="img" aria-hidden={false} aria-label="고정" className="shrink-0" />}
                <TitleLink item={item} className="min-w-0" />
                <Marks item={item} />
              </span>
            </TableCell>
            <TableCell>
              <span className="flex min-w-0 items-center gap-2">
                <PersonAvatar id={item.author.id} name={item.author.name} />
                <span className="truncate">{item.author.name}</span>
              </span>
            </TableCell>
            <TableCell className="text-right">{item.attachments.length > 0 && <Count icon={PaperclipIcon} value={item.attachments.length} label="첨부" />}</TableCell>
            <TableCell className="text-right"><Count icon={EyeIcon} value={item.readCount} label="읽은 사람" /></TableCell>
            <TableCell className="pr-4 text-right text-muted-foreground tabular-nums">{listDateText(item.publishedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/**
 * 휴대폰의 공지 줄(호호코워크 PageList): 앞에 고정 표식이나 작성자 아바타(32px), 제목, 그 아래 분류 · 작성자 · 게시일 · 첨부,
 * 읽지 않았으면 끝에 새 글.
 */
export function AnnouncementRows({ items }: { items: Announcement[] }) {
  return (
    <ul aria-label="공지 목록" className="flex flex-col">
      {items.map(item => (
        <li key={item.id} className={cn("flex items-center gap-3 border-b px-4 py-3", ROW_SURFACE)}>
          {item.isPinned
            ? <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted"><PinIcon role="img" aria-hidden={false} aria-label="고정" /></span>
            : <PersonAvatar id={item.author.id} name={item.author.name} className="size-8" />}
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <TitleLink item={item} />
            <span className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
              <Marks item={item} />
              <span className="truncate">
                {[item.author.name, listDateText(item.publishedAt), item.attachments.length > 0 && `첨부 ${item.attachments.length}`].filter(Boolean).join(" · ")}
              </span>
            </span>
          </span>
          {!item.isRead && <span className="shrink-0 text-sm font-semibold">새 글</span>}
        </li>
      ))}
    </ul>
  )
}
