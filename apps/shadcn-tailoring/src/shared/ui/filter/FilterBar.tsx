import { useState } from "react"
import { toggleValue } from "@/shared/lib/toggle"
import { Button } from "@/shared/ui/button"
import { PlusIcon, XIcon } from "@/shared/ui/icon"
import { OptionList } from "@/shared/ui/option-list"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"
import type { Filters } from "./use-filters"

/**
 * 데스크톱 툴바 아래 걸린 필터 줄(호호코워크 FilterBar, 40px): 필터마다 [이름 | 값 | ×] 칩, 아직 없는 필터를 더하는 +,
 * 걸린 것이 있으면 모두 지우기. 값 칸은 그 필터의 값을 연다. 한 번에 메뉴 하나만 열린다. 보이는 필터가 없으면 그리지 않는다.
 */
export function FilterBar<K extends string>({ filters }: { filters: Filters<K> }) {
  const [opened, setOpened] = useState<K | "+">()
  if (filters.shown.length === 0) return null
  const unused = filters.defs.filter(def => !filters.shown.includes(def.key))
  const openChange = (key: K | "+") => (isOpen: boolean) => setOpened(isOpen ? key : undefined)
  return (
    <div data-slot="filter-bar" className="flex h-10 shrink-0 items-center gap-1.5 overflow-x-auto border-b px-4 [scrollbar-width:none]">
      {filters.shown.map(key => {
        const def = filters.defOf(key)
        const names = filters.chosenNames(key)
        return (
          <div key={key} role="group" aria-label={`${def.label} 필터`}
            className="flex h-6 shrink-0 items-stretch divide-x divide-input overflow-hidden rounded-full border border-input bg-background text-xs">
            <span className="flex items-center gap-1 px-2 text-muted-foreground"><def.icon className="size-3.5" />{def.label}</span>
            <Popover open={opened === key} onOpenChange={openChange(key)}>
              <PopoverTrigger className="flex items-center gap-1 px-2 hover:bg-accent aria-expanded:bg-accent">
                {names.shown || <span className="text-muted-foreground">--</span>}
                {names.more > 0 && <span className="text-muted-foreground">+{names.more}</span>}
              </PopoverTrigger>
              <PopoverContent align="start" aria-label={`${def.label} 고르기`} className="w-65 p-1.5">
                <OptionList label={`${def.label} 고르기`} isSearchable={def.isSearchable} options={def.options} chosen={filters.state[key]}
                  onPick={value => filters.change(key, toggleValue(filters.state[key], value))} />
              </PopoverContent>
            </Popover>
            <button type="button" aria-label={`${def.label} 필터 지우기`} onClick={() => filters.remove(key)}
              className="flex items-center px-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
              <XIcon className="size-3.5" />
            </button>
          </div>
        )
      })}
      {unused.length > 0 && (
        <Popover open={opened === "+"} onOpenChange={openChange("+")}>
          <PopoverTrigger render={<Button variant="ghost" size="icon-xs" aria-label="필터 추가" />}>
            <PlusIcon />
          </PopoverTrigger>
          <PopoverContent align="start" aria-label="필터 추가" className="w-60 p-1.5">
            <OptionList label="필터 추가" isSearchable options={unused.map(def => ({ value: def.key, label: def.label, icon: <def.icon /> }))}
              onPick={key => { filters.show(key as K); setOpened(key as K) }} />
          </PopoverContent>
        </Popover>
      )}
      {filters.active.length > 0 && <Button variant="secondary" size="xs" className="rounded-full" onClick={filters.clear}>모두 지우기</Button>}
    </div>
  )
}

/** 휴대폰 툴바 아래 걸린 필터 칩(가로로 넘김). 칩을 누르면 시트가 그 필터에서 열리고, ×가 뗀다. */
export function FilterChips<K extends string>({ filters }: { filters: Filters<K> }) {
  if (filters.active.length === 0) return null
  return (
    <div data-slot="filter-chips" className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b px-4 py-2 [scrollbar-width:none]">
      {filters.active.map(key => {
        const def = filters.defOf(key)
        const names = filters.chosenNames(key)
        return (
          <div key={key} className="flex h-11 shrink-0 items-center rounded-full bg-secondary pl-3 text-sm">
            <button type="button" className="flex h-full items-center gap-1 px-1" onClick={() => filters.setMenu({ isOpen: true, step: key })}>
              <b className="font-semibold">{def.label}</b>
              {names.shown}
              {names.more > 0 && <span className="text-muted-foreground">+{names.more}</span>}
            </button>
            <Button variant="ghost" size="icon" aria-label={`${def.label} 필터 지우기`} className="size-11 rounded-full" onClick={() => filters.remove(key)}>
              <XIcon />
            </Button>
          </div>
        )
      })}
    </div>
  )
}
