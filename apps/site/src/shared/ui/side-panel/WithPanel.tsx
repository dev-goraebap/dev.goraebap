import type { ReactNode } from "react"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { cn } from "cn"
import { Button } from "@/shared/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer"
import { XIcon } from "@/shared/ui/icon"

type WithPanelProps = {
  title?: string
  subtitle?: string
  /** 패널 내용(Facts 등). 없으면 목록만. */
  panel?: ReactNode
  /** 데스크톱 패널 폭(Tailwind 폭 클래스). 기본 26rem. */
  width?: string
  /** 패널 끝의 동작(자기 페이지로 · 수정). */
  footer?: ReactNode
  onClose: () => void
  /** 목록(Page). */
  children: ReactNode
}

/**
 * 목록 옆에서 줄 하나의 사실을 보는 패널(주소가 필요 없는 짧은 조회: 기록 · 로그 한 줄). 데스크톱은 오른쪽 패널(제목 · 부제 · 닫기),
 * 휴대폰은 아래에서 올라오는 바텀시트. 편집이나 긴 내용은 자기 주소를 가진 상세(DetailSurface · PeekPanel)로 연다.
 */
export function WithPanel({ title, subtitle, panel, width = "w-[26rem]", footer, onClose, children }: WithPanelProps) {
  const isMobile = useIsMobile()
  if (isMobile) {
    return (
      <>
        {children}
        <Drawer open={Boolean(panel)} onOpenChange={isOpen => { if (!isOpen) onClose() }}>
          <DrawerContent>
            <DrawerHeader className="gap-0.5 px-4 pt-4 pb-2 text-left">
              <DrawerTitle className="text-base font-semibold">{title ?? "자세히"}</DrawerTitle>
              {subtitle && <DrawerDescription>{subtitle}</DrawerDescription>}
            </DrawerHeader>
            <div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
              {panel}
              {footer}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    )
  }
  return (
    <div data-slot="with-panel" className="flex min-h-0 min-w-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      {panel && (
        <aside aria-label={title ?? "자세히"} className={cn("flex max-w-[50%] shrink-0 flex-col gap-4 overflow-y-auto border-l bg-background p-4", width)}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-col">
              <h2 className="text-sm font-semibold break-keep">{title}</h2>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            <Button variant="ghost" size="icon-sm" aria-label="닫기" title="닫기" onClick={onClose} className="-mt-1 -mr-1"><XIcon /></Button>
          </div>
          {panel}
          {footer}
        </aside>
      )}
    </div>
  )
}

/** 이름과 값의 사실 목록: 데스크톱은 두 열, 휴대폰은 이름 아래 값. 긴 값(주소 · 해시)은 어디서든 줄을 바꾼다. */
export function Facts({ facts }: { facts: [string, ReactNode][] }) {
  return (
    <dl className="m-0 grid grid-cols-1 gap-x-4 text-sm md:grid-cols-[max-content_minmax(0,1fr)] md:gap-y-2">
      {facts.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="m-0 min-w-0 wrap-anywhere max-md:mb-2">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
