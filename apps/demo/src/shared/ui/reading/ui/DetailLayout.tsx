import type { ReactNode } from "react"
import { cn } from "cn"

/** 상세 속성의 한 묶음(속성 · 라벨 · 프로젝트 …): 넓은 옆 칸에서 이 이름 아래에 알약이 줄로 선다. */
export type DetailSection = { title: string; items: ReactNode }

type DetailLayoutProps = {
  /** 화면 읽기용 이름: "cowork-14 업무 제목". */
  label: string
  /** 제목 위 소속 줄: 프로젝트 · 키 · 상위 항목. */
  head?: ReactNode
  title: string
  /** 속성 알약 묶음. 한 번만 쓰고, 자리와 모양은 이 틀이 정한다. */
  sections: DetailSection[]
  /** 본문. */
  children: ReactNode
  /** 본문 뒤: 하위 항목 · 활동. */
  after?: ReactNode
}

/*
 * 넓은 상세(자기 폭 60rem 이상, 컨테이너 쿼리): 45rem 읽기 단과 오른쪽 16rem 속성 칸을 페이지 가운데에 둔다.
 * Tailwind는 완성된 클래스 이름만 읽으므로 @min-[60rem]/detail: 접두를 그대로 적는다.
 */
const GRID = [
  "mx-auto grid max-w-180 grid-cols-1 gap-y-4 px-4 pt-5 pb-10",
  "@min-[60rem]/detail:max-w-[calc(45rem+16rem+3rem+4rem)] @min-[60rem]/detail:grid-cols-[minmax(0,45rem)_16rem]",
  "@min-[60rem]/detail:grid-rows-[auto_auto_1fr] @min-[60rem]/detail:gap-x-12 @min-[60rem]/detail:px-8 @min-[60rem]/detail:pt-8 @min-[60rem]/detail:pb-12",
].join(" ")
const MAIN = "min-w-0 @min-[60rem]/detail:col-start-1"
const SIDE = [
  "flex min-w-0 flex-wrap gap-1.5",
  "@min-[60rem]/detail:sticky @min-[60rem]/detail:top-6 @min-[60rem]/detail:col-start-2 @min-[60rem]/detail:row-span-3 @min-[60rem]/detail:row-start-1",
  "@min-[60rem]/detail:flex-col @min-[60rem]/detail:flex-nowrap @min-[60rem]/detail:gap-6 @min-[60rem]/detail:self-start",
].join(" ")
const GROUP = "contents @min-[60rem]/detail:flex @min-[60rem]/detail:flex-col @min-[60rem]/detail:items-start @min-[60rem]/detail:gap-0.5"
const GROUP_TITLE = "hidden px-2 pb-1 text-xs font-medium text-muted-foreground @min-[60rem]/detail:block"

/** 상세의 제목. 본문 안의 어떤 소제목(26px)보다 크다. */
function DetailTitle({ children }: { children: string }) {
  return <h1 className="text-[2rem] leading-[1.3] font-bold tracking-[-0.025em] text-balance break-keep">{children}</h1>
}

/** 속성 묶음. 좁으면 묶음 이름 없이 알약이 한 줄로 이어지고(contents), 넓은 옆 칸에서는 이름 아래 세로 줄이 된다. */
function DetailProperties({ sections }: { sections: DetailSection[] }) {
  return (
    <aside aria-label="속성" className={SIDE}>
      {sections.map(section => (
        <section key={section.title} aria-label={section.title} className={GROUP}>
          <h2 className={GROUP_TITLE}>{section.title}</h2>
          {section.items}
        </section>
      ))}
    </aside>
  )
}

/**
 * 본문이 있는 것의 상세(호호코워크 DetailLayout, Linear 이슈 모양): 업무 · 일정 · 회의록 · 공지사항이 같이 쓴다.
 * 위에서 아래로 소속 줄, 제목, 본문과 그 뒤(하위 항목 · 활동)를 45rem 읽기 단에 둔다. 너비는 창이 아니라 자기 폭(컨테이너 쿼리)이다.
 * - 자기 폭이 60rem 이상이면 속성은 오른쪽 16rem 칸에 묶음 이름 아래 줄로 붙어 따라온다.
 * - 좁으면(휴대폰 포함) 제목과 본문 사이에 한 줄 알약으로 놓이고, 넘치면 다음 줄로 넘긴다. 스크롤은 페이지 본문이 맡는다.
 * 페이지의 점 무늬를 자기 바탕으로 가린다(상세 면에는 무늬가 없다).
 */
export function DetailLayout({ label, head, title, sections, children, after }: DetailLayoutProps) {
  return (
    <section aria-label={label} className="@container/detail min-w-0 flex-1 bg-background">
      <article className={GRID}>
        {head && <header className={MAIN}>{head}</header>}
        <header className={MAIN}><DetailTitle>{title}</DetailTitle></header>
        {sections.length > 0 && <DetailProperties sections={sections} />}
        <div className={cn(MAIN, "flex flex-col gap-5")}>
          <section aria-label="본문" className="flex min-w-0 flex-col gap-5">{children}</section>
          {after}
        </div>
      </article>
    </section>
  )
}
