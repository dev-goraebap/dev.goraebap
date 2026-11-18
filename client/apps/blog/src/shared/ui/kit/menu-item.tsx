import type { ComponentProps } from "react"
import { cn } from "cn"

/**
 * 팝오버 · 시트 · 메뉴 안의 한 줄(모든 메뉴 공통). 드롭다운 메뉴(DropdownMenuItem), 고르기 목록(CommandItem · OptionList),
 * 단추 목록(MenuItem: ActionMenu · 새로 만들기 · 수정 이력 · 내보내기 …)이 이 모양 하나를 쓴다.
 * - 데스크톱 36px(위아래 6px) · 14px 글자 · 16px 아이콘, 휴대폰 48px · 15px 글자 · 20px 아이콘.
 * - 가리키거나(hover) 키보드로 고른 줄(focus-visible · data-highlighted · data-selected)은 accent 면. 팝오버 바탕(popover)은
 *   조작 면(control-hover)과 거의 같은 색이라 그 면으로는 가리킴이 보이지 않는다.
 */
export const menuItemClass = cn(
  "relative flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-hidden select-none",
  "hover:bg-accent focus-visible:bg-accent data-highlighted:bg-accent data-[selected=true]:bg-accent",
  "disabled:pointer-events-none disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  "max-md:min-h-12 max-md:gap-3 max-md:text-[0.9375rem] max-md:[&_svg:not([class*='size-'])]:size-5",
)

/** 단추로 된 메뉴 한 줄(기본 role="menuitem"). 앞에 아이콘, 이름, 끝에 덧붙일 것(켜짐 점 · 체크)을 children으로 둔다. */
export function MenuItem({ className, type = "button", role = "menuitem", ...props }: ComponentProps<"button">) {
  return <button type={type} role={role} data-slot="menu-item" className={cn(menuItemClass, className)} {...props} />
}
