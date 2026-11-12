import { Button } from "@/shared/ui/button"
import { MinusIcon, PlusIcon } from "@/shared/ui/icon"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

/** 'fit'은 칸 폭에 맞춘 배율(넓으면 100%), 숫자는 고정 배율(%). */
export type ZoomSetting = "fit" | number
const STEPS = [50, 75, 90, 100, 110, 125, 150, 200]

/**
 * 확대/축소: −, 배율 고르기(폭에 맞춤 · 단계), +. 폭에 맞춤일 때는 지금 실제 배율(current)만 짧게 보인다.
 * 페이지 보기에만 있다(휴대폰은 늘 페이지 없음이라 두지 않는다).
 */
export function ZoomControl({ value, current, onChange }: { value: ZoomSetting; current: number; onChange: (value: ZoomSetting) => void }) {
  const percent = Math.round(current * 100)
  const step = (direction: 1 | -1) => {
    const next = direction > 0 ? STEPS.find(each => each > percent) : [...STEPS].reverse().find(each => each < percent)
    if (next) onChange(next)
  }
  const items = [{ value: "fit", label: value === "fit" ? `${percent}%` : "폭에 맞춤" }, ...STEPS.map(each => ({ value: String(each), label: `${each}%` }))]
  return (
    <div role="group" aria-label="확대/축소" className="flex flex-none items-center gap-0.5">
      <Button variant="ghost" size="icon-sm" aria-label="축소" title="축소" className="text-icon-muted" disabled={percent <= STEPS[0]} onClick={() => step(-1)}><MinusIcon /></Button>
      <Select items={items} value={value === "fit" ? "fit" : String(value)} onValueChange={next => onChange(next === "fit" ? "fit" : Number(next))}>
        <SelectTrigger size="sm" aria-label="배율" className="min-w-18 border-transparent px-2 tabular-nums hover:bg-muted"><SelectValue /></SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {items.map(item => <SelectItem key={item.value} value={item.value} className="tabular-nums">{item.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button variant="ghost" size="icon-sm" aria-label="확대" title="확대" className="text-icon-muted" disabled={percent >= STEPS[STEPS.length - 1]} onClick={() => step(1)}><PlusIcon /></Button>
    </div>
  )
}
