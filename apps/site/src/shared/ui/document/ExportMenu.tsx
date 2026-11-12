import { useState, type ReactNode } from "react"
import { AdaptivePopover } from "@/shared/ui/adaptive-popover"
import { Button } from "@/shared/ui/button"
import { ChevronDownIcon, DownloadIcon, FileTextIcon, LinkIcon, PrinterIcon } from "@/shared/ui/icon"
import { toast } from "@/shared/ui/toast"

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={title} className="flex flex-col py-1 not-first:border-t">
      <div className="px-2.5 pt-1.5 pb-1 text-xs font-semibold text-muted-foreground">{title}</div>
      {children}
    </div>
  )
}

/**
 * 내보내기: 내려받기 아이콘과 묶음 메뉴(휴대폰은 바텀시트). 내보내기 묶음은 PDF로 저장과 인쇄, 공유 묶음은 링크 복사다. 동작은 호스트가
 * 바꿀 수 있다: 서버에서 PDF를 만드는 앱은 onSavePdf를 준다. 주지 않으면 둘 다 브라우저 인쇄 창을 연다(문서만 찍고 페이지 설정의
 * 용지 · 여백 · 머리말 · 바닥글을 쓴다). link를 주지 않으면 지금 주소를 복사한다. 결과는 토스트로 알린다(앱 뿌리에 Toaster가 있어야 한다).
 * DOCX는 아직 다루지 않는다.
 */
export function ExportMenu({ onSavePdf = () => window.print(), onPrint = () => window.print(), link }: {
  onSavePdf?: () => void; onPrint?: () => void; link?: string
}) {
  const [isOpen, setOpen] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(link ?? location.href); toast.add({ title: "링크를 복사했습니다" }) }
    catch { toast.add({ title: "링크를 복사하지 못했습니다" }) }
  }
  const item = (label: string, icon: ReactNode, run: () => void) => (
    <Button variant="ghost" className="h-9 justify-start font-normal [&_svg]:text-icon-muted max-md:h-12" onClick={() => { setOpen(false); run() }}>{icon}{label}</Button>
  )
  return (
    <AdaptivePopover title="내보내기" align="end" className="w-60 p-1.5" open={isOpen} onOpenChange={setOpen}
      trigger={<Button variant="ghost" size="sm" aria-label="내보내기" className="gap-1 text-icon-muted max-md:h-11"><DownloadIcon chosen={isOpen} /><ChevronDownIcon /></Button>}>
      <Group title="내보내기">
        {item("PDF로 저장", <FileTextIcon data-icon="inline-start" />, onSavePdf)}
        {item("인쇄", <PrinterIcon data-icon="inline-start" />, onPrint)}
      </Group>
      <Group title="공유">{item("링크 복사", <LinkIcon data-icon="inline-start" />, () => void copy())}</Group>
    </AdaptivePopover>
  )
}
