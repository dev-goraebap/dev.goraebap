import { useBlocker } from "@tanstack/react-router"
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { cn } from "cn"
import { Button } from "@/shared/ui/button"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { Dialog, DialogBar, DialogContent } from "@/shared/ui/dialog"
import { ArrowUpIcon, XIcon } from "@/shared/ui/icon"
import { PaneFrame } from "@/shared/ui/layout/pane-frame"
import { parentCrumb, useFullScreen, type Crumb } from "@/shared/ui/layout/page"
import { Spinner } from "@/shared/ui/spinner"
import { Switch } from "@/shared/ui/switch"

export type ComposeSubmit = { label: string; onSubmit: () => void; isDisabled?: boolean; isPending?: boolean }

type ComposeSurfaceProps = {
  /**
   * dialog: 목록 위 대화상자(데스크톱에서 목록의 버튼으로 열 때). page: 자기 페이지(링크 · 새로고침 · 크게 보기).
   * pane: 데스크톱에서 목록 오른쪽 칸(공지사항 · 회의록). 휴대폰은 늘 페이지.
   */
  surface: "dialog" | "page" | "pane"
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
  /**
   * 쓴 것이 있다. 그러면 닫기(닫기 단추 · Esc · 바깥 누르기 · 취소)가 먼저 버릴지 묻고, 버리기를 고르면 onClose를 부른다.
   * 칸(pane)에서는 목록의 다른 줄을 눌러 주소가 바뀔 때도 묻는다. 함수면 그때그때 묻는다(저장해 떠날 때 false).
   */
  isDirty?: boolean | (() => boolean)
  /** 버릴지 묻는 말을 양식에 맞게. 기본은 "작성 중인 내용을 버릴까요?" · "지금 닫으면 쓴 내용이 사라집니다." · "버리기". */
  discard?: { title?: string; description?: string; label?: string }
  /** 페이지로 열기(↗): 같은 양식을 자기 페이지로. 대화상자에만 있다. */
  onExpand?: () => void
  /** 제목과 본문(ComposeFields). */
  children: ReactNode
}

/**
 * 만들기 양식이 놓이는 곳. 데스크톱 대화상자는 화면 위 12%에서 가운데로 뜨고(최대 45rem)
 * 머리에 놓일 곳 칩 · 이름 · 크게 보기 · 닫기, 바닥에 계속 만들기 · 만들기. 데스크톱 페이지는 45rem 단에 같은 양식과
 * 취소. 휴대폰은 늘 전체 화면 페이지: 앱 바 ←, 스크롤하는 양식, 고정한 알약 줄, 취소 · 만들기 바닥 줄(만들기가 남은 폭을 채운다).
 * 바닥 줄의 앞쪽에는 다른 동작(actions), 그 뒤에 까닭(error)을 둔다. Ctrl/⌘+Enter가 만들기를 누른다.
 * 쓴 것이 있으면(isDirty) 닫기 전에 버릴지 묻는다(ConfirmDialog).
 */
export function ComposeSurface({ isDirty = false, discard, ...props }: ComposeSurfaceProps) {
  const isMobile = useIsMobile()
  const [isDiscarding, setDiscarding] = useState(false)
  const { submit, onClose } = props
  const press = (event: KeyboardEvent) => {
    if (event.key !== "Enter" || !(event.ctrlKey || event.metaKey) || event.nativeEvent.isComposing) return
    event.preventDefault()
    if (!submit.isDisabled && !submit.isPending) submit.onSubmit()
  }
  // 버리기를 고른 뒤에는 떠나는 길(onClose의 주소 이동)을 다시 막지 않는다.
  const released = useRef(false)
  const dirty = () => !released.current && (typeof isDirty === "function" ? isDirty() : isDirty)
  const surface = { ...props, onKeyDown: press, onClose: () => (dirty() ? setDiscarding(true) : onClose()) }
  return (
    <>
      {isMobile ? <PhoneCompose {...surface} />
        : props.surface === "page" ? <PageCompose {...surface} />
          : props.surface === "pane" ? <PaneCompose {...surface} isDirty={dirty} discard={discard} />
            : <DialogCompose {...surface} />}
      <DiscardDialog open={isDiscarding} onCancel={() => setDiscarding(false)} discard={discard}
        onDiscard={() => { released.current = true; setDiscarding(false); onClose() }} />
    </>
  )
}

/** 쓴 것을 버릴지 묻는 창. 닫을 때(닫기 · Esc · 취소)와 칸에서 다른 주소로 떠날 때(isLeaving) 같은 말로 묻는다. */
function DiscardDialog({ open, isLeaving = false, discard, onCancel, onDiscard }: {
  open: boolean; isLeaving?: boolean; discard?: ComposeSurfaceProps["discard"]; onCancel: () => void; onDiscard: () => void
}) {
  return <ConfirmDialog open={open} onOpenChange={isOpen => { if (!isOpen) onCancel() }}
    title={discard?.title ?? "작성 중인 내용을 버릴까요?"}
    description={discard?.description ?? (isLeaving ? "지금 떠나면 쓴 내용이 사라집니다." : "지금 닫으면 쓴 내용이 사라집니다.")}
    action={{ label: discard?.label ?? "버리기", onAction: onDiscard }} />
}

