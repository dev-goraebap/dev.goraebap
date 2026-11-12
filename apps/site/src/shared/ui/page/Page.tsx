import { Link } from "@tanstack/react-router"
import { useCallback, useMemo, useState, type ReactNode } from "react"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { ArrowLeftIcon, ChevronRightIcon, PlusIcon, type Icon } from "@/shared/ui/icon"
import { PageTitleProvider, useFullScreen, usePageChrome } from "./chrome"

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
  /** 휴대폰 앱 바 ←를 위 단계 링크 대신 이 함수로 둔다(고친 것을 버릴지 먼저 묻는 수정 화면). */
  onBack?: () => void
  /**
   * 바닥에 고정한 동작 줄(상세의 반려 · 승인, 양식 · 설정의 저장). 본문 스크롤 밖 맨 아래에 붙어 늘 보인다. 동작만 둔다.
   * 데스크톱은 오른쪽 끝에 모으고, 휴대폰은 44px 단추(짧은 이름도 88px 이상)에 마지막 단추가 남은 폭을 채운다.
   */
  footer?: ReactNode
  /** 동작 줄의 이름("변경 사항 저장"). 주면 이름 붙은 구역(region)이 된다. */
  footerLabel?: string
  children: ReactNode
}

/**
 * 목록 같은 상위 페이지의 틀(호호코워크 Page). 데스크톱: 52px 머리 줄(경로 · 동작 · 만들기) + 44px 툴바(뷰 · 도구).
 * 휴대폰: 60px 이상 앱 바(44px 뒤로 · 제목 · 공통 도구, 위아래 8px) + 60px 이상 도구 줄, 만들기는 FAB. 본문은 남은 높이를 채우고 스스로 스크롤한다.
 */
export function Page({ crumbs, actions, create, views, tools, below, isFullScreen = false, onBack, footer, footerLabel, children }: PageProps) {
  const isMobile = useIsMobile()
  useFullScreen(isMobile && isFullScreen)
  const hasToolbar = Boolean(views || tools)
  // 본문이 h1을 그리겠다고 알린 수. 하나라도 있으면 머리 줄은 h1을 두지 않는다(chrome.tsx의 useOwnPageTitle).
  const [titleClaims, setTitleClaims] = useState(0)
  const claim = useCallback(() => {
    setTitleClaims(count => count + 1)
    return () => setTitleClaims(count => count - 1)
  }, [])
  const title = useMemo(() => ({ claim }), [claim])
  const hasOwnTitle = titleClaims > 0
  return (
    <div data-slot="page" className="flex min-h-0 flex-1 flex-col">
      {isMobile
        ? <PageAppBar crumbs={crumbs} actions={actions} isFullScreen={isFullScreen} onBack={onBack} hasOwnTitle={hasOwnTitle} />
        : <PageHeader crumbs={crumbs} actions={actions} create={create} hasOwnTitle={hasOwnTitle} />}
      {hasToolbar && (
        <div data-slot="page-toolbar" className="flex min-h-15 shrink-0 items-center gap-2 border-b px-4 md:h-11 md:min-h-0">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">{views}</div>
          {tools && <div className="flex shrink-0 items-center gap-1.5">{tools}</div>}
        </div>
      )}
      {below}
      <div data-slot="page-body" className="relative flex min-h-0 flex-1 flex-col overflow-y-auto bg-dots">
        <PageTitleProvider value={title}>{children}</PageTitleProvider>
      </div>
      {footer && (
        <div data-slot="page-footer" role={footerLabel ? "region" : undefined} aria-label={footerLabel}
          className={cn(
            "flex shrink-0 items-center justify-end gap-2 border-t bg-background px-4 py-2",
            "max-md:min-h-15 max-md:[&_[data-slot=button]]:h-11 max-md:[&_[data-slot=button]]:min-w-22 max-md:[&>[data-slot=button]:last-child]:flex-1",
            // 하단 탭이 없는 전체 화면이면 홈 표시줄 몫을 이 줄이 진다(하단 탭이 있으면 탭이 진다).
            isMobile && isFullScreen && "pb-[calc(0.5rem+env(safe-area-inset-bottom))]",
          )}>
          {footer}
        </div>
      )}
      {isMobile && create && (
        <Button variant="create" size="icon-lg" aria-label={create.label} onClick={create.onClick}
          className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 size-14 rounded-2xl">
          <PlusIcon className="size-6" />
        </Button>
      )}
    </div>
  )
}

/** 경로의 위 단계: 보조 글자색 · 500, 아이콘이 있으면 이름 앞에(프로젝트처럼). */
const MIDDLE_CRUMB = "flex shrink-0 items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground [&_svg]:shrink-0"

/**
 * 위 단계 링크는 정확히 같은 주소일 때만 현재로 친다. 기본(접두 일치)이면 지금 페이지의 위 단계마다 aria-current="page"가 붙는다.
 */
const PARENT_CRUMB = { exact: true, includeSearch: true } as const

/** 데스크톱 머리 줄: 왼쪽 경로(마지막은 아이콘과 이름, 위 단계도 아이콘이 있으면 함께), 오른쪽 동작과 만들기. */
function PageHeader({ crumbs, actions, create, hasOwnTitle }: Pick<PageProps, "crumbs" | "actions" | "create"> & { hasOwnTitle: boolean }) {
  return (
    <header data-slot="page-header" className="flex h-13 shrink-0 items-center gap-2 border-b px-4">
      {/* 경로는 이동만 맡고, 제목(h1)은 따로 둔다. 본문이 제목을 그리면 그것이 h1이다. */}
      {!hasOwnTitle && <h1 className="sr-only">{crumbs[crumbs.length - 1].label}</h1>}
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
                <Link to={crumb.href} activeOptions={PARENT_CRUMB} className={MIDDLE_CRUMB}>{crumb.icon && <crumb.icon className="text-icon-muted" />}{crumb.label}</Link>
              ) : (
                <span className={MIDDLE_CRUMB}>{crumb.icon && <crumb.icon className="text-icon-muted" />}{crumb.label}</span>
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
function PageAppBar({ crumbs, actions, isFullScreen, onBack, hasOwnTitle }: Pick<PageProps, "crumbs" | "actions" | "isFullScreen" | "onBack"> & { hasOwnTitle: boolean }) {
  const Title = hasOwnTitle ? "p" : "h1"
  const { tools: chrome } = usePageChrome()
  const current = crumbs[crumbs.length - 1]
  const parent = [...crumbs].slice(0, -1).reverse().find(crumb => crumb.href)
  return (
    <header data-slot="page-app-bar" className="flex min-h-15 shrink-0 items-center gap-1 border-b px-2 py-2">
      {onBack ? (
        <Button variant="ghost" size="icon" className="size-11" aria-label={parent ? `${parent.label}(으)로` : "뒤로"} onClick={onBack}>
          <ArrowLeftIcon />
        </Button>
      ) : parent?.href ? (
        <Button variant="ghost" size="icon" className="size-11" aria-label={`${parent.label}(으)로`} nativeButton={false} render={<Link to={parent.href} />}>
          <ArrowLeftIcon />
        </Button>
      ) : (
        current.icon && <current.icon className="mx-2 size-6 shrink-0" />
      )}
      <Title className="min-w-0 truncate text-base font-semibold">{current.label}</Title>
      {actions}
      {!isFullScreen && <div className="ml-auto flex shrink-0 items-center gap-0.5">{chrome}</div>}
    </header>
  )
}
