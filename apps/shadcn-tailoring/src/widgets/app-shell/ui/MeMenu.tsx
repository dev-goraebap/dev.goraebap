import { Link } from "@tanstack/react-router"
import type { ReactElement } from "react"
import { paths } from "@/shared/config"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { SettingsIcon, UserIcon, XIcon } from "@/shared/ui/icon"
import { toast } from "@/shared/ui/toast"

/** 내 메뉴: 내 정보 · 화면 설정 · 로그아웃. trigger는 내 박스(데스크톱)나 아바타(휴대폰 · 접은 사이드바). */
export function MeMenu({ trigger }: { trigger: ReactElement }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent align="start" className="min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link to={paths.profile} />}><UserIcon />내 정보</DropdownMenuItem>
          <DropdownMenuItem render={<Link to={paths.display} />}><SettingsIcon />화면 설정</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => toast.add({ title: "예제 앱이라 로그아웃하지 않습니다." })}><XIcon />로그아웃</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
