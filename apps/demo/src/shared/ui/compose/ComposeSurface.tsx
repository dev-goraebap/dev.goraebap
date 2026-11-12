import type { KeyboardEvent, ReactNode } from "react"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/shared/ui/dialog"
import { MaximizeIcon, XIcon } from "@/shared/ui/icon"
import { Page, type Crumb } from "@/shared/ui/page"
import { Spinner } from "@/shared/ui/spinner"
import { Switch } from "@/shared/ui/switch"

export type ComposeSubmit = { label: string; onSubmit: () => void; isDisabled?: boolean; isPending?: boolean }

type ComposeSurfaceProps = {
  /** dialog: 목록 위 대화상자(데스크톱에서 목록의 버튼으로 열 때). page: 자기 페이지(링크 · 새로고침 · 크게 보기). 휴대폰은 늘 페이지. */
  surface: "dialog" | "page"
  /** 페이지의 경로. 마지막 단계가 양식의 이름(새 업무)이다. */
  crumbs: Crumb[]
  /** 놓일 곳(프로젝트 칩). 대화상자는 머리에, 페이지는 양식 위에. */
  chip?: ReactNode
  /** 속성 알약. 데스크톱은 양식 아래, 휴대폰은 바닥 줄 바로 위에 고정한다. */
  pills?: ReactNode
  submit: ComposeSubmit
  /** 바닥 줄 앞쪽의 다른 동작(이전 · 임시 저장). 휴대폰은 취소 앞에 둔다. */
  actions?: ReactNode
  /** 만들 수 없는 까닭이나 실패. 바닥 줄에서 만들기 옆(휴대폰은 바닥 줄 위)에 두어 어느 자리에서든 같은 곳에서 읽힌다. */
  error?: string
  /** 계속 만들기: 만든 뒤 제목과 본문만 비우고 속성은 남겨 다음 것을 쓴다. */
  isContinuing?: boolean
  onContinuing?: (isContinuing: boolean) => void
  onClose: () => void
  /** 크게 보기: 같은 양식을 자기 페이지로. 대화상자에만 있다. */
  onExpand?: () => void
  /** 제목과 본문(ComposeFields). */
  children: ReactNode
}

/**
 * 만들기 양식이 놓이는 곳(호호코워크 ComposeSurface). 데스크톱 대화상자는 화면 위 12%에서 가운데로 뜨고(최대 45rem)
 * 머리에 놓일 곳 칩 · 이름 · 크게 보기 · 닫기, 바닥에 계속 만들기 · 만들기. 데스크톱 페이지는 45rem 단에 같은 양식과
 * 취소. 휴대폰은 늘 전체 화면 페이지: 앱 바 ←, 스크롤하는 양식, 고정한 알약 줄, 취소 · 만들기 바닥 줄(만들기가 남은 폭을 채운다).
 * 바닥 줄의 앞쪽에는 다른 동작(actions), 그 뒤에 까닭(error)을 둔다. Ctrl/⌘+Enter가 만들기를 누른다.
 */
export function ComposeSurface(props: ComposeSurfaceProps) {
  const isMobile = useIsMobile()
  const { submit } = props
  const press = (event: KeyboardEvent) => {
    if (event.key !== "Enter" || !(event.ctrlKey || event.metaKey) || event.nativeEvent.isComposing) return
    event.preventDefault()
    if (!submit.isDisabled && !submit.isPending) submit.onSubmit()
  }
  if (isMobile) return <PhoneCompose {...props} onKeyDown={press} />
  if (props.surface === "page") return <PageCompose {...props} onKeyDown={press} />
  return <DialogCompose {...props} onKeyDown={press} />
}

type SurfaceProps = ComposeSurfaceProps & { onKeyDown: (event: KeyboardEvent) => void }

const titleOf = (crumbs: Crumb[]) => crumbs[crumbs.length - 1]?.label ?? "작성"

function SubmitButton({ submit, className }: { submit: ComposeSubmit; className?: string }) {
  return (
    <Button className={cn("rounded-full px-3", className)} disabled={submit.isDisabled || submit.isPending}
      aria-keyshortcuts="Control+Enter Meta+Enter" title="Ctrl + Enter" onClick={submit.onSubmit}>
      {submit.isPending && <Spinner data-icon="inline-start" />}
      {submit.label}
    </Button>
  )
}

function Continuing({ value = false, onChange }: { value?: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <Switch checked={value} onCheckedChange={onChange} />
      계속 만들기
    </label>
  )
}

/** 바닥 줄의 다른 동작. 앞쪽에 붙고 나머지를 끝으로 민다. */
function Actions({ children }: { children: ReactNode }) {
  return <div data-slot="compose-actions" className="mr-auto flex items-center gap-1">{children}</div>
}

/** 까닭 한두 줄. 다른 동작이 없으면 이것이 앞쪽에 붙는다. */
function ErrorText({ children, className }: { children: string; className?: string }) {
  return <p data-slot="compose-error" role="alert" className={cn("line-clamp-2 min-w-0 text-sm text-destructive", className)}>{children}</p>
}

