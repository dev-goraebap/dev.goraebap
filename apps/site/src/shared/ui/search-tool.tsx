import { useRef, useState } from "react"
import { Button } from "@/shared/ui/button"
import { SearchIcon, XIcon } from "@/shared/ui/icon"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/shared/ui/input-group"
import { ToolDot } from "@/shared/ui/page"

/**
 * 툴바의 찾기(호호코워크 SearchTool): 필터 · 표시처럼 동그란 돋보기이고, 찾는 말이 걸려 있으면 귀퉁이에 점.
 * 누르면 그 자리가 찾기 칸이 된다. 닫기 버튼과 Esc로 접고(찾는 말은 남는다), 바깥을 눌러도 열어 둔다.
 */
export function SearchTool({ label, placeholder, value, onChange }: {
  label: string; placeholder?: string; value: string; onChange: (value: string) => void
}) {
  const [isOpen, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const close = () => {
    setOpen(false)
    requestAnimationFrame(() => trigger.current?.focus())
  }
  if (isOpen) {
    return (
      <div className="flex items-center gap-1">
        <InputGroup className="h-7 w-56 rounded-full max-md:h-11 max-md:w-[min(14rem,40vw)]">
          <InputGroupAddon><SearchIcon /></InputGroupAddon>
          <InputGroupInput type="search" aria-label={label} placeholder={placeholder} autoFocus value={value}
            onChange={event => onChange(event.target.value)}
            onKeyDown={event => {
              if (event.key !== "Escape") return
              event.preventDefault()
              close()
            }} />
          {value && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" aria-label="찾는 말 지우기" onClick={() => onChange("")}><XIcon /></InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
        <Button variant="ghost" size="icon" aria-label={`${label} 닫기`} title="찾기 칸 닫기" className="max-md:size-11" onClick={close}>
          <XIcon />
        </Button>
      </div>
    )
  }
  return (
    <Button ref={trigger} variant={value ? "view-active" : "tool"} size="icon" aria-label={value ? `${label}, 찾는 중` : label} title={label}
      className="relative max-md:size-11" onClick={() => setOpen(true)}>
      <SearchIcon chosen={Boolean(value)} />
      {value && <ToolDot label="찾는 중" />}
    </Button>
  )
}
