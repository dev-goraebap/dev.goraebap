import type { ReactElement, ReactNode } from "react"
import { cn } from "cn"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu"
import { MoreVerticalIcon } from "@/shared/ui/icon"
import { Skeleton } from "@/shared/ui/skeleton"

/**
 * 셸이 보이는 나. 펼친 사이드바는 내 박스(아바타 · 이름 · 소속 · …), 접은 사이드바와 휴대폰 앱 바는 아바타만 그리고,
 * 어느 쪽을 눌러도 같은 내 메뉴(menu: DropdownMenuGroup · DropdownMenuItem들)가 열린다. 읽는 동안은 name 없이 넘긴다.
 */
export type ShellMe = {
  name?: string
  /** 이름 아래 한 줄(소속 · 메일). */
  detail?: string
  picture?: string
  /** 그림이 없을 때의 글자. 없으면 이름 끝 두 글자(한국어 이름의 부르는 이름). */
  initials?: string
  menu: ReactNode
}

const initialsOf = (me: ShellMe) => me.initials ?? me.name?.slice(-2) ?? ""

/** 내 메뉴: trigger(내 박스 · 아바타 단추)를 누르면 연다. */
export function MeMenu({ me, trigger }: { me: ShellMe; trigger: ReactElement }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent align="start" className="min-w-48">{me.menu}</DropdownMenuContent>
    </DropdownMenu>
  )
}

/** 내 아바타(32px 초타원). */
export function MeAvatar({ me }: { me: ShellMe }) {
  return (
    <Avatar className="size-8 squircle rounded-[0.625rem] after:rounded-[0.625rem]">
      {me.picture && <AvatarImage src={me.picture} alt="" className="squircle rounded-[0.625rem]" />}
      <AvatarFallback className="squircle rounded-[0.625rem] bg-secondary text-xs font-semibold">{initialsOf(me)}</AvatarFallback>
    </Avatar>
  )
}

/** 펼친 사이드바의 내 박스: 아바타 · 이름 · 한 줄 · 가로 …, 누르면 내 메뉴. */
export function MeBox({ me }: { me: ShellMe }) {
  return (
    <MeMenu me={me} trigger={
      <button type="button" aria-label={me.name ? `내 메뉴: ${me.name}` : "내 메뉴"}
        className="flex w-full items-center gap-2.5 squircle rounded-xl bg-pressed px-2.5 py-2 text-left outline-none hover:bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)] focus-visible:ring-2 focus-visible:ring-ring">
        <MeAvatar me={me} />
        <span className="flex min-w-0 flex-1 flex-col">
          {me.name ? (
            <>
              <span className="truncate text-sm font-semibold">{me.name}</span>
              {me.detail && <span className="truncate text-xs text-muted-foreground">{me.detail}</span>}
            </>
          ) : (
            <>
              <Skeleton className="my-0.5 h-4 w-16" />
              <Skeleton className="my-0.5 h-3 w-12" />
            </>
          )}
        </span>
        <MoreVerticalIcon className="rotate-90 text-icon-muted" />
      </button>
    } />
  )
}

/** 아바타만 있는 내 메뉴 단추(접은 사이드바 · 휴대폰 앱 바). 휴대폰에서는 44px 누름 자리를 둔다. */
export function MeButton({ me, className }: { me: ShellMe; className?: string }) {
  return (
    <MeMenu me={me} trigger={
      <button type="button" aria-label="내 메뉴" className={cn("grid place-items-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring max-md:size-11", className)}>
        <MeAvatar me={me} />
      </button>
    } />
  )
}