type SurfaceProps = Omit<ComposeSurfaceProps, "isDirty" | "discard"> & { onKeyDown: (event: KeyboardEvent) => void }

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

/**
 * 양식의 두 칸: 위는 스크롤하는 내용, 아래는 바닥(속성 알약 · 다른 동작 · 만들기). 내용 칸은 내용만큼만 커져서
 * 짧으면 바닥이 내용 바로 아래에 붙고, 길면 내용 칸만 제 안에서 스크롤하고 바닥은 그 아래에 따로 선다. 바닥이 내용 위에
 * 겹쳐 뜨지 않으므로 쓰는 줄(커서)을 가리지 않는다.
 * 두 칸은 놓인 곳(칸 · 페이지)의 폭을 다 쓰고, 읽기 좋은 폭의 단(column)은 그 안 가운데에 선다. 그래서 스크롤 막대는 단 옆이
 * 아니라 놓인 곳의 오른쪽 끝에 생기고, 단 바깥 여백에서 휠을 굴려도 스크롤한다.
 */
function FormColumn({ column, bodyClassName, foot, children }: { column?: string; bodyClassName?: string; foot: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-0 w-full flex-col">
      <div data-slot="compose-body" className="min-h-0 overflow-y-auto overscroll-contain">
        <div className={cn("mx-auto w-full", column, bodyClassName)}>{children}</div>
      </div>
      <div data-slot="compose-foot" className="shrink-0 pt-3">
        <div className={cn("mx-auto flex w-full flex-col gap-3", column)}>{foot}</div>
      </div>
    </div>
  )
}

/** 페이지 · 칸 양식의 단: 상세(DetailLayout의 좁은 단)와 같은 45rem, 양옆 1rem 여백. */
const COLUMN = "max-w-188 px-4"

/** 데스크톱 양식의 바닥(대화상자 · 페이지 · 칸 공통): 속성 알약 줄, 그 아래 바닥 줄. */
function FormFoot({ pills, onCancel, ...foot }: Pick<SurfaceProps, "pills" | "actions" | "error" | "submit" | "isContinuing" | "onContinuing"> & { onCancel?: () => void }) {
  return <>
    {pills && <Pills>{pills}</Pills>}
    <Foot {...foot} onCancel={onCancel} className="pt-2" />
  </>
}

function Pills({ children, className }: { children: ReactNode; className?: string }) {
  return <div role="group" aria-label="속성" className={cn("flex flex-wrap items-center gap-1.5", className)}>{children}</div>
}

function DialogCompose({ crumbs, chip, pills, submit, actions, error, isContinuing, onContinuing, onClose, onExpand, onKeyDown, children }: SurfaceProps) {
  return (
    <Dialog open onOpenChange={isOpen => { if (!isOpen) onClose() }}>
      <DialogContent showCloseButton={false} onKeyDown={onKeyDown} className="px-0">
        <div className="px-10"><DialogBar title={titleOf(crumbs)} before={chip} onExpand={onExpand} /></div>
        <FormColumn column="px-10"
          foot={<FormFoot pills={pills} actions={actions} error={error} submit={submit} isContinuing={isContinuing} onContinuing={onContinuing} />}>
          <Paper>{children}</Paper>
        </FormColumn>
      </DialogContent>
    </Dialog>
  )
}

/** 데스크톱 자기 페이지의 양식: 상세 페이지와 같은 틀(PaneFrame). 둥근 뒤로(취소와 같다)와 양식 이름이 늘 보인다. */
function PageCompose({ crumbs, chip, pills, submit, actions, error, isContinuing, onContinuing, onClose, onKeyDown, children }: SurfaceProps) {
  const parent = parentCrumb(crumbs)
  return (
    <PaneFrame label={parent?.label} title={titleOf(crumbs)} onBack={onClose} backLabel="뒤로" isTitleShown isPageHead>
      <div className="flex min-h-0 flex-1 flex-col bg-background pt-6 pb-6" onKeyDown={onKeyDown}>
        <FormColumn column={COLUMN} bodyClassName="flex flex-col gap-6"
          foot={<FormFoot pills={pills} actions={actions} error={error} submit={submit} isContinuing={isContinuing} onContinuing={onContinuing} onCancel={onClose} />}>
          {chip && <div className="flex">{chip}</div>}
          <Paper isPage>{children}</Paper>
        </FormColumn>
      </div>
    </PaneFrame>
  )
}

