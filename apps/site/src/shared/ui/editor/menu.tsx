import { useState, type ReactElement, type ReactNode } from "react"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/shared/ui/drawer"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent,
  DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { ArrowLeftIcon, CheckIcon, ChevronRightIcon } from "@/shared/ui/icon"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"
import { EDITOR_COLOR_VARS } from "./colors"

/**
 * 에디터의 떠 있는 메뉴(블록 손잡이 · 서식 도구 · 상단 막대 · 표 · 미디어 너비)가 함께 쓰는 틀. 메뉴는 항목 목록(MenuEntry)으로
 * 넘기고, 데스크톱은 드롭다운(하위 메뉴는 옆으로 펼친다), 휴대폰은 바텀시트(하위 메뉴는 시트 안에서 들어가고 뒤로 온다)로 그린다.
 * 화살표 · Home · End · 글자 찾기 · Esc는 Base UI 메뉴가 맡는다.
 *
 * 메뉴를 닫아도 초점을 여는 단추로 돌리지 않는다(finalFocus={false}). 항목은 대개 본문에 명령을 돌리며 chain().focus()로 본문에
 * 초점을 돌려 두는데, 메뉴가 그 뒤에 단추로 초점을 가져가면 이어서 친 글이 본문에 들어가지 않는다.
 */
export type MenuEntry =
  | { kind: "item"; label: string; icon?: ReactNode; hint?: string; isChecked?: boolean; isDanger?: boolean; isDisabled?: boolean; onSelect: () => void }
  | { kind: "title"; label: string }
  | { kind: "separator" }
  | { kind: "sub"; label: string; icon?: ReactNode; isDisabled?: boolean; entries: MenuEntry[] }

/** 맥에서는 ⌘, 그 밖에서는 Ctrl. 메뉴의 단축키 표기에 쓴다. */
export const MOD = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl"

/** 누를 때 본문의 선택이 풀리지 않게 한다(단추가 초점을 가져가지 않는다). */
export const keepSelection = (event: { preventDefault: () => void }) => event.preventDefault()

/** 메뉴 항목 줄 모양: 데스크톱 32px, 휴대폰 48px. 아이콘은 보조 아이콘 색. */
const ROW = "min-h-8 gap-2.5 px-2.5 py-1.5 text-[0.8125rem] [&_svg]:text-icon-muted max-md:min-h-12 max-md:text-sm"
const TITLE = "px-2.5 pt-2 pb-1 text-xs font-semibold text-muted-foreground"

function DesktopEntries({ entries }: { entries: MenuEntry[] }) {
  return entries.map((entry, index) => {
    if (entry.kind === "separator") return <DropdownMenuSeparator key={index} className="mx-1 my-1.5" />
    if (entry.kind === "title") return <div key={index} role="presentation" className={TITLE}>{entry.label}</div>
    if (entry.kind === "sub") {
      return (
        <DropdownMenuSub key={index}>
          <DropdownMenuSubTrigger disabled={entry.isDisabled} className={cn(ROW, "data-disabled:opacity-50")}>
            {entry.icon}<span className="min-w-0 flex-1 truncate">{entry.label}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent finalFocus={false} className={cn("max-h-[min(26rem,var(--available-height))] w-56 p-1.5", EDITOR_COLOR_VARS)}>
            <DesktopEntries entries={entry.entries} />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      )
    }
    return (
      <DropdownMenuItem key={index} disabled={entry.isDisabled} variant={entry.isDanger ? "destructive" : "default"} className={ROW} onClick={entry.onSelect}>
        {entry.icon}
        <span className="min-w-0 flex-1 truncate">{entry.label}</span>
        {entry.hint ? <DropdownMenuShortcut className="max-w-32 truncate tracking-normal">{entry.hint}</DropdownMenuShortcut> : null}
        {entry.isChecked ? <CheckIcon className="ml-auto" /> : null}
      </DropdownMenuItem>
    )
  })
}

