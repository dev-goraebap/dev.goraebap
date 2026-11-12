import { useState } from "react"
import type { Approver } from "@/entities/leave"
import { departmentOf, ME_ID, MemberAvatar, roleOf, useMembers, type Member } from "@/entities/member"
import { AdaptivePopover } from "@/shared/ui/adaptive-popover"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Card } from "@/shared/ui/card"
import { ArrowDownIcon, ArrowUpIcon, InfoIcon, PlusIcon, XIcon } from "@/shared/ui/icon"
import { OptionList } from "@/shared/ui/option-list"
import { MAX_APPROVERS } from "../model/new-request"

const ROW = "flex min-h-14 items-center gap-3 px-3 py-2"

/** 줄의 사람: 그림, 이름, 둘째 줄(신청 · N차 결재와 부서). */
function PersonLine({ member, fallback, note }: { member?: Member; fallback: Approver; note: string }) {
  return (
    <>
      {member ? <MemberAvatar member={member} className="size-8" /> : <span aria-hidden className="size-8 shrink-0 rounded-full bg-muted" />}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">{member?.name ?? fallback.name}</span>
        <span className="truncate text-xs text-muted-foreground">{note}</span>
      </span>
    </>
  )
}

/** 결재자 추가: 이름으로 찾는 구성원 목록(데스크톱 팝오버, 휴대폰 바텀시트). 나와 이미 넣은 사람은 빠진다. */
function AddApprover({ members, excluded, onPick }: { members: Member[]; excluded: readonly string[]; onPick: (person: Approver) => void }) {
  const [isOpen, setOpen] = useState(false)
  const options = members.filter(member => !excluded.includes(member.id)).map(member => ({
    value: member.id, label: member.name, icon: <MemberAvatar member={member} />,
    end: <span className="text-xs text-muted-foreground">{[departmentOf(member.departmentId)?.name, roleOf(member)].filter(Boolean).join(" · ")}</span>,
  }))
  return (
    <AdaptivePopover title="결재자 추가" open={isOpen} onOpenChange={setOpen} className="w-80 p-1.5"
      trigger={<Button variant="outline" className="self-start max-md:h-11"><PlusIcon data-icon="inline-start" />결재자 추가</Button>}>
      <OptionList label="결재자 고르기" options={options} isSearchable onPick={id => {
        const member = members.find(each => each.id === id)
        if (member) onPick({ id: member.id, name: member.name })
        setOpen(false)
      }} />
    </AdaptivePopover>
  )
}

/**
 * 둘째 단계(호호코워크 ApprovalStep · ApproverListEditor): 신청하는 나부터 결재 차례대로 결재자를 보이고, 차례를 위아래로 옮기거나
 * 빼고, 세 명까지 더한다. 조직의 결재선이 비어 있으면 결재 없이 승인된다고 알린다. 처음 결재선과 달라지면 결재자에게 그것이 보인다고 적는다.
 */
export function ApprovalStep({ line, onLineChange, isAutoApproved, isLoading, isChanged, error }: {
  line: Approver[]; onLineChange: (line: Approver[]) => void; isAutoApproved: boolean; isLoading: boolean; isChanged: boolean; error?: string
}) {
  const { data: members = [] } = useMembers()
  const me = members.find(member => member.id === ME_ID)
  const memberOf = (id: string) => members.find(member => member.id === id)
  const move = (index: number, by: number) => {
    const next = [...line]
    const [person] = next.splice(index, 1)
    next.splice(index + by, 0, person)
    onLineChange(next)
  }
  return (
    <section aria-label="결재선" className="flex flex-col gap-3">
      <h2 className="font-semibold">결재선</h2>
      {isLoading ? <p className="text-sm text-muted-foreground">결재선을 불러오는 중입니다.</p> : isAutoApproved ? (
        <Alert>
          <InfoIcon />
          <AlertTitle>결재 없이 바로 승인됩니다</AlertTitle>
          <AlertDescription>결재할 상급자가 없어 신청과 함께 승인되고 휴가에서 바로 빠집니다.</AlertDescription>
        </Alert>
      ) : (
        <>
          <Card className="gap-0 divide-y py-0">
            <div className={ROW}>
              <PersonLine member={me} fallback={{ id: ME_ID, name: "나" }} note="신청" />
            </div>
            {line.length > 0 && <ol aria-label="결재자 순서" className="divide-y">
              {line.map((person, index) => {
                const member = memberOf(person.id)
                const department = member && departmentOf(member.departmentId)?.name
                return (
                  <li key={person.id} className={ROW}>
                    <PersonLine member={member} fallback={person} note={`${index + 1}차 결재${department ? ` · ${department}` : ""}`} />
                    <span className="flex shrink-0 items-center gap-0.5">
                      <Button variant="ghost" size="icon-sm" aria-label={`${person.name} 차례 앞으로`} title="앞으로" disabled={index === 0} onClick={() => move(index, -1)}>
                        <ArrowUpIcon />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label={`${person.name} 차례 뒤로`} title="뒤로" disabled={index === line.length - 1} onClick={() => move(index, 1)}>
                        <ArrowDownIcon />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label={`${person.name} 빼기`} title="빼기" onClick={() => onLineChange(line.filter(each => each.id !== person.id))}>
                        <XIcon />
                      </Button>
                    </span>
                  </li>
                )
              })}
            </ol>}
          </Card>
          {line.length < MAX_APPROVERS
            ? <AddApprover members={members} excluded={[ME_ID, ...line.map(person => person.id)]} onPick={person => onLineChange([...line, person])} />
            : <p className="text-sm text-muted-foreground">결재자는 세 명까지 지정할 수 있습니다.</p>}
          {isChanged && <p className="text-sm text-muted-foreground">기본 결재선과 다르게 신청하면 결재자에게 &apos;결재선을 바꿔 신청&apos;과 기본 결재선이 함께 보입니다.</p>}
        </>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </section>
  )
}
