import type { ReactElement, ReactNode } from "react"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { Button } from "@/shared/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerTitle, DrawerTrigger } from "@/shared/ui/drawer"
import { XIcon } from "@/shared/ui/icon"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"

/**
 * 무엇을 누르면 옆에 뜨는 것. 데스크톱은 팝오버, 휴대폰은 반드시 바텀시트.
 * 내용은 같은 것을 쓰고, 휴대폰 시트에는 제목을 보인다(데스크톱 팝오버는 제목을 읽기용으로만 둔다).
 * trigger 없이 open으로만 여는 시트도 된다(휴대폰 … 메뉴가 여는 도구 시트). 데스크톱 팝오버는 붙을 단추가 있어야 한다.
 */
export function AdaptivePopover({ title, trigger, children, open, onOpenChange, align = "start", className }: {
  title: string
  trigger?: ReactElement
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  align?: "start" | "center" | "end"
  className?: string
}) {
  const isMobile = useIsMobile()
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {trigger ? <DrawerTrigger render={trigger} /> : null}
        {/* 휴대폰 시트(Linear 모바일의 고르는 창처럼): 화면 끝에서 띄운 둥근 카드, 왼쪽 제목 · 오른쪽 둥근 닫기. */}
        <DrawerContent className="[--drawer-inset:0.75rem] rounded-[1.75rem] border after:hidden data-[swipe-direction=down]:rounded-[1.75rem]">
          <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-2">
            <DrawerTitle className="min-w-0 truncate text-base font-semibold">{title}</DrawerTitle>
            <DrawerClose render={<Button variant="tool" size="icon" aria-label="닫기" className="size-11 shrink-0" />}><XIcon className="size-5" /></DrawerClose>
          </div>
          <div className="px-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">{children}</div>
        </DrawerContent>
      </Drawer>
    )
  }
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {trigger ? <PopoverTrigger render={trigger} /> : null}
      <PopoverContent align={align} aria-label={title} className={className ?? "w-64 p-1.5"}>{children}</PopoverContent>
    </Popover>
  )
}
