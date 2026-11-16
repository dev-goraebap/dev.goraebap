import { toggleValue } from "@/shared/lib/toggle"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { AdaptivePopover } from "@/shared/ui/adaptive-popover"
import { Button } from "@/shared/ui/button"
import { ArrowLeftIcon, ChevronRightIcon, ListFilterIcon } from "@/shared/ui/icon"
import { OptionList } from "@/shared/ui/option-list"
import { createPortal } from "react-dom"
import { usePhoneTool, usePhoneTools } from "@/shared/ui/layout/phone-tools"
import { ToolDot } from "@/shared/ui/tool-dot"
import type { Filters } from "./use-filters"

/**
 * 필터 도구: 동그란 버튼이 필터 목록을 먼저 열고, 고르면 그 필터의 값으로 바뀐다.
 * 머리의 ← 가 목록으로 돌아간다. 데스크톱은 팝오버, 휴대폰은 바텀시트(목록마다 고른 값 요약과 >, 아래 완료).
 * 필터가 걸려 있으면 귀퉁이에 점이 있고 아이콘은 Bold Duotone이다.
 */
export function FilterMenu<K extends string>({ filters }: { filters: Filters<K> }) {
  const isMobile = useIsMobile()
  const { menu, setMenu, state, active } = filters
  const isOn = menu.isOpen || active.length > 0
  const step = menu.step ? filters.defOf(menu.step) : undefined
  // 휴대폰 목록: 보기 탭이 있으면 고른 탭 알약 안(구분선 뒤)에, 없으면 … 메뉴의 '필터'가 된다.
  const phone = usePhoneTools()
  const isPhoneTool = isMobile && !!phone
  const slot = isPhoneTool ? phone.viewSlot : null
  usePhoneTool(isPhoneTool && !slot ? { id: "filter", label: active.length > 0 ? `필터 · ${active.length}개` : "필터", icon: ListFilterIcon, isOn: active.length > 0, order: 2,
    onSelect: () => setMenu({ isOpen: true }) } : undefined)
  const open = (key: K) => {
    setMenu({ isOpen: true, step: key })
    if (!isMobile) filters.show(key)
  }
  const done = (
    <div className="flex justify-end pt-3">
      {/* 휴대폰의 짧은 실행 단추는 44px 높이에 88px 이상 너비(spacing.md). */}
      <Button variant="secondary" size="lg" className="h-11 min-w-22 rounded-full px-5" onClick={() => setMenu({ isOpen: false })}>완료</Button>
    </div>
  )
  const label = active.length > 0 ? `필터, ${active.length}개 적용 중` : "필터"
  const sheet = (
    <AdaptivePopover title="필터" align="end" className="w-65 p-1.5"
      open={menu.isOpen} onOpenChange={isOpen => setMenu({ isOpen })}
      trigger={slot
        ? <button type="button" aria-label={label} className="relative grid size-8 place-items-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
          <ListFilterIcon chosen={isOn} className="size-5" />
          {active.length > 0 && <ToolDot label="필터 적용 중" />}
        </button>
        : isPhoneTool ? undefined :
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
  return slot ? createPortal(sheet, slot) : sheet
}
