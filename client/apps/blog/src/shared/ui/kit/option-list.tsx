import type { ReactNode } from "react"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/shared/ui/kit/command"

export type Option = { value: string; label: string; icon?: ReactNode; end?: ReactNode }

/**
 * 메뉴 안의 고를 것 목록: 아이콘 · 이름 · 고른 표시. 데스크톱 32px 줄, 휴대폰 48px 줄에 15px 글자 · 20px 아이콘.
 * 필터 메뉴 · 필터 칩 · 양식의 속성 알약이 같이 쓴다. isSearchable이면 맨 위에 찾기 칸.
 * 키보드 커서는 고른 것(여럿이면 첫 것)에서 시작한다. 맨 위 항목에서 시작하면 고른 것처럼 보인다.
 */
export function OptionList({ label, options, chosen = [], isSearchable, onPick }: {
  label: string; options: Option[]; chosen?: readonly string[]; isSearchable?: boolean; onPick: (value: string) => void
}) {
  const isMobile = useIsMobile()
  const start = options.find(option => chosen.includes(option.value))
  const itemValue = (option: Option) => `${option.label} ${option.value}`
  return (
    <Command aria-label={label} className="p-0" defaultValue={start ? itemValue(start) : undefined}>
      {isSearchable && <CommandInput placeholder="이름으로 찾기" />}
      <CommandList className="max-h-80">
        <CommandEmpty>맞는 항목이 없습니다</CommandEmpty>
        <CommandGroup className="p-0 pt-1">
          {options.map(option => (
            <CommandItem key={option.value} value={itemValue(option)} data-checked={chosen.includes(option.value)}
              onSelect={() => onPick(option.value)}
              className={isMobile ? "min-h-12 gap-3 text-[0.9375rem] [&_svg:not([class*='size-'])]:size-5" : "min-h-9"}>
              {option.icon}
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {option.end}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
