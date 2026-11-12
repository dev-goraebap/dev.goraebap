import { DisplayChoice, DisplayMenu } from "@/shared/ui/display-menu"
import { DIRECTIONS, INITIAL_DISPLAY, SORTS, type Display } from "../model/list"

/** 공지의 표시: 정렬(게시일 · 제목)과 방향. 정렬을 바꾸면 그 정렬의 자연스러운 방향(게시일은 최신, 제목은 가나다)으로 둔다. */
export function AnnouncementDisplayMenu({ value, onChange }: { value: Display; onChange: (value: Display) => void }) {
  const isTweaked = value.sort !== INITIAL_DISPLAY.sort || value.direction !== INITIAL_DISPLAY.direction
  return (
    <DisplayMenu isTweaked={isTweaked} onReset={() => onChange(INITIAL_DISPLAY)}>
      <DisplayChoice title="정렬" items={SORTS} value={value.sort}
        onChange={sort => onChange({ sort, direction: DIRECTIONS[sort][0].value })} />
      <DisplayChoice title="방향" items={DIRECTIONS[value.sort]} value={value.direction} onChange={direction => onChange({ ...value, direction })} />
    </DisplayMenu>
  )
}
