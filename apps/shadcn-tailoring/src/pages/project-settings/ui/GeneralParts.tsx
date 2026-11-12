import type { FormEvent, ReactNode } from "react"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer"
import { Spinner } from "@/shared/ui/spinner"

/*
 * 프로젝트 설정의 일반 · 워크플로 · 저장소 연동이 함께 쓰는 틀. 쪽은 ProjectSettingsFrame(Page) 안에 그려지므로
 * shared/ui/settings의 SettingsPage(자기 Page를 그림) 대신 그 안쪽 한 열만 같은 모양으로 둔다.
 */

/** 가운데 한 열(최대 720px): 맨 위에 제목과 한 줄 설명, 그 아래 SettingsSection들. */
export function SettingsBody({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <main className="flex justify-center px-4 py-10 max-md:py-6">
      <div className="flex w-full max-w-180 min-w-0 flex-col gap-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </header>
        {children}
      </div>
    </main>
  )
}

/**
 * 짧은 양식(호호코워크 FormDialog): 제목 · 설명 · 칸 · 취소와 제출. 데스크톱은 대화상자, 휴대폰은 바텀시트.
 * 제출은 양식 제출이라 Enter로도 된다. 제출하는 동안에는 닫히지 않는다. 열고 닫기는 부르는 쪽이 정한다.
 */
export function FormDialog({ open, onOpenChange, title, description, submitLabel, isSubmitDisabled, isPending, isDestructive, onSubmit, children }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  submitLabel: string
  isSubmitDisabled?: boolean
  isPending?: boolean
  isDestructive?: boolean
  onSubmit: () => void
  /** 칸. 없으면 묻는 말과 설명만 둔다(보관 확인처럼). */
  children?: ReactNode
}) {
  const isMobile = useIsMobile()
  const change = (next: boolean) => { if (!isPending) onOpenChange(next) }
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!isSubmitDisabled && !isPending) onSubmit()
  }
  const save = (
    <Button type="submit" variant={isDestructive ? "destructive" : "default"} disabled={isSubmitDisabled || isPending} className="max-md:h-11">
      {isPending && <Spinner data-icon="inline-start" />}
      {submitLabel}
    </Button>
  )
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={change}>
        <DrawerContent>
          <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
            <DrawerHeader className="text-left">
              <DrawerTitle>{title}</DrawerTitle>
              {description && <DrawerDescription>{description}</DrawerDescription>}
            </DrawerHeader>
            {children && <div className="flex min-h-0 flex-col gap-4 overflow-y-auto p-4">{children}</div>}
            <DrawerFooter className="flex-row pb-[calc(1rem+env(safe-area-inset-bottom))] *:flex-1">
              <DrawerClose render={<Button type="button" variant="ghost" className="h-11" />}>취소</DrawerClose>
              {save}
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    )
  }
  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent className="sm:max-w-110">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {children}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => change(false)}>취소</Button>
            {save}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
