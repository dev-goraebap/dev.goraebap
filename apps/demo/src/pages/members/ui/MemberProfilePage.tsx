import { Link, useNavigate, useParams } from "@tanstack/react-router"
import { useMember } from "@/entities/member"
import { paths } from "@/shared/config"
import { Button } from "@/shared/ui/button"
import { UserIcon, UsersIcon } from "@/shared/ui/icon"
import { Page } from "@/shared/ui/page"
import { PageState } from "@/shared/ui/page-state"
import { Skeleton } from "@/shared/ui/skeleton"
import { PersonProfile } from "@/widgets/person-profile"

/**
 * 구성원 한 사람의 프로필 페이지(/members/{id}, 호호코워크 MemberPage): 휴대폰에서 누른 사람, 링크 · 새로고침 · 크게 보기로
 * 온 곳. 경로는 구성원 › 이름, 휴대폰은 ← 구성원. 같은 부서 사람은 그 사람의 페이지로 옮긴다. 없는 아이디는 찾을 수 없음 화면.
 */
export function MemberProfilePage() {
  const { memberId = "" } = useParams({ strict: false })
  const { data: member } = useMember(memberId)
  const navigate = useNavigate()
  const crumbs = [{ label: "구성원", href: paths.members, icon: UsersIcon }, { label: member?.name ?? "프로필", icon: UserIcon }]
  return (
    <Page crumbs={crumbs} isFullScreen>
      {member === null ? (
        <PageState kind="not-found" title="구성원을 찾을 수 없습니다" description="퇴사했거나 주소가 바뀌었을 수 있습니다."
          action={<Button variant="outline" nativeButton={false} render={<Link to={paths.members} />}>구성원 목록으로</Button>} />
      ) : (
        <main className="flex justify-center px-4 py-8 md:py-10">
          <div className="w-full max-w-160 min-w-0">
            {member === undefined
              ? <Skeleton className="h-26 rounded-xl" />
              : <PersonProfile key={member.id} member={member} onOpenMember={id => void navigate({ to: "/members/$memberId", params: { memberId: id } })} />}
          </div>
        </main>
      )}
    </Page>
  )
}
