import { toggleValue } from "@/shared/lib/toggle"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { AdaptivePopover } from "@/shared/ui/adaptive-popover"
import { Button } from "@/shared/ui/button"
import { ArrowLeftIcon, ChevronRightIcon, ListFilterIcon } from "@/shared/ui/icon"
import { OptionList } from "@/shared/ui/option-list"
import { ToolDot } from "@/shared/ui/page"
import type { Filters } from "./use-filters"

/**
 * 필터 도구(호호코워크 FilterMenu · FilterSheet): 동그란 버튼이 필터 목록을 먼저 열고, 고르면 그 필터의 값으로 바뀐다.
 * 머리의 ← 가 목록으로 돌아간다. 데스크톱은 팝오버, 휴대폰은 바텀시트(목록마다 고른 값 요약과 >, 아래 완료).
 * 필터가 걸려 있으면 귀퉁이에 점이 있고 아이콘은 Bold Duotone이다.
 */
export function FilterMenu<K extends string>({ filters }: { filters: Filters<K> }) {
  const isMobile = useIsMobile()
  const { menu, setMenu, state, active } = filters
  const isOn = menu.isOpen || active.length > 0
  const step = menu.step ? filters.defOf(menu.step) : undefined
  const open = (key: K) => {
    setMenu({ isOpen: true, step: key })
    if (!isMobile) filters.show(key)
  }
  const done = (
    <div className="flex justify-end pt-3">
      <Button variant="secondary" size="lg" className="rounded-full px-5" onClick={() => setMenu({ isOpen: false })}>완료</Button>
    </div>
  )
  return (
    <AdaptivePopover title="필터" align="end" className="w-65 p-1.5"
      open={menu.isOpen} onOpenChange={isOpen => setMenu({ isOpen })}
      trigger={
        <Button variant={isOn ? "view-active" : "tool"} size="icon" aria-label={active.length > 0 ? `필터, ${active.length}개 적용 중` : "필터"}
          className="relative max-md:size-11">
          <ListFilterIcon chosen={isOn} />
          {active.length > 0 && <ToolDot label="필터 적용 중" />}
        </Button>
      }>
      {step ? (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 border-b px-1 pb-2 font-semibold">
            <Button variant="ghost" size="icon-sm" aria-label="필터 목록으로" onClick={() => setMenu({ isOpen: true })}>
              <ArrowLeftIcon />
            </Button>
            <step.icon className="shrink-0" />
            {step.label}
          </div>
          <OptionList label={`${step.label} 고르기`} isSearchable={step.isSearchable} options={step.options} chosen={state[step.key]}
            onPick={value => filters.change(step.key, toggleValue(state[step.key], value))} />
          {isMobile && done}
        </div>
      ) : (
        <div className="flex flex-col">
          <OptionList label="필터" isSearchable={!isMobile} chosen={isMobile ? [] : active}
            options={filters.defs.map(def => {
              const names = filters.chosenNames(def.key)
              return {
                value: def.key, label: def.label, icon: <def.icon />,
                end: isMobile ? (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    {names.shown || "전체"}{names.more > 0 && ` +${names.more}`}
                    <ChevronRightIcon />
                  </span>
                ) : undefined,
              }
            })}
            onPick={key => open(key as K)} />
          {isMobile && done}
        </div>
      )}
    </AdaptivePopover>
  )
}