/** 휴대폰 시트의 항목: 48px 단추 줄. 하위 메뉴는 그 목록으로 들어간다. */
function SheetEntries({ entries, onPick, onEnter }: { entries: MenuEntry[]; onPick: (entry: Extract<MenuEntry, { kind: "item" }>) => void; onEnter: (entry: Extract<MenuEntry, { kind: "sub" }>) => void }) {
  return entries.map((entry, index) => {
    if (entry.kind === "separator") return <div key={index} role="separator" className="mx-1 my-1.5 h-px bg-border" />
    if (entry.kind === "title") return <div key={index} className={TITLE}>{entry.label}</div>
    const isSub = entry.kind === "sub"
    return (
      <Button key={index} variant="ghost" disabled={entry.isDisabled} aria-pressed={!isSub && entry.isChecked ? true : undefined}
        className={cn("h-auto w-full justify-start rounded-lg font-normal", ROW, !isSub && entry.isDanger && "text-destructive [&_svg]:text-destructive")}
        onClick={() => isSub ? onEnter(entry) : onPick(entry)}>
        {entry.icon}
        <span className="min-w-0 flex-1 truncate text-left">{entry.label}</span>
        {isSub ? <ChevronRightIcon /> : entry.isChecked ? <CheckIcon /> : entry.hint ? <span className="text-xs text-muted-foreground">{entry.hint}</span> : null}
      </Button>
    )
  })
}

/**
 * 메뉴 하나. trigger가 여는 단추이고 open은 부르는 쪽이 쥔다(블록 손잡이처럼 누르기를 스스로 다루는 단추는 onOpenChange의 열기를
 * 무시하고 닫기만 받는다). side · align은 데스크톱 드롭다운의 자리다.
 */
export function EditorMenu({ label, trigger, entries, open, onOpenChange, side = "bottom", align = "start", className }: {
  /** 메뉴의 읽기용 이름이자 휴대폰 시트의 제목. */
  label: string
  trigger: ReactElement
  entries: MenuEntry[]
  open: boolean
  onOpenChange: (open: boolean) => void
  side?: "top" | "bottom" | "left" | "right"
  align?: "start" | "center" | "end"
  /** 데스크톱 드롭다운의 너비 등. */
  className?: string
}) {
  const isMobile = useIsMobile()
  const [inside, setInside] = useState<Extract<MenuEntry, { kind: "sub" }> | null>(null)
  if (isMobile) {
    const change = (next: boolean) => { if (!next) setInside(null); onOpenChange(next) }
    return (
      <Drawer open={open} onOpenChange={change}>
        <DrawerTrigger render={trigger} />
        <DrawerContent finalFocus={false} className={EDITOR_COLOR_VARS}>
          <DrawerHeader className="flex-row items-center gap-1 pb-1 text-left">
            {inside ? <Button variant="ghost" size="icon" aria-label="뒤로" className="-ml-2 size-11" onClick={() => setInside(null)}><ArrowLeftIcon /></Button> : null}
            <DrawerTitle>{inside?.label ?? label}</DrawerTitle>
          </DrawerHeader>
          <div role="menu" aria-label={inside?.label ?? label} className="flex min-h-0 flex-col gap-0.5 overflow-y-auto px-3 pt-2 pb-6">
            <SheetEntries entries={inside?.entries ?? entries} onEnter={setInside}
              onPick={entry => { change(false); entry.onSelect() }} />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }
  return (
    <DropdownMenu open={open} onOpenChange={next => onOpenChange(next)} modal={false}>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent side={side} align={align} finalFocus={false} aria-label={label}
        className={cn("max-h-[min(30rem,var(--available-height))] w-60 p-1.5", EDITOR_COLOR_VARS, className)}>
        <DesktopEntries entries={entries} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * 입력 칸이 있는 떠 있는 판(링크 입력). 데스크톱 팝오버, 휴대폰 바텀시트. 메뉴처럼 닫을 때 초점을 단추로 돌리지 않는다.
 */
export function EditorPopover({ label, trigger, open, onOpenChange, align = "start", className, children }: {
  label: string; trigger: ReactElement; open: boolean; onOpenChange: (open: boolean) => void; align?: "start" | "center" | "end"
  className?: string; children: ReactNode
}) {
  const isMobile = useIsMobile()
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger render={trigger} />
        <DrawerContent finalFocus={false}>
          <DrawerHeader className="pb-1 text-left"><DrawerTitle>{label}</DrawerTitle></DrawerHeader>
          <div className="flex min-h-0 flex-col gap-1 overflow-y-auto px-3 pt-2 pb-6">{children}</div>
        </DrawerContent>
      </Drawer>
    )
  }
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger render={trigger} />
      <PopoverContent align={align} finalFocus={false} aria-label={label} className={cn("w-88 max-w-[calc(100vw-1.5rem)] gap-1 p-1.5", className)}>{children}</PopoverContent>
    </Popover>
  )
}
