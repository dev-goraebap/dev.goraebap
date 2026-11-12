import { useState } from "react"
import { cycleDays, useCompleteCycle, type Cycle } from "@/entities/cycle"
import { toast } from "@/shared/ui/toast"
import { FormDialog } from "@/shared/ui/form-dialog"

const NONE = "none"

/** 고를 것 한 줄. 진짜 radio를 숨겨 두어 화살표 키 · Space가 브라우저 그대로 동작한다. */
function Choice({ value, chosen, label, description, onChoose }: {
  value: string; chosen: string; label: string; description: string; onChoose: (value: string) => void
}) {
  return (
    <label className="flex cursor-pointer flex-col gap-0.5 rounded-lg border px-3 py-2.5 text-sm has-checked:border-primary has-checked:bg-accent has-focus-visible:ring-3 has-focus-visible:ring-ring/50 max-md:min-h-12">
      <input type="radio" name="cycle-move-to" value={value} checked={chosen === value} onChange={() => onChoose(value)} className="sr-only" />
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">{description}</span>
    </label>
  )
}

/**
 * 사이클 마치기(호호코워크 FinishDialog): 끝내지 못한 업무가 있으면 옮길 사이클(마치지 않은 다른 사이클)이나 '사이클 없음'을 고른다.
 * 처음 고른 것은 이 사이클 다음의 사이클이다.
 */
export function FinishCycleDialog({ projectKey, cycle, cycles, unfinished, open, onOpenChange }: {
  projectKey: string; cycle: Cycle; cycles: Cycle[]; unfinished: string[]; open: boolean; onOpenChange: (open: boolean) => void
}) {
  const targets = cycles.filter(other => other.id !== cycle.id && !other.completedAt)
  const [target, setTarget] = useState((targets.find(other => other.startDate > cycle.startDate) ?? targets[0])?.id ?? NONE)
  const finish = useCompleteCycle(projectKey)
  const left = unfinished.length
  const submit = () => {
    const moveTo = target === NONE ? undefined : target
    finish.mutate({ id: cycle.id, unfinished, moveTo }, {
      onSuccess: ({ moved }) => {
        const to = targets.find(other => other.id === moveTo)
        toast.add({
          type: "success", title: "사이클을 마쳤습니다",
          description: moved && to ? `${cycle.name} · 남은 업무 ${moved}건을 ${to.name}로 옮겼습니다.` : left ? `${cycle.name} · 남은 업무 ${left}건을 사이클에서 뺐습니다.` : cycle.name,
        })
        onOpenChange(false)
      },
    })
  }
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={`'${cycle.name}' 마치기`} submitLabel="마치기"
      description={left > 0 ? `끝내지 못한 업무 ${left}건을 어디로 옮길까요?` : "끝내지 못한 업무가 없습니다."}
      isSubmitDisabled={finish.isPending} onSubmit={submit}>
      {left > 0 && (
        <div role="radiogroup" aria-label="옮길 사이클" className="flex flex-col gap-2">
          {targets.map(other => (
            <Choice key={other.id} value={other.id} chosen={target} label={other.name} description={cycleDays(other)} onChoose={setTarget} />
          ))}
          <Choice value={NONE} chosen={target} label="사이클 없음" description="백로그처럼 어느 사이클에도 넣지 않습니다." onChoose={setTarget} />
        </div>
      )}
    </FormDialog>
  )
}
