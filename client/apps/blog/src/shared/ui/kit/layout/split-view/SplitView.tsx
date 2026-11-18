import { useLocation, useNavigate } from '@tanstack/react-router';
import { createContext, useCallback, useContext, useEffect, useMemo, type ComponentProps, type ReactNode } from 'react';
import { cn } from 'cn';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { useStoredWidth } from '@/shared/lib/use-stored-width';
import { Button } from '@/shared/ui/kit/button';
import { MaximizeIcon, MinimizeIcon, SquareArrowOutUpRightIcon } from '@/shared/ui/kit/icon';
import { Page, type CreateAction, type Crumb } from '@/shared/ui/kit/layout/page';
import { PageState } from '@/shared/ui/kit/page-state';
import { PaneResizeHandle } from '@/shared/ui/kit/pane-resize-handle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/kit/tooltip';
import { PaneFrame } from '@/shared/ui/kit/layout/pane-frame';

/**
 * 목록-상세 분할 보기의 왼쪽 목록 너비. 처음 너비(560px = 35rem)가 가장 좁은 너비라 줄일 수는 없고, 720px(45rem)까지
 * 넓힐 수 있다. 저장된 값이 더 좁으면 560px로 올라온다. 휴대폰은 전체 너비.
 */
const LIST_MIN_WIDTH = 560;
const LIST_MAX_WIDTH = 720;

/** 고른 것을 푸는 길: 분할 보기가 오른쪽 칸 머리의 ← 에 내려 준다. */
const SplitCloseContext = createContext<(() => void) | undefined>(undefined);

/** 상세만 크게 보기(목록 접기): 지금 접혔는지와 접고 펴는 길. 분할 보기의 오른쪽 칸 안에서만 있다. */
const SplitFocusContext = createContext<{ isFocused: boolean; toggle: () => void } | undefined>(undefined);

/** 주소의 ?focus: 있으면 목록을 접고 상세만 보인다(새로고침해도 남는다). */
const FOCUS_PARAM = 'focus';

/** A state the list is in instead of rows (nothing yet, nothing matching, a failure), as PageState takes it. */
export type SplitState = ComponentProps<typeof PageState>;

/** 분할 화면의 경로 한 단계(Page의 경로와 같다). */
export type SplitCrumb = Crumb;

/** 페이지의 머리와 도구 줄. Page가 그린다. */
export type SplitTopProps = {
  crumbs: SplitCrumb[];
  /** The page's own actions on the right of the head (a menu). */
  pageActions?: ReactNode;
  /** The views or tabs; with them the page has a toolbar. */
  views?: ReactNode;
  tools?: ReactNode;
  /** What is in force under the toolbar (the applied filters). */
  applied?: ReactNode;
  create?: CreateAction;
};

/** An icon button of the detail's bar with its name as a tooltip: 28px on a desktop, 44px on a phone. */
function BarButton({ label, tip, onClick, children }: { label: string; tip: string; onClick: () => void; children: ReactNode }) {
  return <Tooltip>
    <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label={label} onClick={onClick} className="max-md:size-11" />}>
      {children}
    </TooltipTrigger>
    <TooltipContent className="max-md:hidden">{tip}</TooltipContent>
  </Tooltip>;
}

/** 아무것도 고르지 않았을 때 오른쪽 칸이 보이는 그림과 말. 화면마다 자기 것을 준다. */
export type SplitPlaceholder = { title: string; description?: string; illustration: ReactNode };

/**
 * 목록-상세 분할 보기(리소스 패턴 List-Detail). 데스크톱: 왼쪽은 키트 Page가 머리를 단, 따로
 * 스크롤하는 목록(구분선을 끌거나 키보드로 560~720px, 이 브라우저에 남는다), 오른쪽은 고른 항목의 칸(없으면 점 무늬 위의
 * 그림과 안내). 고른 것이 있으면 ?focus로 목록을 접어 크게 볼 수 있다. 휴대폰은 목록만 보이고 고르면 그 항목의 페이지로 간다.
 */
