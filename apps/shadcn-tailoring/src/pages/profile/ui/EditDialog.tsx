import type { FormEvent, ReactNode } from "react"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer"

/**
 * 짧은 고치기 양식의 틀(호호코워크 FormDialog): 제목 · 설명 · 칸 · 취소와 저장. 데스크톱은 대화상자, 휴대폰은 바텀시트.
 * 저장은 양식 제출이라 Enter로도 저장한다.
 */
export function EditDialog({ open, onOpenChange, title, description, submitLabel = "저장", isSubmitDisabled, onSubmit, children }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string
  submitLabel?: string; isSubmitDisabled?: boolean; onSubmit: () => void; children: ReactNode
}) {
  const isMobile = useIsMobile()
  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit()
  }
  const cancel = <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>취소</Button>
  const save = <Button type="submit" disabled={isSubmitDisabled}>{submitLabel}</Button>
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
            <DrawerHeader className="text-left">
              <DrawerTitle>{title}</DrawerTitle>
              {description && <DrawerDescription>{description}</DrawerDescription>}
            </DrawerHeader>
            <div className="min-h-0 overflow-y-auto p-4">{children}</div>
            <DrawerFooter className="flex-row justify-end *:flex-1">
              <DrawerClose render={<Button type="button" variant="ghost" />}>취소</DrawerClose>
              {save}
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
          <div className="flex justify-end gap-2">{cancel}{save}</div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
