import { Link, useNavigate, useParams } from "@tanstack/react-router"
import { announcementHref, useAnnouncement } from "@/entities/announcement"
import { paths } from "@/shared/config"
import { Button } from "@/shared/ui/button"
import { MegaphoneIcon } from "@/shared/ui/icon"
import { Page } from "@/shared/ui/page"
import { PageState } from "@/shared/ui/page-state"
import { Skeleton } from "@/shared/ui/skeleton"
import { AnnouncementCompose } from "./AnnouncementCompose"

/** 고칠 공지를 읽는 동안 · 찾지 못했을 때의 자리. 양식과 같은 경로를 둔다. */
function EditState({ notice }: { notice: null | undefined }) {
  return (
    <Page crumbs={[{ label: "공지사항", href: paths.announcements }, { label: "공지 수정", icon: MegaphoneIcon }]} isFullScreen>
      <div className="flex flex-1 flex-col bg-background">
        {notice === undefined ? (
          <div aria-busy="true" aria-label="공지를 읽는 중" className="mx-auto flex w-full max-w-180 flex-col gap-4 px-4 py-8">
            <Skeleton className="h-8 w-3/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : (
          <PageState kind="not-found" title="공지를 찾을 수 없습니다" description="삭제했거나 주소가 바뀐 공지입니다."
            action={<Button variant="secondary" nativeButton={false} render={<Link to={paths.announcements} />}>공지사항으로</Button>} />
        )}
      </div>
    </Page>
  )
}

/**
 * 공지를 자기 페이지에서 쓴다(/announcements/new, /announcements/{id}/edit, 호호코워크 AnnouncementComposePage): 링크 · 새로고침 ·
 * 크게 보기, 그리고 휴대폰은 늘 여기로 온다(데스크톱에서 목록 · 공지의 버튼으로 열면 그 위 대화상자다).
 * 저장하면 그 공지가 이 자리를 대신하고, 취소는 온 곳(공지 또는 목록)으로 간다.
 */
export function AnnouncementComposePage() {
  const navigate = useNavigate()
  const { announcementId } = useParams({ strict: false }) as { announcementId?: string }
  const { data: notice } = useAnnouncement(announcementId ?? "")
  const back = () => void navigate({ href: announcementId ? announcementHref(announcementId) : paths.announcements })
  const saved = (id: string) => void navigate({ href: announcementHref(id), replace: true })
  if (!announcementId) return <AnnouncementCompose surface="page" onClose={back} onSaved={saved} />
  if (!notice) return <EditState notice={notice} />
  return <AnnouncementCompose key={notice.id} notice={notice} surface="page" onClose={back} onSaved={saved} />
}
