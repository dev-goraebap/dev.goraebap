import type { CSSProperties } from "react"
import {
  DocumentIcon, DocumentLabelDot, DocumentLabels, PAPER_TONE, cardDateText, excerptOf, type DocumentLabel, type ProjectDocument,
} from "@/entities/document"
import { projectPath } from "@/shared/config"
import { CalendarIcon } from "@/shared/ui/icon"
import { PersonAvatar } from "@/shared/ui/person-avatar"
import { RowLink } from "@/shared/ui/row-link"

type ListProps = { projectKey: string; documents: ProjectDocument[]; labels: DocumentLabel[] }

const hrefOf = (projectKey: string, id: string) => `${projectPath(projectKey, "documents")}/${id}`
const labelsOf = (document: ProjectDocument, labels: DocumentLabel[]) => labels.filter(label => document.labelIds.includes(label.id))

/**
 * 문서 카드(호호코워크 DocumentCard): 위쪽 종이 그림은 문서의 표식(아이콘 · 색)으로 칠하고, 색이 없으면 첫 라벨 색을 쓴다.
 * 아래는 라벨 이름 줄 · 제목 · 본문 앞부분 · 마지막으로 고친 사람과 날짜. 카드 어디를 눌러도 문서가 열린다.
 */
function DocumentCard({ projectKey, document, labels }: { projectKey: string; document: ProjectDocument; labels: DocumentLabel[] }) {
  const tone = document.color ?? labels[0]?.color ?? PAPER_TONE
  return (
    <li className="relative flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card wrap-anywhere shadow-xs hover:border-ring/50">
      {/* check-ui: allow-style 종이 색은 사용자가 고른 표식 · 라벨 색(데이터 값)이다. */}
      <div aria-hidden style={{ "--tone": tone } as CSSProperties}
        className="relative grid h-40 place-items-center overflow-hidden bg-[color-mix(in_srgb,var(--tone)_13%,var(--background))] text-[color-mix(in_srgb,var(--tone)_70%,var(--foreground))]">
        <div className="relative top-6.5 flex h-40 w-[72%] -rotate-4 flex-col gap-2 rounded-t-lg border border-background/90 bg-background/85 px-4 pt-5 pb-4">
          <DocumentIcon document={document} className="size-7.5" />
          <p className="line-clamp-2 max-w-[90%] text-[0.7rem] leading-[1.6] font-semibold">{document.title}</p>
          <div className="flex flex-col gap-1.25 *:h-0.5 *:bg-current *:opacity-15 *:last:w-[65%]"><i /><i /><i /></div>
        </div>
      </div>
      <div className="flex min-h-42 flex-1 flex-col gap-2 p-4">
        <p className="flex min-h-4 min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          {labels[0] && <DocumentLabelDot color={labels[0].color} />}
          <span className="truncate">{labels.map(label => label.name).join(" · ")}</span>
        </p>
        <RowLink to={hrefOf(projectKey, document.id)} className="line-clamp-2 font-semibold">{document.title}</RowLink>
        <p className="line-clamp-2 text-sm text-muted-foreground">{excerptOf(document.body) || "아직 작성한 내용이 없습니다."}</p>
        <div className="mt-auto flex min-w-0 items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
          <span className="flex min-w-0 max-w-[60%] items-center gap-1.5">
            <PersonAvatar id={document.updatedBy.id} name={document.updatedBy.name} />
            <span className="truncate">{document.updatedBy.name}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 tabular-nums">
            <CalendarIcon className="text-icon-muted" />
            {cardDateText(document.updatedAt)}
          </span>
        </div>
      </div>
    </li>
  )
}

/** 그리드 보기: 15rem 이상 카드가 칸을 채우고, 72rem 넘게 넓어지지 않는다. */
export function DocumentGrid({ projectKey, documents, labels }: ListProps) {
  return (
    <ul aria-label="문서" className="mx-auto grid w-full max-w-288 grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-3 p-4">
      {documents.map(document => <DocumentCard key={document.id} projectKey={projectKey} document={document} labels={labelsOf(document, labels)} />)}
    </ul>
  )
}

/**
 * 리스트 보기(호호코워크 PageList의 ListItem): 표식 · 제목과 본문 앞부분 · 라벨. 휴대폰은 라벨을 제목 아래에 둔다.
 * 줄은 자기 바탕을 칠해 페이지의 점 무늬를 가린다.
 */
export function DocumentRows({ projectKey, documents, labels }: ListProps) {
  return (
    <ul aria-label="문서" className="flex flex-col">
      {documents.map(document => (
        <li key={document.id} className="relative flex min-h-14 items-center gap-3 border-b bg-background px-4 py-2.5 hover:bg-row-hover max-md:items-start max-md:py-3">
          <DocumentIcon document={document} className="text-icon-muted max-md:mt-0.5 max-md:size-5" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <RowLink to={hrefOf(projectKey, document.id)} className="truncate font-medium">{document.title}</RowLink>
            <p className="truncate text-sm text-muted-foreground">{excerptOf(document.body) || "내용 없음"}</p>
            <DocumentLabels labels={labelsOf(document, labels)} className="pt-1 md:hidden" />
          </div>
          <DocumentLabels labels={labelsOf(document, labels)} className="shrink-0 justify-end max-md:hidden" />
        </li>
      ))}
    </ul>
  )
}