/** 데스크톱 바닥 줄: 다른 동작 · 까닭 · 계속 만들기 · (페이지면) 취소 · 만들기. */
function Foot({ actions, error, submit, isContinuing, onContinuing, onCancel, className }: Pick<SurfaceProps, "actions" | "error" | "submit" | "isContinuing" | "onContinuing"> & {
  onCancel?: () => void; className?: string
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-end gap-3", className)}>
      {actions && <Actions>{actions}</Actions>}
      {error && <ErrorText className={cn("flex-1 text-right", !actions && "text-left")}>{error}</ErrorText>}
      {onContinuing && <Continuing value={isContinuing} onChange={onContinuing} />}
      {onCancel && <Button variant="ghost" onClick={onCancel}>취소</Button>}
      <SubmitButton submit={submit} />
    </div>
  )
}

/** 제목 · 본문의 크기를 정하는 묶음. 페이지(data-page)에서는 제목이 크고 본문 자리가 높다. */
function Paper({ isPage, children }: { isPage?: boolean; children: ReactNode }) {
  return <div data-slot="compose-paper" data-page={isPage || undefined} className="group/compose flex min-w-0 flex-col gap-3">{children}</div>
}

function Pills({ children, className }: { children: ReactNode; className?: string }) {
  return <div role="group" aria-label="속성" className={cn("flex flex-wrap items-center gap-1.5", className)}>{children}</div>
}

function DialogCompose({ crumbs, chip, pills, submit, actions, error, isContinuing, onContinuing, onClose, onExpand, onKeyDown, children }: SurfaceProps) {
  return (
    <Dialog open onOpenChange={isOpen => { if (!isOpen) onClose() }}>
      <DialogContent showCloseButton={false} onKeyDown={onKeyDown}
        className="top-[12dvh] max-h-[76dvh] translate-y-0 gap-6 overflow-y-auto px-10 pt-7 pb-6 sm:max-w-180">
        <div className="flex min-w-0 items-center gap-3">
          {chip}
          <DialogTitle className="min-w-0 flex-1 truncate text-xl leading-normal font-semibold">{titleOf(crumbs)}</DialogTitle>
          <div className="-mr-2 flex shrink-0 items-center gap-1">
            {onExpand && <Button variant="ghost" size="icon-sm" aria-label="크게 보기" title="크게 보기" onClick={onExpand}><MaximizeIcon /></Button>}
            <DialogClose render={<Button variant="ghost" size="icon-sm" aria-label="닫기" title="닫기" />}><XIcon /></DialogClose>
          </div>
        </div>
        <Paper>{children}{pills && <Pills className="pt-1">{pills}</Pills>}</Paper>
        <Foot actions={actions} error={error} submit={submit} isContinuing={isContinuing} onContinuing={onContinuing} className="pt-5" />
      </DialogContent>
    </Dialog>
  )
}

function PageCompose({ crumbs, chip, pills, submit, actions, error, isContinuing, onContinuing, onClose, onKeyDown, children }: SurfaceProps) {
  return (
    <Page crumbs={crumbs}>
      <div className="flex flex-1 justify-center bg-background px-4 py-8" onKeyDown={onKeyDown}>
        <div className="flex w-full max-w-180 flex-col gap-6">
          {chip && <div className="flex">{chip}</div>}
          <Paper isPage>{children}{pills && <Pills className="pt-1">{pills}</Pills>}</Paper>
          <Foot actions={actions} error={error} submit={submit} isContinuing={isContinuing} onContinuing={onContinuing} onCancel={onClose} />
        </div>
      </div>
    </Page>
  )
}

function PhoneCompose({ crumbs, chip, pills, submit, actions, error, isContinuing, onContinuing, onClose, onKeyDown, children }: SurfaceProps) {
  return (
    <Page crumbs={crumbs} isFullScreen>
      <div className="flex min-h-0 flex-1 flex-col bg-background" onKeyDown={onKeyDown}>
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 py-5">
          {chip && <div className="flex">{chip}</div>}
          <Paper isPage>{children}</Paper>
        </div>
        {pills && <Pills className="shrink-0 px-4 py-2">{pills}</Pills>}
        <footer className="flex shrink-0 flex-col gap-2 border-t px-4 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {error && <ErrorText>{error}</ErrorText>}
          {onContinuing && <Continuing value={isContinuing} onChange={onContinuing} />}
          <div className="flex items-center gap-2">
            {actions && <div data-slot="compose-actions" className="flex shrink-0 items-center gap-1 [&_button]:h-11">{actions}</div>}
            <Button variant="ghost" className="h-11 px-4" onClick={onClose}>취소</Button>
            <SubmitButton submit={submit} className="h-11 flex-1" />
          </div>
        </footer>
      </div>
    </Page>
  )
}

/** 놓일 곳: 프로젝트 표식과 이름의 작은 알약. */
export function PlaceChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span data-slot="place-chip" className="inline-flex h-6 max-w-48 shrink-0 items-center gap-1 rounded-full bg-muted px-2 text-xs font-medium [&_svg]:size-3.5 [&_svg]:shrink-0">
      {icon}<span className="truncate">{label}</span>
    </span>
  )
}
