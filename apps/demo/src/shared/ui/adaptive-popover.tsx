import type { ReactElement, ReactNode } from "react"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/shared/ui/drawer"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"

/**
 * 무엇을 누르면 옆에 뜨는 것(호호코워크 AdaptivePopover). 데스크톱은 팝오버, 휴대폰은 반드시 바텀시트.
 * 내용은 같은 것을 쓰고, 휴대폰 시트에는 제목을 보인다(데스크톱 팝오버는 제목을 읽기용으로만 둔다).
 */
export function AdaptivePopover({ title, trigger, children, open, onOpenChange, align = "start", className }: {
  title: string
  trigger: ReactElement
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
        <DrawerTrigger render={trigger} />
        <DrawerContent>
          <DrawerHeader><DrawerTitle>{title}</DrawerTitle></DrawerHeader>
          <div className="px-3 pb-5">{children}</div>
        </DrawerContent>
      </Drawer>
    )
  }
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger render={trigger} />
      <PopoverContent align={align} aria-label={title} className={className ?? "w-64 p-1.5"}>{children}</PopoverContent>
    </Popover>
  )
}
