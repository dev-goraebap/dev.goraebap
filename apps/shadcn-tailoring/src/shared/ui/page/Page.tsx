import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { Button } from "@/shared/ui/button"
import { ArrowLeftIcon, ChevronRightIcon, PlusIcon, type Icon } from "@/shared/ui/icon"
import { useFullScreen, usePageChrome } from "./chrome"

/** 경로의 한 단계. 마지막 단계가 이 페이지다. */
export type Crumb = { label: string; href?: string; icon?: Icon }
export type CreateAction = { label: string; onClick: () => void }

type PageProps = {
  crumbs: Crumb[]
  /** 머리 줄 오른쪽: 페이지 메뉴(…) 같은 이 페이지 자체의 동작. */
  actions?: ReactNode
  /** 만들기. 데스크톱은 머리 줄 끝 버튼, 휴대폰은 하단 탭 위 FAB. */
  create?: CreateAction
  /** 툴바 왼쪽: 뷰 · 탭(PageViews). */
  views?: ReactNode
  /** 툴바 오른쪽: 필터 · 표시 · 검색 도구. */
  tools?: ReactNode
  /** 툴바 아래, 본문 위: 걸린 필터 줄 같은 것. */
  below?: ReactNode
  /** 상세 · 양식 페이지: 휴대폰에서 전체 화면(하단 탭 없이, 앱 바는 ← · 제목 · 페이지 메뉴만). */
  isFullScreen?: boolean
  children: ReactNode
}

/**
 * 목록 같은 상위 페이지의 틀(호호코워크 Page). 데스크톱: 52px 머리 줄(경로 · 동작 · 만들기) + 44px 툴바(뷰 · 도구).
 * 휴대폰: 52px 앱 바(뒤로 · 제목 · 공통 도구) + 52px 도구 줄, 만들기는 FAB. 본문은 남은 높이를 채우고 스스로 스크롤한다.
 */
export function Page({ crumbs, actions, create, views, tools, below, isFullScreen = false, children }: PageProps) {
  const isMobile = useIsMobile()
  useFullScreen(isMobile && isFullScreen)
  const hasToolbar = Boolean(views || tools)
  return (
    <div data-slot="page" className="flex min-h-0 flex-1 flex-col">
      {isMobile ? <PageAppBar crumbs={crumbs} actions={actions} isFullScreen={isFullScreen} /> : <PageHeader crumbs={crumbs} actions={actions} create={create} />}
      {hasToolbar && (
        <div data-slot="page-toolbar" className="flex h-13 shrink-0 items-center gap-2 border-b px-4 md:h-11">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">{views}</div>
          {tools && <div className="flex shrink-0 items-center gap-1.5">{tools}</div>}
        </div>
      )}
      {below}
      <div data-slot="page-body" className="relative flex min-h-0 flex-1 flex-col overflow-y-auto bg-dots">{children}</div>
      {isMobile && create && (
        <Button variant="create" size="icon-lg" aria-label={create.label} onClick={create.onClick}
          className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 size-14 rounded-2xl">
          <PlusIcon className="size-6" />
        </Button>
      )}
    </div>
  )
}

/** 데스크톱 머리 줄: 왼쪽 경로, 오른쪽 동작과 만들기. */
function PageHeader({ crumbs, actions, create }: Pick<PageProps, "crumbs" | "actions" | "create">) {
  return (
    <header data-slot="page-header" className="flex h-13 shrink-0 items-center gap-2 border-b px-4">
      <nav aria-label="경로" className="flex min-w-0 flex-1 items-center gap-1 text-sm">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          return (
            <span key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1">
              {index > 0 && <ChevronRightIcon className="size-3.5 shrink-0 text-icon-muted" />}
              {isLast ? (
                <span aria-current="page" className="flex min-w-0 items-center gap-1.5 font-semibold">
                  {crumb.icon && <crumb.icon className="shrink-0" />}
                  <span className="truncate">{crumb.label}</span>
                </span>
              ) : crumb.href ? (
                <Link to={crumb.href} className="shrink-0 font-medium text-muted-foreground hover:text-foreground">{crumb.label}</Link>
              ) : (
                <span className="shrink-0 font-medium text-muted-foreground">{crumb.label}</span>
              )}
            </span>
          )
        })}
      </nav>
      {actions}
      {create && (
        <Button variant="create" onClick={create.onClick}>
          <PlusIcon data-icon="inline-start" />
          {create.label}
        </Button>
      )}
    </header>
  )
}

/** 휴대폰 앱 바: 위 단계가 있으면 ←, 이 페이지 이름, 페이지 메뉴, 오른쪽에 공통 도구(전체 화면이면 없음). */
function PageAppBar({ crumbs, actions, isFullScreen }: Pick<PageProps, "crumbs" | "actions" | "isFullScreen">) {
  const { tools: chrome } = usePageChrome()
  const current = crumbs[crumbs.length - 1]
  const parent = [...crumbs].slice(0, -1).reverse().find(crumb => crumb.href)
  return (
    <header data-slot="page-app-bar" className="flex h-13 shrink-0 items-center gap-1 border-b px-2">
      {parent?.href ? (
        <Button variant="ghost" size="icon" aria-label={`${parent.label}(으)로`} nativeButton={false} render={<Link to={parent.href} />}>
          <ArrowLeftIcon />
        </Button>
      ) : (
        current.icon && <current.icon className="mx-2 size-6 shrink-0" />
      )}
      <h1 className="min-w-0 truncate text-base font-semibold">{current.label}</h1>
      {actions}
      {!isFullScreen && <div className="ml-auto flex shrink-0 items-center gap-0.5">{chrome}</div>}
    </header>
  )
}
