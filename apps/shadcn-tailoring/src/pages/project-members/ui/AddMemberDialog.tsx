import { useState } from "react"
import { MemberAvatar, roleOf, type Member } from "@/entities/member"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer"
import { OptionList } from "@/shared/ui/option-list"
import { Spinner } from "@/shared/ui/spinner"

/**
 * 멤버 추가(호호코워크 AddMemberDialog): 재직 중이고 아직 이 프로젝트에 없는 구성원 하나를 이름으로 찾아 고른다.
 * 데스크톱은 대화상자, 휴대폰은 바텀시트. 추가하는 동안에는 닫히지 않는다.
 */
export function AddMemberDialog({ open, onOpenChange, people, isPending, onAdd }: {
  open: boolean; onOpenChange: (open: boolean) => void; people: Member[]; isPending: boolean; onAdd: (memberId: string) => void
}) {
  const isMobile = useIsMobile()
  const [chosen, setChosen] = useState<string>()
  const change = (next: boolean) => {
    if (isPending) return
    if (!next) setChosen(undefined)
    onOpenChange(next)
  }
  const title = "멤버 추가"
  const description = "재직 중인 구성원 중에서 고릅니다."
  const body = people.length === 0
    ? <p className="text-sm text-muted-foreground">더할 사람이 없습니다. 재직 중인 구성원이 모두 이 프로젝트에 있습니다.</p>
    : (
      <div className="rounded-lg border p-1">
        <OptionList label="구성원" isSearchable chosen={chosen ? [chosen] : []} onPick={setChosen}
          options={people.map(person => ({
            value: person.id, label: `${person.name} · ${roleOf(person)}`,
            icon: <MemberAvatar member={person} className={isMobile ? "size-7" : "size-5"} />,
          }))} />
      </div>
    )
  const add = (
    <Button disabled={!chosen || isPending} className="max-md:h-11" onClick={() => chosen && onAdd(chosen)}>
      {isPending && <Spinner data-icon="inline-start" />}추가
    </Button>
  )
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={change}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 overflow-y-auto px-4">{body}</div>
          <DrawerFooter className="flex-row pb-[calc(1rem+env(safe-area-inset-bottom))] *:flex-1">
            <DrawerClose render={<Button variant="ghost" className="h-11" />}>취소</DrawerClose>
            {add}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }
  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent className="sm:max-w-110">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {body}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => change(false)}>취소</Button>
          {add}
        </div>
      </DialogContent>
    </Dialog>
  )
}
