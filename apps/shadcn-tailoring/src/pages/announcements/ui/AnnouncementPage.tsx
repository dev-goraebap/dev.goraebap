import { Link, useNavigate, useParams } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import {
  categoryLabel, copyAnnouncementLink, momentText, useAnnouncement, useDeleteAnnouncement, useMarkAnnouncementRead, type Announcement,
} from "@/entities/announcement"
import { paths } from "@/shared/config"
import { ActionMenu } from "@/shared/ui/action-menu"
import { Button } from "@/shared/ui/button"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { ClockIcon, EyeIcon, LinkIcon, MegaphoneIcon, PencilIcon, PinIcon, Trash2Icon } from "@/shared/ui/icon"
import { InfoPill } from "@/shared/ui/info-pill"
import { Page } from "@/shared/ui/page"
import { PageState } from "@/shared/ui/page-state"
import { PersonAvatar } from "@/shared/ui/person-avatar"
import { DetailLayout, MarkdownBody, type DetailSection } from "@/shared/ui/reading"
import { Skeleton } from "@/shared/ui/skeleton"
import { toast } from "@/shared/ui/toast"
import { composeTarget, editHref } from "../model/address"
import { useOpenPanel, usePanel } from "@/shared/lib/panel"
import { AnnouncementCompose } from "./AnnouncementCompose"
import { AnnouncementFiles } from "./AnnouncementFiles"

/** 머리 줄 끝의 페이지 메뉴(…): 링크 복사 · 수정 · 삭제. 삭제는 확인을 받고, 지우면 목록으로 돌아간다. */
function AnnouncementMenu({ notice, onEdit }: { notice: Announcement; onEdit: () => void }) {
  const navigate = useNavigate()
  const remove = useDeleteAnnouncement()
  const [isConfirming, setConfirming] = useState(false)
  const confirm = () => remove.mutate(notice.id, {
    onSuccess: () => {
      toast.add({ type: "success", title: "공지를 지웠습니다", description: notice.title })
      void navigate({ to: paths.announcements, replace: true })
    },
  })
  return (
    <>
      <ActionMenu label="공지 메뉴" title={notice.title} actions={[
        { label: "링크 복사", icon: LinkIcon, onSelect: () => void copyAnnouncementLink(notice.id) },
        { label: "수정", icon: PencilIcon, onSelect: onEdit },
        { label: "삭제", icon: Trash2Icon, onSelect: () => setConfirming(true) },
      ]} />
      <ConfirmDialog open={isConfirming} onOpenChange={setConfirming} title="공지를 지울까요?"
        description={`'${notice.title}' 공지가 모든 구성원의 목록에서 사라집니다.`}
        action={{ label: "삭제", onAction: confirm, isPending: remove.isPending }} />
    </>
  )
}

/** 속성(게시 · 읽은 사람 · 고정 · 중요)과 정보(작성자 · 수정일). 공지의 값은 상세에서 바꾸지 않으므로 모두 읽기 알약이다. */
function sectionsOf(notice: Announcement): DetailSection[] {
  const feature = [notice.isPinned && "고정", notice.isImportant && "중요"].filter(Boolean).join(" · ")
  return [
    {
      title: "속성",
      items: (
        <>
          <InfoPill label="게시" icon={<ClockIcon />}>{momentText(notice.publishedAt)} 게시</InfoPill>
          <InfoPill label="읽은 사람" icon={<EyeIcon />}>{notice.readCount}명 읽음</InfoPill>
          {feature && <InfoPill label="알림 방식" icon={<PinIcon />}>{feature}</InfoPill>}
        </>
      ),
    },
    {
      title: "정보",
      items: (
        <>
          <InfoPill label="작성자" icon={<PersonAvatar id={notice.author.id} name={notice.author.name} className="size-4" />}>{notice.author.name}</InfoPill>
          {notice.updatedAt !== notice.publishedAt && <InfoPill label="수정일" icon={<PencilIcon />}>{momentText(notice.updatedAt)} 수정</InfoPill>}
        </>
      ),
    },
  ]
}

/** 읽어 온 공지: 소속 줄(공지사항 · 분류) · 제목 · 본문 · 첨부, 속성 알약. 열면 읽음이 된다. */
function AnnouncementDetail({ notice }: { notice: Announcement }) {
  const { mutate: markRead } = useMarkAnnouncementRead()
  const isUnread = !notice.isRead
  useEffect(() => { if (isUnread) markRead(notice.id) }, [isUnread, notice.id, markRead])
  return (
    <DetailLayout label={notice.title} title={notice.title} sections={sectionsOf(notice)}
      head={
        <p className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <span>공지사항</span>
          <span aria-hidden>·</span>
          <span>{categoryLabel(notice.category)}</span>
        </p>
      }>
      <MarkdownBody source={notice.body} />
      {notice.attachments.length > 0 && <AnnouncementFiles files={notice.attachments} />}
    </DetailLayout>
  )
}

/** 상세 면에는 점 무늬가 없다. 읽는 중 · 없음도 같은 바탕에 둔다. */
const PLAIN = "flex flex-1 flex-col bg-background"

function DetailSkeleton() {
  return (
    <div className={PLAIN}>
      <div aria-busy="true" aria-label="공지를 읽는 중" className="mx-auto flex w-full max-w-180 flex-col gap-4 px-4 pt-5 md:pt-8">
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
      <PageState kind="not-found" title="공지를 찾을 수 없습니다" description="삭제했거나 주소가 바뀐 공지입니다."
        action={<Button variant="secondary" nativeButton={false} render={<Link to={paths.announcements} />}>공지사항으로</Button>} />
    </div>
  )
}

/**
 * 공지 상세(호호코워크 AnnouncementPage): 경로 공지사항 › 제목, 머리 줄 끝에 페이지 메뉴. 수정(/announcements/{id}/edit)은
 * 데스크톱에서 이 공지 위 대화상자(주소창에는 그 페이지 주소), 휴대폰은 그 페이지로 간다. 저장하면 대화상자를 닫는다.
 * 휴대폰은 앱 바의 ← 가 공지사항으로 간다.
 */
export function AnnouncementPage() {
  const { announcementId = "" } = useParams({ strict: false })
  const { data: notice } = useAnnouncement(announcementId)
  const openPanel = useOpenPanel()
  const panel = usePanel()
  const isEditing = composeTarget(panel.pathname)?.id === announcementId
  return (
    <Page crumbs={[{ label: "공지사항", href: paths.announcements }, { label: notice?.title ?? "공지", icon: MegaphoneIcon }]} isFullScreen
      actions={notice && <AnnouncementMenu notice={notice} onEdit={() => openPanel(editHref(notice.id))} />}>
      {notice === undefined ? <DetailSkeleton /> : notice === null ? <NotFound /> : <AnnouncementDetail notice={notice} />}
      {notice && isEditing && (
        <AnnouncementCompose key={notice.id} notice={notice} surface="dialog" onClose={panel.close} onExpand={panel.expand} onSaved={panel.close} />
      )}
    </Page>
  )
}
