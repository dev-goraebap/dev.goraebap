import type { FormEvent, ReactNode } from "react"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer"
import { Spinner } from "@/shared/ui/spinner"

/**
 * 짧은 양식(호호코워크 FormDialog): 제목 · 설명 · 칸 · 취소와 제출. 데스크톱은 대화상자, 휴대폰은 바텀시트.
 * 제출은 양식 제출이라 Enter로도 된다. 제출하는 동안에는 닫히지 않는다. 열고 닫기는 부르는 쪽이 정한다.
 * 칸 없이 묻는 말만 둘 수도 있다(보관 확인). 되돌릴 수 없는 삭제의 확인은 ConfirmDialog를 쓴다.
 */
export function FormDialog({ open, onOpenChange, title, description, submitLabel = "저장", isSubmitDisabled, isPending, isDestructive, onSubmit, children }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  /** 제출 단추의 글. 기본은 저장. */
  submitLabel?: string
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
