import type { ReactNode } from "react"
import { useIsMobile } from "@/shared/lib/use-mobile"
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/shared/ui/alert-dialog"
import { Button } from "@/shared/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer"
import { Spinner } from "@/shared/ui/spinner"

export type ConfirmAction = {
  label: string
  onAction: () => void
  isPending?: boolean
  /** destructive(기본): 지우기 · 버리기처럼 되돌릴 수 없는 일. default: 승인 · 제출처럼 무겁지만 파괴하지 않는 일. */
  variant?: "destructive" | "default"
}

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 묻는 말: "WEB-14 업무를 지울까요?" */
  title: string
  /** 하면 벌어지는 일, 막을 때는 그 까닭. */
  description: ReactNode
  /** 되돌릴 수 없는 동작(삭제). 없으면 막는 확인이다: 까닭과 '확인'만 둔다. */
  action?: ConfirmAction
  /** 취소 단추의 이름(기본 "취소", 동작이 없으면 "확인"): "계속 쓰기"처럼 머무는 쪽을 말할 때. */
  cancelLabel?: string
}

function ActionButton({ action, className }: { action: ConfirmAction; className?: string }) {
  return (
    <Button variant={action.variant ?? "destructive"} className={className} disabled={action.isPending} onClick={action.onAction}>
      {action.isPending && <Spinner data-icon="inline-start" />}
      {action.label}
    </Button>
  )
}

/**
 * 되돌릴 수 없는 일의 확인(호호코워크 AlertDialog). 데스크톱은 가운데 확인 창(취소 · 동작), 휴대폰은 바텀시트(동작이 위, 취소가 아래).
 * 삭제는 묻는 말 · 벌어지는 일 · 취소와 '삭제'를, 삭제를 막을 때는 까닭과 '확인'만 둔다. 승인처럼 파괴하지 않는 동작은
 * action.variant "default"로 기본 색 단추를 둔다. 동작하는 동안에는 닫히지 않는다.
 * 동작이 끝난 뒤 닫기(또는 떠나기)는 부르는 쪽이 정한다.
 */
export function ConfirmDialog({ open, onOpenChange, title, description, action, cancelLabel }: ConfirmDialogProps) {
  const isMobile = useIsMobile()
  const cancel = cancelLabel ?? (action ? "취소" : "확인")
  const change = (next: boolean) => { if (!action?.isPending) onOpenChange(next) }
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={change}>
        <DrawerContent role="alertdialog">
          <DrawerHeader className="gap-1.5 pb-2">
            <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>
            <DrawerDescription className="text-base">{description}</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter className="pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] *:min-w-22">
            {action && <ActionButton action={action} className="h-11" />}
            <DrawerClose render={<Button variant={action ? "ghost" : "default"} className="h-11" />}>{cancel}</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }
  return (
    <AlertDialog open={open} onOpenChange={change}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant={action ? "ghost" : "default"}>{cancel}</AlertDialogCancel>
          {action && <ActionButton action={action} />}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
