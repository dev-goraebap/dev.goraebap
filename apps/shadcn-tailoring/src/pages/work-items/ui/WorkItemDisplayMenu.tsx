import { DisplayChoice, DisplayMenu } from "@/shared/ui/display-menu"
import { DIRECTIONS, GROUPS, INITIAL_DISPLAY, SORTS, type Display } from "../model/filters"

/** 업무의 표시: 정렬 기준, 기준에 맞는 말로 쓴 방향, 그룹. */
export function WorkItemDisplayMenu({ value, onChange }: { value: Display; onChange: (value: Display) => void }) {
  const isTweaked = value.sort !== INITIAL_DISPLAY.sort || value.direction !== INITIAL_DISPLAY.direction || value.group !== INITIAL_DISPLAY.group
  const [desc, asc] = DIRECTIONS[SORTS.find(sort => sort.value === value.sort)?.kind ?? "date"]
  return (
    <DisplayMenu isTweaked={isTweaked} onReset={() => onChange(INITIAL_DISPLAY)}>
      <DisplayChoice title="정렬 기준" items={SORTS} value={value.sort} onChange={sort => onChange({ ...value, sort })} />
      <DisplayChoice title="방향" items={[{ value: "desc", label: desc }, { value: "asc", label: asc }] as const} value={value.direction}
        onChange={direction => onChange({ ...value, direction })} />
      <DisplayChoice title="그룹" items={GROUPS} value={value.group} onChange={group => onChange({ ...value, group })} />
    </DisplayMenu>
  )
}
