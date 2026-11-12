import { useEffect, useRef, useState, type ReactNode } from "react"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { Alert, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { TriangleAlertIcon } from "@/shared/ui/icon"
import { Page, type Crumb } from "@/shared/ui/page"
import { Spinner } from "@/shared/ui/spinner"

export type BodyEditValue<T> = { title: string; body: T }

type BodyEditPageProps<T> = {
  /** 페이지 경로. 마지막 단계가 고치는 것의 이름이다. */
  crumbs: Crumb[]
  value: BodyEditValue<T>
  /** 저장한다. 실패하면 throw: 쓴 내용은 그대로 두고 알린다. */
  onSave: (value: BodyEditValue<T>) => Promise<unknown>
  /** 상세로 돌아간다(완료 · 취소). */
  onLeave: () => void
  /** 본문 칸. 앱의 에디터(리치 에디터 · 문서 편집기 · 글 칸)를 넣는다: 처음 값과 바뀔 때 부를 함수를 받는다. */
  renderBody: (body: { value: T; onChange: (next: T) => void }) => ReactNode
  titlePlaceholder?: string
}

/**
 * 본문 수정 화면(…/edit). 상세의 편집 단추는 늘 이 화면을 연다. 제목과 본문만 두고 속성 · 활동은 두지 않는다.
 * 데스크톱: 머리 줄에 저장 상태 · 저장 · 취소 · 완료. 휴대폰: 전체 화면, 바닥 줄에 저장 · 완료, 앱 바 ←가 취소.
 * 저장과 Ctrl/⌘+S는 제자리에 남고, 완료는 저장한 뒤 돌아가며, 취소는 저장하지 않고 돌아가되 고친 것이 있으면 먼저 묻는다.
 * 저장에 실패하면 쓴 내용을 그대로 두고 머리 아래에 알린다. 본문 값의 비교는 JSON으로 한다(에디터 문서 · 글자 모두).
 */
export function BodyEditPage<T>({ crumbs, value, onSave, onLeave, renderBody, titlePlaceholder = "제목" }: BodyEditPageProps<T>) {
  const isMobile = useIsMobile()
  const [title, setTitle] = useState(value.title)
  const [body, setBody] = useState(value.body)
  const [saved, setSaved] = useState(() => JSON.stringify({ title: value.title.trim(), body: value.body }))
  const [isSaving, setSaving] = useState(false)
  const [failure, setFailure] = useState("")
  const [isLeaveAsked, setLeaveAsked] = useState(false)
  const isDirty = JSON.stringify({ title: title.trim(), body }) !== saved
  const save = async () => {
    if (!title.trim()) {
      setFailure("제목을 입력해 주세요.")
      throw new Error("제목 없음")
    }
    setSaving(true)
    setFailure("")
    const next = { title: title.trim(), body }
    try {
      await onSave(next)
      setSaved(JSON.stringify(next))
    } catch (error) {
      setFailure("저장하지 못했습니다. 쓰던 내용은 이 화면에 그대로 있습니다.")
      throw error
    } finally {
      setSaving(false)
    }
  }
  const latest = useRef(save)
  latest.current = save
  // Ctrl+S(⌘S)는 브라우저의 페이지 저장 대신 이 화면을 저장한다.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey || event.key.toLowerCase() !== "s") return
      event.preventDefault()
      void latest.current().catch(() => undefined)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])
  const done = () => void save().then(onLeave, () => undefined)
  const cancel = () => (isDirty ? setLeaveAsked(true) : onLeave())
  const status = isSaving ? "저장 중…" : isDirty ? "저장 안 됨" : "저장됨"
  const saveButton = (
    <Button variant="secondary" disabled={!isDirty || isSaving} title="Ctrl+S" aria-keyshortcuts="Control+S Meta+S" className="max-md:h-11 max-md:px-4"
      onClick={() => void save().catch(() => undefined)}>
      {isSaving && <Spinner data-icon="inline-start" />}
      저장
    </Button>
  )
  const doneButton = <Button disabled={isSaving} title="저장하고 돌아가기" className="max-md:h-11 max-md:flex-1" onClick={done}>완료</Button>
  return (
    <Page crumbs={crumbs} isFullScreen onBack={cancel}
      actions={isMobile ? undefined : (
        <div className="flex shrink-0 items-center gap-2">
          <span role="status" className="text-xs text-muted-foreground">{status}</span>
          {saveButton}
          <Button variant="ghost" disabled={isSaving} onClick={cancel}>취소</Button>
          {doneButton}
        </div>
      )}
      below={failure ? (
        <Alert variant="destructive" className="shrink-0 rounded-none border-x-0 border-t-0">
          <TriangleAlertIcon />
          <AlertTitle>{failure}</AlertTitle>
        </Alert>
      ) : undefined}>
      <div className="flex min-h-0 flex-1 flex-col bg-background">
        {/* 작성 페이지와 같은 읽는 폭(45rem). 좌우 여백이 블록 손잡이 자리를 품는다. */}
        <div className="flex min-h-0 flex-1 justify-center overflow-y-auto px-4 py-5 md:px-10 md:py-8">
          <div className="flex w-full max-w-180 min-w-0 flex-col gap-3">
            <input aria-label="제목" placeholder={titlePlaceholder} autoComplete="off" value={title} onChange={event => setTitle(event.target.value)}
              aria-invalid={!title.trim() && failure ? true : undefined}
              className="w-full bg-transparent text-2xl leading-snug font-semibold outline-none placeholder:text-muted-foreground/70 aria-invalid:shadow-[0_2px_0_-1px_var(--destructive)]" />
            {renderBody({ value: value.body, onChange: setBody })}
          </div>
        </div>
        {isMobile && (
          <footer className="flex shrink-0 items-center gap-2 border-t px-4 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <span role="status" className="mr-auto text-sm text-muted-foreground">{status}</span>
            {saveButton}
            {doneButton}
          </footer>
        )}
      </div>
      <ConfirmDialog open={isLeaveAsked} onOpenChange={setLeaveAsked} title="저장하지 않은 내용이 있습니다"
        description="지금 나가면 저장하지 않은 내용이 사라집니다. 남기려면 취소를 누르고 저장하세요."
        action={{ label: "버리고 나가기", onAction: () => { setLeaveAsked(false); onLeave() } }} />
    </Page>
  )
}
