import { useState } from "react"
import { MemberAvatar, roleOf, type Member } from "@/entities/member"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { FormDialog } from "@/shared/ui/form-dialog"
import { OptionList } from "@/shared/ui/option-list"

/**
 * 멤버 추가(호호코워크 AddMemberDialog): 재직 중이고 아직 이 프로젝트에 없는 구성원 하나를 이름으로 찾아 고른다.
 * 데스크톱은 대화상자, 휴대폰은 바텀시트(FormDialog). 추가하는 동안에는 닫히지 않는다.
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
  return (
    <FormDialog open={open} onOpenChange={change} title="멤버 추가" description="재직 중인 구성원 중에서 고릅니다." submitLabel="추가"
      isSubmitDisabled={!chosen} isPending={isPending} onSubmit={() => chosen && onAdd(chosen)}>
      {body}
    </FormDialog>
  )
}
