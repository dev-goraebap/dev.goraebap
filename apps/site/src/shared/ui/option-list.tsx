import type { ReactNode } from "react"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/shared/ui/command"

export type Option = { value: string; label: string; icon?: ReactNode; end?: ReactNode }

/**
 * 메뉴 안의 고를 것 목록(호호코워크 OptionList): 아이콘 · 이름 · 고른 표시. 데스크톱 32px 줄, 휴대폰 48px 줄에 15px 글자 · 20px 아이콘.
 * 필터 메뉴 · 필터 칩 · 양식의 속성 알약이 같이 쓴다. isSearchable이면 맨 위에 찾기 칸.
 */
export function OptionList({ label, options, chosen = [], isSearchable, onPick }: {
  label: string; options: Option[]; chosen?: readonly string[]; isSearchable?: boolean; onPick: (value: string) => void
}) {
  const isMobile = useIsMobile()
  return (
    <Command aria-label={label} className="p-0">
      {isSearchable && <CommandInput placeholder="이름으로 찾기" />}
      <CommandList className="max-h-80">
        <CommandEmpty>맞는 항목이 없습니다</CommandEmpty>
        <CommandGroup className="p-0 pt-1">
          {options.map(option => (
            <CommandItem key={option.value} value={`${option.label} ${option.value}`} data-checked={chosen.includes(option.value)}
              onSelect={() => onPick(option.value)}
              className={isMobile ? "min-h-12 gap-3 text-[0.9375rem] [&_svg:not([class*='size-'])]:size-5" : "min-h-8"}>
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
