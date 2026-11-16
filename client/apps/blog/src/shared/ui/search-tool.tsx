import { useRef, useState } from "react"
import { Button } from "@/shared/ui/button"
import { SearchIcon, XIcon } from "@/shared/ui/icon"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/shared/ui/input-group"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { usePhoneTool, usePhoneTools } from "@/shared/ui/layout/phone-tools"
import { ToolDot } from "@/shared/ui/tool-dot"

/**
 * 툴바의 찾기: 필터 · 표시처럼 동그란 돋보기이고, 찾는 말이 걸려 있으면 귀퉁이에 점.
 * 누르면 그 자리가 찾기 칸이 된다. 닫기 버튼과 Esc로 접고(찾는 말은 남는다), 바깥을 눌러도 열어 둔다.
 */
export function SearchTool({ label, placeholder, value, onChange }: {
  label: string; placeholder?: string; value: string; onChange: (value: string) => void
}) {
  const [isOpen, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  // 휴대폰 목록: 돋보기는 … 메뉴의 '찾기'가 되고, 고르면 이 자리에 찾기 칸이 열린다.
  // 두 훅을 늘 부른다(&&로 묶으면 화면 폭이 바뀔 때 훅의 순서가 달라진다).
  const isMobile = useIsMobile()
  const phoneTools = usePhoneTools()
  const isPhoneTool = isMobile && !!phoneTools
  usePhoneTool(isPhoneTool ? { id: "search", label: value ? `${label} · 찾는 중` : label, icon: SearchIcon, isOn: Boolean(value), order: 1, onSelect: () => setOpen(true) } : undefined)
  const close = () => {
    setOpen(false)
    requestAnimationFrame(() => trigger.current?.focus())
  }
  if (isOpen) {
    return (
      <div className="flex items-center gap-1 max-md:flex-1">
        <InputGroup className="h-7 w-56 rounded-full max-md:h-11 max-md:w-auto max-md:flex-1">
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
  if (isPhoneTool) return null
  return (
    <Button ref={trigger} variant={value ? "view-active" : "tool"} size="icon" aria-label={value ? `${label}, 찾는 중` : label} title={label}
      className="relative max-md:size-11" onClick={() => setOpen(true)}>
      <SearchIcon chosen={Boolean(value)} />
      {value && <ToolDot label="찾는 중" />}
    </Button>
  )
}
