import { useState } from "react"
import { departmentOf, ME_ID, MemberAvatar, MemberStatusBadge, roleOf, useMember } from "@/entities/member"
import { paths } from "@/shared/config"
import { Button } from "@/shared/ui/button"
import { GalleryEditIcon, PencilIcon, UserIcon } from "@/shared/ui/icon"
import { SettingsPage, SettingsRow, SettingsSection } from "@/shared/ui/settings"
import { Skeleton } from "@/shared/ui/skeleton"
import { PhoneDialog } from "./PhoneDialog"
import { PictureDialog } from "./PictureDialog"

/** 글자 값. 비었으면 SettingsRow가 보조색 "-"를 그린다. */
const text = (value?: string) => (value ? <span className="text-right">{value}</span> : undefined)

/**
 * 내 정보(호호코워크 account/ProfilePage): 소속(그림 · 이름 · 부서 · 직위 · 상태와 인사 정보)과 개인 정보(휴대전화).
 * 프로필 이미지와 휴대전화만 직접 바꾼다(그림 18장 중 고르기, 번호 고치기). 바꾼 것은 이 브라우저에 남는다.
 */
export function ProfilePage() {
  const { data: me } = useMember(ME_ID)
  const [editing, setEditing] = useState<"picture" | "phone">()
  const close = (isOpen: boolean) => { if (!isOpen) setEditing(undefined) }
  return (
    <SettingsPage crumbs={[{ label: "내 계정", href: paths.profile }, { label: "내 정보", icon: UserIcon }]} title="내 정보"
      description="프로필 이미지와 휴대전화는 직접 바꿀 수 있습니다. 소속과 인사 정보는 관리자에게 요청하세요.">
      {!me ? <Skeleton aria-label="내 정보를 불러오는 중" className="h-80 rounded-xl" /> : (
        <>
          <SettingsSection title="소속" action={
            <Button variant="secondary" size="sm" onClick={() => setEditing("picture")}>
              <GalleryEditIcon data-icon="inline-start" />프로필 이미지 변경
            </Button>
          }>
            <div className="flex min-h-11 items-center gap-3 p-3">
              <button type="button" aria-label="프로필 이미지 변경" onClick={() => setEditing("picture")}
                className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <MemberAvatar member={me} className="size-10" />
              </button>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{me.name}</span>
                <span className="truncate text-sm text-muted-foreground">{[departmentOf(me.departmentId)?.name, roleOf(me)].join(" · ")}</span>
              </div>
              <MemberStatusBadge status={me.status} />
            </div>
            <SettingsRow label="업무 이메일">{text(me.email)}</SettingsRow>
            <SettingsRow label="부서">{text(departmentOf(me.departmentId)?.name)}</SettingsRow>
            <SettingsRow label="직급">{text(me.rank)}</SettingsRow>
            <SettingsRow label="직위">{text(me.position)}</SettingsRow>
            <SettingsRow label="입사일">{text(me.joinedAt.replaceAll("-", ". "))}</SettingsRow>
          </SettingsSection>
          <SettingsSection title="개인 정보">
            <SettingsRow label="휴대전화" description={me.phone || "등록하지 않음"}>
              <Button variant="secondary" size="sm" onClick={() => setEditing("phone")}>
                <PencilIcon data-icon="inline-start" />휴대전화 수정
              </Button>
            </SettingsRow>
          </SettingsSection>
          {/* 열 때마다 새로 그려 고르던 것 · 쓰던 것이 지금 값에서 시작한다. */}
          {editing === "picture" && <PictureDialog me={me} open onOpenChange={close} />}
          {editing === "phone" && <PhoneDialog phone={me.phone} open onOpenChange={close} />}
        </>
      )}
    </SettingsPage>
  )
}
