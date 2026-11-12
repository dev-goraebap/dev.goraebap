import { Button } from "@/shared/ui/button"
import { ListIcon } from "@/shared/ui/icon"
import { PropertyPill } from "@/shared/ui/property-pill"
import type { PageLayout } from "./pagination"

/**
 * 상세 오른쪽 속성 칸의 페이지 항목: "N페이지", 누르면 페이지 목록(번호와 그 페이지의 대표 제목, 새 제목 없이 이어지는 페이지는 "이어짐")이
 * 뜨고(휴대폰은 바텀시트) 고르면 그 페이지로 간다. 문서의 목차처럼 정보 묶음 안에 둔다. 배치 전에는 비어 있다.
 */
export function PagesPill({ layout, onSelect }: { layout: PageLayout | null; onSelect: (number: number) => void }) {
  return (
    <PropertyPill label="페이지" icon={<ListIcon />} text={layout ? `${layout.count}페이지` : undefined} width="w-72">
      {close => (
        <div role="list" aria-label="페이지" className="flex max-h-[min(24rem,60dvh)] flex-col overflow-y-auto">
          {(layout?.pages ?? []).map(page => (
            <Button key={page.number} role="listitem" variant="ghost" className="h-9 justify-start gap-3 font-normal max-md:h-12" onClick={() => { close(); onSelect(page.number) }}>
              <span className="w-5 flex-none text-right text-xs text-muted-foreground tabular-nums">{page.number}</span>
              <span className="min-w-0 flex-1 truncate text-left">{page.heading?.text ?? "제목 없음"}</span>
              {page.continues ? <span className="text-xs text-muted-foreground">이어짐</span> : null}
            </Button>
          ))}
        </div>
      )}
    </PropertyPill>
  )
}