export function SplitView({ list, listHeader, state, detail, label, onClose, crumbs, pageActions, views, tools, applied, create,
  placeholder, widthKey }: SplitTopProps & {
  /** The rows; null while they are read. */
  list: ReactNode;
  listHeader?: ReactNode;
  state?: SplitState;
  /** The chosen item's detail; omit it while nothing is chosen. */
  detail?: ReactNode;
  /** The list's name for assistive technology (받은 알림, 결재함). */
  label: string;
  /** Lets nothing be chosen again: the ← at the start of the detail's bar. */
  onClose?: () => void;
  /** 아무것도 고르지 않았을 때 오른쪽 칸. */
  placeholder: SplitPlaceholder;
  /** 이 브라우저가 목록 너비를 기억하는 키. 화면마다(또는 함께 넘나드는 화면끼리) 하나. */
  widthKey: string;
}) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const pathname = useLocation({ select: location => location.pathname });
  const searchStr = useLocation({ select: location => location.searchStr });
  // 고른 것이 있을 때만 접는다. 상세를 닫으면(주소가 목록으로) 접기도 풀린다.
  const isFocused = !!detail && new URLSearchParams(searchStr).has(FOCUS_PARAM);
  const setFocused = useCallback((next: boolean) => {
    const search = new URLSearchParams(searchStr);
    if (next) search.set(FOCUS_PARAM, '1'); else search.delete(FOCUS_PARAM);
    const query = search.toString();
    void navigate({ href: `${pathname}${query ? `?${query}` : ''}`, replace: true });
  }, [navigate, pathname, searchStr]);
  // Esc가 크게 보기를 푼다. 열린 대화상자 · 메뉴가 있거나 글을 쓰는 중이면 그쪽 몫이다.
  useEffect(() => {
    if (!isFocused) return;
    const press = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable="true"]')) return;
      if (document.querySelector('[role=dialog], [role=alertdialog], [role=menu], [role=listbox]')) return;
      setFocused(false);
    };
    window.addEventListener('keydown', press);
    return () => window.removeEventListener('keydown', press);
  }, [isFocused, setFocused]);
  // 오른쪽 칸에 내려 주는 값은 바뀔 때만 새로 만든다(칸 안의 크게 보기 단추가 목록 쪽 렌더마다 다시 그려지지 않게).
  const focus = useMemo(() => ({ isFocused, toggle: () => setFocused(!isFocused) }), [isFocused, setFocused]);
  const [width, resize] = useStoredWidth({ key: widthKey, min: LIST_MIN_WIDTH, max: LIST_MAX_WIDTH, initial: LIST_MIN_WIDTH });
  // The applied filters and the list's own head stay above the rows, outside what scrolls.
  const page = <Page crumbs={crumbs} actions={pageActions} views={views} tools={tools} create={create}
    below={applied || listHeader ? <>{applied}{listHeader}</> : undefined}>
    <div aria-label={isMobile ? label : undefined} className="flex min-h-0 flex-1 flex-col">{state ? <PageState {...state} /> : list}</div>
  </Page>;
  if (isMobile) return page;
  return <div className="flex h-full min-h-0 flex-1">
    {/* 크게 보기에서는 목록을 숨긴다(그 자리 · 스크롤 · 검색은 그대로 남아 다시 펴면 돌아온다). */}
    {/* check-ui: allow-style 사용자가 끌어 정한 목록 너비(px)는 데이터 값이다. */}
    <section aria-label={label} hidden={isFocused} className="flex max-w-[58%] min-w-0 shrink-0 flex-col" style={{ width }}>{page}</section>
    {isFocused ? null : <PaneResizeHandle label={`${label} 목록 너비`} value={width} min={LIST_MIN_WIDTH} max={LIST_MAX_WIDTH} onChange={resize} />}
    <section aria-label="고른 항목" className={cn('flex min-w-0 flex-1 flex-col', !detail && 'bg-dots')}>
      {detail ? <SplitCloseContext value={onClose}><SplitFocusContext value={focus}>{detail}</SplitFocusContext></SplitCloseContext>
        : <PageState kind="empty" illustration={placeholder.illustration}
          title={placeholder.title} description={placeholder.description} />}
    </section>
  </div>;
}

/**
 * 상세만 크게 보기(⤢) · 목록 다시 보기(⤡): 분할 보기의 오른쪽 칸 머리 줄에 둔다. 칸 밖(휴대폰 페이지 · 대화상자)에서는 그리지 않는다.
 */
export function SplitFocusButton() {
  const focus = useContext(SplitFocusContext);
  if (!focus) return null;
  return focus.isFocused
    ? <BarButton label="목록 다시 보기" tip="목록 다시 보기 (Esc)" onClick={focus.toggle}><MinimizeIcon /></BarButton>
    : <BarButton label="크게 보기" tip="크게 보기" onClick={focus.toggle}><MaximizeIcon /></BarButton>;
}

/**
 * The way from an item shown in an inbox (or a phone's page of it) to the item's own page, as Linear's inbox opens an issue.
 * 주소가 바뀌어 그 항목이 사는 화면으로 건너가므로, 크게 보기(⤢)가 아니라 바로가기(↗) 모양이다.
 */
export function OpenPageButton({ href }: { href: string }) {
  const navigate = useNavigate();
  return <BarButton label="원래 화면으로 가기" tip="원래 화면으로 가기" onClick={() => void navigate({ href })}><SquareArrowOutUpRightIcon /></BarButton>;
}

/**
 * A chosen item in the inbox's detail under its bar, at the height of a page's head and ruled the same: what it is
 * (label: 결재, 공지사항, ISS-12) on the left after a ← that lets nothing be chosen again (the inbox's onClose); its menu, if
 * it has one, and the way to its own page (href) on the right. The item scrolls under the bar.
 */
export function SplitDetail({ label, title, href, menu, children }: { label: string; title?: string; href?: string; menu?: ReactNode; children: ReactNode }) {
  const close = useContext(SplitCloseContext);
  return <PaneFrame label={label} title={title ?? label} onBack={close} backLabel="고른 항목 닫기"
    actions={<>{menu}<SplitFocusButton />{href ? <OpenPageButton href={href} /> : null}</>}>
    {children}
  </PaneFrame>;
}

/**
 * A chosen item laid out in the inbox's detail as a settings page lays out its column (SettingsPage without its head):
 * one column 720px wide at most down the middle, the item's title and its line, then its sections.
 */
export function SplitColumn({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return <div className="flex justify-center px-4 py-10">
    <div className="flex w-full max-w-180 flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description ? <div className="text-sm text-muted-foreground">{description}</div> : null}
      </div>
      {children}
    </div>
  </div>;
}
