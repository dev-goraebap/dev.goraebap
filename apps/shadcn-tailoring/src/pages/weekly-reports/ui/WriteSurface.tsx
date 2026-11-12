import { useRef } from "react"
import { ME, weeklyReportHref } from "@/entities/weekly-report"
import { paths } from "@/shared/config"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { Button } from "@/shared/ui/button"
import { PlaceChip } from "@/shared/ui/compose"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/shared/ui/dialog"
import { FileTextIcon, MaximizeIcon, PenSquareIcon, XIcon } from "@/shared/ui/icon"
import { Page } from "@/shared/ui/page"
import { WriteForm } from "./WriteForm"

type WriteSurfaceProps = {
  /** dialog: 목록 · 보고 위 대화상자(데스크톱). page: 자기 페이지(링크 · 새로고침 · 크게 보기, 휴대폰은 늘). */
  surface: "dialog" | "page"
  week: string
  thisWeek: string
  onWeek: (week: string) => void
  onClose: () => void
  /** 크게 보기: 같은 양식을 자기 페이지로. 대화상자에만 있다. */
  onExpand?: () => void
  /** 제출한 뒤: 그 보고의 주소로. */
  onDone: (href: string) => void
}

const TITLE = "주간보고 작성"

/**
 * 주간보고 작성이 놓이는 곳(호호코워크 WeeklyReportCompose의 ComposeSurface). 데스크톱 대화상자는 화면 위 12%에서 뜨고(최대 45rem)
 * 머리에 부서 칩 · 이름 · 크게 보기 · 닫기, 페이지는 경로와 45rem 단. 단계가 있는 양식이라(이전 · 임시 저장 · 다음)
 * shared/ui/compose의 바닥 줄 대신 WriteForm이 바닥 줄을 그린다.
 */
export function WriteSurface({ surface, week, thisWeek, onWeek, onClose, onExpand, onDone }: WriteSurfaceProps) {
  const isMobile = useIsMobile()
  const keepRef = useRef<(() => void) | undefined>(undefined)
  const form = (isPage: boolean) => (
    <WriteForm week={week} thisWeek={thisWeek} isPage={isPage} onWeek={onWeek} keepRef={keepRef} onCancel={isPage ? onClose : undefined}
      onSaved={saved => onDone(weeklyReportHref(saved.id))} />
  )
  if (surface === "page" || isMobile) {
    return (
      <Page crumbs={[{ label: "주간보고", href: paths.weeklyReports }, { label: TITLE, icon: PenSquareIcon }]} isFullScreen>
        {form(true)}
      </Page>
    )
  }
  const expand = onExpand && (() => { keepRef.current?.(); onExpand() })
  return (
    <Dialog open onOpenChange={isOpen => { if (!isOpen) onClose() }}>
      <DialogContent showCloseButton={false} className="top-[12dvh] flex max-h-[76dvh] translate-y-0 flex-col gap-0 p-0 sm:max-w-180">
        <div className="flex min-w-0 shrink-0 items-center gap-3 px-10 pt-7 pb-4">
          <PlaceChip icon={<FileTextIcon />} label={ME.department} />
          <DialogTitle className="min-w-0 flex-1 truncate text-xl leading-normal font-semibold">{TITLE}</DialogTitle>
          <div className="-mr-2 flex shrink-0 items-center gap-1">
            {expand && <Button variant="ghost" size="icon-sm" aria-label="크게 보기" title="크게 보기" onClick={expand}><MaximizeIcon /></Button>}
            <DialogClose render={<Button variant="ghost" size="icon-sm" aria-label="닫기" title="닫기" />}><XIcon /></DialogClose>
          </div>
        </div>
        {form(false)}
      </DialogContent>
    </Dialog>
  )
}
