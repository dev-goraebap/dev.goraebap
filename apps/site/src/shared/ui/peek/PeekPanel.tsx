import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"
import { Button } from "@/shared/ui/button"
import { MaximizeIcon, XIcon } from "@/shared/ui/icon"
import { usePeekClose } from "./use-peek-close"

/**
 * 목록과 그 옆 칸(미리보기 · 옆 패널)을 나란히 두는 틀(옛 Page의 aside 자리). 목록 쪽(Page)은 남은 폭을 쓰고 칸은 자기 폭을 정한다.
 * 칸은 머리부터 바닥까지 목록과 따로 스크롤한다. aside가 없으면 목록만 그린다(휴대폰은 usePeek이 id를 비워 늘 목록만).
 */
export function PeekLayout({ aside, children }: { aside?: ReactNode; children: ReactNode }) {
  return (
    <div data-slot="peek-layout" className="flex min-h-0 min-w-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      {aside}
    </div>
  )
}

/**
 * 목록 옆 미리보기(작업 목록): 목록을 가리지 않고(비모달) 본문의 45%를 쓴다. 머리에는 대상 이름 · 페이지로 열기 · 닫기,
 * Esc로도 닫고(입력 칸 · 뜬 창 안의 Esc는 제외), 닫으면 초점을 미리보던 줄(data-peek-row)로 돌린다.
 * 줄 누르기는 페이지로 가고 미리보기는 Space · 줄의 단추로 연다(usePeekRows). 본문에는 상세와 같은 부품을 넣는다:
 * 칸이 컨테이너라 DetailLayout은 좁은 모양(한 줄 알약)이 된다. PeekLayout의 aside 자리에 둔다.
 */
export function PeekPanel({ id, title, pageHref, onClose, children }: {
  id: string; title: string; pageHref: string; onClose: () => void; children: ReactNode
}) {
  usePeekClose(id, onClose)
  return (
    <section role="complementary" aria-label={`미리보기: ${title}`}
      className="flex w-[45%] min-w-80 shrink-0 flex-col border-l bg-background">
      <header className="flex h-13 shrink-0 items-center gap-2 border-b pr-2 pl-4">
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</h2>
        <Button variant="ghost" size="icon-sm" aria-label="페이지로 열기" title="페이지로 열기" nativeButton={false} render={<Link to={pageHref} />}>
          <MaximizeIcon />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="미리보기 닫기" title="닫기 (Esc)" onClick={onClose}><XIcon /></Button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
    </section>
  )
}