/**
 * 목록 오른쪽 칸의 양식: 대화상자와 같은 머리(칩 · 이름 · 닫기)와 여백, 칸 안에서 스크롤한다. 쓴 것이 있으면 목록의 다른
 * 줄을 눌러 떠날 때도 버릴지 묻는다(주소 이동을 막고, 버리기를 고르면 그대로 간다).
 */
function PaneCompose({ crumbs, pills, submit, actions, error, isContinuing, onContinuing, onClose, onKeyDown, children, isDirty, discard }: SurfaceProps & {
  isDirty: () => boolean; discard?: ComposeSurfaceProps["discard"]
}) {
  const leaving = useBlocker({
    shouldBlockFn: ({ current, next }) => current.pathname !== next.pathname && isDirty(),
    withResolver: true, enableBeforeUnload: isDirty,
  })
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background" onKeyDown={onKeyDown}>
      {/* 상세 칸과 같은 틀(PaneFrame): 둥근 ← 뒤로와 양식의 이름(늘 보인다). 놓일 곳 칩은 목록이 이미 말해 주므로 두지 않는다. */}
      <PaneFrame title={titleOf(crumbs)} onBack={onClose} backLabel="뒤로" isTitleShown>
        {/* 상세(DetailLayout의 좁은 단)와 같은 45rem 단을 가운데에 둔다. 칸이 넓어도 양식은 읽기 좋은 폭을 지킨다. */}
        <div className="flex min-h-0 flex-1 flex-col pt-4 pb-6">
          <FormColumn column={COLUMN}
            foot={<FormFoot pills={pills} actions={actions} error={error} submit={submit} isContinuing={isContinuing} onContinuing={onContinuing} />}>
            <Paper>{children}</Paper>
          </FormColumn>
        </div>
      </PaneFrame>
      <DiscardDialog open={leaving.status === "blocked"} onCancel={() => leaving.reset?.()} discard={discard} isLeaving
        onDiscard={() => leaving.proceed?.()} />
    </div>
  )
}

/**
 * 휴대폰 양식(Linear 모바일의 새 이슈처럼): 하단 막대 없이 화면을 다 쓴다. 위에 둥근 닫기 · 가운데 놓일 곳 칩(없으면
 * 양식 이름) · 둥근 보내기(↑, 만들 수 있을 때만 밝다), 그 아래 제목과 본문이 스크롤하고, 아래에 속성 알약 상자와 다른 동작이 붙는다.
 */
function PhoneCompose({ crumbs, chip, pills, submit, actions, error, isContinuing, onContinuing, onClose, onKeyDown, children }: SurfaceProps) {
  useFullScreen(true)
  const title = titleOf(crumbs)
  const isOff = submit.isDisabled || submit.isPending
  return (
    <div data-slot="phone-compose" className="flex min-h-0 flex-1 flex-col bg-background" onKeyDown={onKeyDown}>
      <header className="flex h-16 shrink-0 items-center gap-3 px-4">
        <Button variant="tool" size="icon" aria-label="닫기" title="닫기" className="size-11 shrink-0" onClick={onClose}><XIcon className="size-5" /></Button>
        <div className="flex min-w-0 flex-1 justify-center">
          {chip ?? <h1 className="truncate text-base font-semibold">{title}</h1>}
        </div>
        <Button size="icon" aria-label={submit.label} title={submit.label} aria-keyshortcuts="Control+Enter Meta+Enter" disabled={isOff}
          className="size-11 shrink-0" onClick={submit.onSubmit}>
          {submit.isPending ? <Spinner /> : <ArrowUpIcon className="size-5" />}
        </Button>
      </header>
      {chip && <h1 className="sr-only">{title}</h1>}
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 py-3">
        <Paper isPage>{children}</Paper>
      </div>
      <footer className="flex shrink-0 flex-col gap-2 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {error && <ErrorText className="px-1">{error}</ErrorText>}
        {pills && <Pills className="rounded-3xl border border-control-border bg-control/60 p-2">{pills}</Pills>}
        {(actions || onContinuing) && (
          <div className="flex items-center gap-2 px-1">
            {actions && <div data-slot="compose-actions" className="flex shrink-0 items-center gap-1">{actions}</div>}
            {onContinuing && <div className="ml-auto"><Continuing value={isContinuing} onChange={onContinuing} /></div>}
          </div>
        )}
      </footer>
    </div>
  )
}

/** 놓일 곳: 프로젝트 표식과 이름의 작은 알약. */
export function PlaceChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span data-slot="place-chip" className="inline-flex h-6 max-w-48 shrink-0 items-center gap-1 rounded-full border border-control-border bg-control px-2 text-xs font-medium [&_svg]:size-3.5 [&_svg]:shrink-0">
      {icon}<span className="truncate">{label}</span>
    </span>
  )
}
