import { useMember } from "@/entities/member"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/shared/ui/dialog"
import { MaximizeIcon, XIcon } from "@/shared/ui/icon"
import { PageState } from "@/shared/ui/page-state"
import { Skeleton } from "@/shared/ui/skeleton"
import { PersonProfile } from "./PersonProfile"

/**
 * 데스크톱에서 보던 페이지 위에 여는 프로필(호호코워크 ProfileSurface의 대화상자). 머리에 제목 · 크게 보기 · 닫기,
 * 내용은 스크롤한다. 같은 부서 사람을 누르면 이 대화상자 안에서 이어 연다(onOpenMember). 휴대폰은 늘 페이지라 쓰지 않는다.
 */
export function ProfileDialog({ memberId, onClose, onOpenMember, onExpand }: {
  memberId: string; onClose: () => void; onOpenMember: (id: string) => void; onExpand: (id: string) => void
}) {
  const { data: member } = useMember(memberId)
  return (
    <Dialog open onOpenChange={isOpen => { if (!isOpen) onClose() }}>
      <DialogContent showCloseButton={false} className="flex max-h-[80dvh] flex-col gap-0 p-0 sm:max-w-136">
        <header className="flex h-13 shrink-0 items-center gap-1 pr-2 pl-4">
          <DialogTitle className="flex-1 text-base font-semibold">프로필</DialogTitle>
          {member && (
            <Button variant="ghost" size="icon-sm" aria-label="크게 보기" title="크게 보기" onClick={() => onExpand(member.id)}>
              <MaximizeIcon />
            </Button>
          )}
          <DialogClose render={<Button variant="ghost" size="icon-sm" aria-label="닫기" title="닫기" />}><XIcon /></DialogClose>
        </header>
        <div className="min-h-0 overflow-y-auto px-4 pt-2 pb-4">
          {member === undefined ? <Skeleton className="h-26 rounded-xl" />
            : member === null ? <PageState isCompact kind="not-found" title="구성원을 찾을 수 없습니다" description="퇴사했거나 주소가 바뀌었을 수 있습니다." />
              : <PersonProfile key={member.id} member={member} onOpenMember={onOpenMember} />}
        </div>
      </DialogContent>
    </Dialog>
  )
}
