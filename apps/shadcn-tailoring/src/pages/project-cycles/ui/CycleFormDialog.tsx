import { useState } from "react"
import { addDays, today, useSaveCycle, type Cycle } from "@/entities/cycle"
import { DatePicker } from "@/shared/ui/date-picker"
import { Field, FieldError, FieldLabel } from "@/shared/ui/field"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { toast } from "@/shared/ui/toast"
import { FormDialog } from "@/shared/ui/form-dialog"

/**
 * 새 사이클 · 사이클 편집: 이름 · 시작일 · 종료일 · 목표. 새 사이클은 마지막 사이클 다음 날부터 2주,
 * 이름은 다음 차례(7차 사이클)로 채워 둔다. 저장하면 캐시에 넣고 알린다.
 */
export function CycleFormDialog({ projectKey, cycle, cycles, open, onOpenChange }: {
  projectKey: string; cycle?: Cycle; cycles: Cycle[]; open: boolean; onOpenChange: (open: boolean) => void
}) {
  const last = cycles.at(-1)?.endDate
  const start = cycle?.startDate ?? (last ? addDays(last, 1) : today())
  const number = Math.max(0, ...cycles.map(each => each.number)) + 1
  const [name, setName] = useState(cycle?.name ?? `${number}차 사이클`)
  const [goal, setGoal] = useState(cycle?.goal ?? "")
  const [from, setFrom] = useState(start)
  const [to, setTo] = useState(cycle?.endDate ?? addDays(start, 13))
  const save = useSaveCycle(projectKey)
  const isRangeWrong = from > to
  const submit = () => save.mutate(
    { id: cycle?.id, input: { name: name.trim(), goal: goal.trim() || undefined, startDate: from, endDate: to } },
    {
      onSuccess: () => {
        toast.add({ type: "success", title: cycle ? "사이클을 고쳤습니다" : "사이클을 만들었습니다", description: name.trim() })
        onOpenChange(false)
      },
      onError: error => toast.add({ type: "error", title: "저장하지 못했습니다", description: error.message }),
    },
  )
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={cycle ? "사이클 편집" : "새 사이클"} submitLabel="저장"
      isSubmitDisabled={!name.trim() || isRangeWrong || save.isPending} onSubmit={submit}>
      <Field>
        <FieldLabel htmlFor="cycle-name">이름</FieldLabel>
        <Input id="cycle-name" autoFocus autoComplete="off" placeholder="예: 11월 2주차" value={name} onChange={event => setName(event.target.value)} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="cycle-from">시작일</FieldLabel>
          <DatePicker id="cycle-from" label="시작일" value={from} onChange={setFrom} />
        </Field>
        <Field data-invalid={isRangeWrong || undefined}>
          <FieldLabel htmlFor="cycle-to">종료일</FieldLabel>
          <DatePicker id="cycle-to" label="종료일" value={to} onChange={setTo} />
          {isRangeWrong && <FieldError>종료일은 시작일보다 늦어야 합니다.</FieldError>}
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor="cycle-goal">목표</FieldLabel>
        <Textarea id="cycle-goal" rows={3} maxLength={500} placeholder="이 사이클에서 끝낼 것 (선택)" value={goal} onChange={event => setGoal(event.target.value)} />
      </Field>
    </FormDialog>
  )
}
