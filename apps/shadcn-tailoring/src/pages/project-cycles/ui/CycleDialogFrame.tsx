import type { FormEvent, ReactNode } from "react"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer"

/**
 * 사이클 양식의 틀(호호코워크 FormDialog): 제목 · 설명 · 칸 · 취소와 확인. 데스크톱은 대화상자, 휴대폰은 바텀시트.
 * 확인은 양식 제출이라 Enter로도 된다.
 */
export function CycleDialogFrame({ open, onOpenChange, title, description, submitLabel, isSubmitDisabled, onSubmit, children }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string
  submitLabel: string; isSubmitDisabled?: boolean; onSubmit: () => void; children: ReactNode
}) {
  const isMobile = useIsMobile()
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!isSubmitDisabled) onSubmit()
  }
  const confirm = <Button type="submit" disabled={isSubmitDisabled}>{submitLabel}</Button>
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
            <DrawerHeader className="text-left">
              <DrawerTitle>{title}</DrawerTitle>
              {description && <DrawerDescription>{description}</DrawerDescription>}
            </DrawerHeader>
            <div className="flex min-h-0 flex-col gap-4 overflow-y-auto p-4">{children}</div>
            <DrawerFooter className="flex-row justify-end pb-[calc(1rem+env(safe-area-inset-bottom))] *:h-11 *:flex-1">
              <DrawerClose render={<Button type="button" variant="ghost" />}>취소</DrawerClose>
              {confirm}
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    )
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {children}
          {/* 호호코워크 대화상자는 푸터 위 구분선 · 띠를 두지 않는다. */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>취소</Button>
            {confirm}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
