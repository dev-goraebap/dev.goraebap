import { useState } from "react"
import { AdaptivePopover } from "@/shared/ui/adaptive-popover"
import { Button } from "@/shared/ui/button"
import { LayoutGridIcon } from "@/shared/ui/icon"
import { SegmentedControl } from "@/shared/ui/segmented-control"
import type { PageLook } from "./model"

const STYLE_HINTS: Record<PageLook["style"], string> = {
  tinted: "페이지 바깥을 테마에 맞춰 옅게 다른 색으로 두어 페이지를 가릅니다.",
  divider: "같은 바탕에 페이지 사이에만 가로선을 둡니다.",
}

/** 페이지 모양 고르기: 보기 전환 옆의 단추와 그 아래 칸(휴대폰은 바텀시트). 편집과 읽기가 함께 쓴다. */
export function PageLookMenu({ value, onChange }: { value: PageLook; onChange: (look: PageLook) => void }) {
  const [isOpen, setOpen] = useState(false)
  return (
    <AdaptivePopover title="페이지 모양" align="end" className="w-72 p-3" open={isOpen} onOpenChange={setOpen}
      trigger={<Button variant="ghost" size="icon-sm" aria-label="페이지 모양" aria-pressed={isOpen} className="text-icon-muted aria-pressed:bg-pressed max-md:size-11">
        <LayoutGridIcon chosen={isOpen} />
      </Button>}>
      <div className="flex flex-col gap-3">
        <SegmentedControl label="모양" value={value.style} onChange={style => onChange({ ...value, style })} className="w-full"
          options={[{ value: "tinted", label: "연한 바탕" }, { value: "divider", label: "구분선" }]} />
        <p className="text-xs text-muted-foreground">{STYLE_HINTS[value.style]}</p>
        {value.style === "divider" ? (
          <SegmentedControl label="선 모양" value={value.line} onChange={line => onChange({ ...value, line })} className="w-full"
            options={[{ value: "solid", label: "실선" }, { value: "dashed", label: "점선" }, { value: "dotted", label: "점" }, { value: "wavy", label: "물결" }]} />
        ) : null}
      </div>
    </AdaptivePopover>
  )
}
