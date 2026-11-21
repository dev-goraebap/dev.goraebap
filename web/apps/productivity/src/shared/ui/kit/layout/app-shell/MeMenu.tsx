import { Fragment, useState, type ReactElement } from "react"
import { cn } from "cn"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { AdaptivePopover } from "@/shared/ui/kit/adaptive-popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/kit/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/shared/ui/kit/dropdown-menu"
import { MoreVerticalIcon, type Icon } from "@/shared/ui/kit/icon"
import { MenuItem } from "@/shared/ui/kit/menu-item"
import { Skeleton } from "@/shared/ui/kit/skeleton"

/**
 * 셸이 보이는 나. 펼친 사이드바는 내 박스(아바타 · 이름 · 소속 · …), 접은 사이드바와 휴대폰 앱 바는 아바타만 그리고,
 * 어느 쪽을 눌러도 같은 내 메뉴가 열린다: 데스크톱은 드롭다운, 휴대폰은 다른 메뉴와 같은 바텀시트(2026-11-16). 항목은 데이터(groups)로
 * 받아 두 모양이 같은 것을 그린다. 읽는 동안은 name 없이 넘긴다.
 */
export type MeMenuItem = { label: string; icon: Icon; onSelect: () => void }

export type ShellMe = {
  name?: string
  /** 이름 아래 한 줄(소속 · 메일). */
  detail?: string
  picture?: string
  /** 그림이 없을 때의 글자. 없으면 이름 끝 두 글자(한국어 이름의 부르는 이름). */
  initials?: string
  /** 메뉴 항목의 묶음들. 묶음 사이에 구분선이 선다. */
  groups: MeMenuItem[][]
}

const initialsOf = (me: ShellMe) => me.initials ?? me.name?.slice(-2) ?? ""

/** 내 메뉴: trigger(내 박스 · 아바타 단추)를 누르면 연다. */
export function MeMenu({ me, trigger, align = "start" }: { me: ShellMe; trigger: ReactElement; align?: "start" | "end" }) {
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(false)
  const groups = me.groups.filter(group => group.length > 0)
  if (isMobile) return (
    <AdaptivePopover title={me.name ?? "내 메뉴"} open={isOpen} onOpenChange={setIsOpen} trigger={trigger}>
      <div role="menu" aria-label="내 메뉴" className="flex flex-col">
        {groups.map((group, index) => <Fragment key={index}>
          {index > 0 && <div role="separator" className="my-1 h-px bg-border" />}
          {group.map(item => <MenuItem key={item.label} onClick={() => { setIsOpen(false); item.onSelect() }}><item.icon />{item.label}</MenuItem>)}
        </Fragment>)}
      </div>
    </AdaptivePopover>
  )
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent align={align} className="min-w-48">
        <DropdownMenuGroup><DropdownMenuLabel className="truncate">{me.name}</DropdownMenuLabel></DropdownMenuGroup>
        {groups.map((group, index) => <Fragment key={index}>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>{group.map(item => <DropdownMenuItem key={item.label} onClick={item.onSelect}><item.icon />{item.label}</DropdownMenuItem>)}</DropdownMenuGroup>
        </Fragment>)}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** 내 아바타(초타원, 2026-11-15). 기본 32px, sm은 24px(머리 줄의 아이콘 단추 곁). */
export function MeAvatar({ me, size = "md" }: { me: ShellMe; size?: "sm" | "md" }) {
  // 초타원은 같은 반지름이면 덜 둥글어 보여 조금 크게 깎는다. Avatar의 테두리(after) · 그림 · 글자 면도 같은 모서리로 깎아
  // 안쪽에 선이 하나 더 보이지 않게 한다. 테두리에 혼합(blend)을 쓰지 않는다(초타원과 겹치면 래스터가 크게 늘었다, 1815cf2b).
  const corner = size === "sm" ? "rounded-[0.6875rem]" : "rounded-[0.875rem]"
  return (
    <Avatar className={cn(size === "sm" ? "size-6" : "size-8", "squircle after:squircle", corner, size === "sm" ? "after:rounded-[0.6875rem]" : "after:rounded-[0.875rem]")}>
      {me.picture && <AvatarImage src={me.picture} alt="" className={cn("squircle", corner)} />}
      <AvatarFallback className={cn("squircle bg-secondary font-semibold", corner, size === "sm" ? "text-[0.625rem]" : "text-xs")}>{initialsOf(me)}</AvatarFallback>
    </Avatar>
  )
}

/** 펼친 사이드바의 내 박스: 아바타 · 이름 · 한 줄 · 가로 …, 누르면 내 메뉴. */
export function MeBox({ me }: { me: ShellMe }) {
  return (
    <MeMenu me={me} trigger={
      <button type="button" aria-label={me.name ? `내 메뉴: ${me.name}` : "내 메뉴"}
        className="flex w-full items-center gap-2.5 rounded-xl bg-pressed px-2.5 py-2 text-left outline-none hover:bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)] focus-visible:ring-2 focus-visible:ring-ring">
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

/** 아바타만 있는 내 메뉴 단추(접은 사이드바 · 머리 줄 · 휴대폰 앱 바). 휴대폰에서는 44px 누름 자리를 둔다. */
export function MeButton({ me, className, align, size = "md" }: { me: ShellMe; className?: string; align?: "start" | "end"; size?: "sm" | "md" }) {
  return (
    <MeMenu me={me} align={align} trigger={
      <button type="button" aria-label={me.name ? `내 메뉴: ${me.name}` : "내 메뉴"}
        className={cn("grid place-items-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring max-md:size-11",
          // sm: 곁의 아이콘 단추(28px)와 같은 누름 자리 · 가리킴 면.
          size === "sm" && "size-7 rounded-lg hover:bg-muted", className)}>
        <MeAvatar me={me} size={size} />
      </button>
    } />
  )
}
