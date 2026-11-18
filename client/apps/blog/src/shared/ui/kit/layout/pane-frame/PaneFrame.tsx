import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from 'cn';
import { Button, ButtonStyleProvider, type ButtonStyle } from '@/shared/ui/kit/button';
import { ChevronLeftIcon } from '@/shared/ui/kit/icon';
import { usePageChrome } from '@/shared/ui/kit/layout/page';

/** 오른쪽 도구 줄의 단추: 목록 머리의 둥근 도구(tool, 28px)와 같게. 이름 없는 ghost도 tool로 그린다. */
const TOOL_BUTTONS: ButtonStyle = { variant: variant => (variant === 'ghost' ? 'tool' : variant), size: 'icon-sm' };

/**
 * 목록-상세 분할 보기의 오른쪽 칸 틀(Linear 휴대폰 이슈 화면처럼). 구분선 없는 머리가 본문 위에 떠 있다: 바탕색을
 * 칠하고, 본문이 그 아래로 들어가면 서서히 사라지는 그늘이 구분선을 대신한다(서식 줄처럼 제 선을 가진 줄이 붙으면 두지 않는다). 머리 줄 왼쪽에 둥근 뒤로 단추, 오른쪽에 둥근 도구
 * 단추(메뉴 · 크게 보기 …), 보기 탭(본문 · 기록)이 있으면 그 아래 줄에 고정한다. 처음엔 이름을 두지 않고(본문의 큰 제목이
 * 이름이다), 그 제목(본문의 첫 h1 · h2)이 스크롤로 머리 아래로 들어가면 뒤로 단추 옆에 종류(label)와 이름(title)이 나타난다.
 * 제목이 없는 양식은 isTitleShown으로 늘 보인다.
 */
export function PaneFrame({ label, title, onBack, backLabel = '닫기', actions, below, isTitleShown = false, isPageHead = false, children }: {
  /** 이름 위 작은 줄: 무엇인지(공지사항 · 결재 · ISS-12). */
  label?: string;
  /** 이 항목의 이름. 스크롤해 본문 제목이 가려지면 머리 줄에 보인다. */
  title: string;
  onBack?: () => void;
  backLabel?: string;
  /** 오른쪽 도구. 단추는 둥글게 그린다. */
  actions?: ReactNode;
  /** 머리 줄 아래에 함께 고정할 것(보기 탭). */
  below?: ReactNode;
  /** 늘 이름을 보인다(본문에 큰 제목이 없는 양식). */
  isTitleShown?: boolean;
  /** 페이지 자체의 머리다(상세 · 작성 페이지): 맨 왼쪽에 사이드바 접기를 둔다. 목록 옆 칸 · 시트에서는 두지 않는다. */
  isPageHead?: boolean;
  children: ReactNode;
}) {
  const head = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  // 머리(머리 줄 + 보기 탭)의 높이: 본문은 이만큼 내려 시작하고, 제목이 이 선 위로 올라가면 이름이 나타난다.
  const [headHeight, setHeadHeight] = useState(52);
  const [isScrolled, setScrolled] = useState(false);
  useEffect(() => {
    const element = head.current;
    if (!element) return;
    const measure = () => setHeadHeight(element.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  // 스크롤마다 위치를 재지 않는다: 제목(첫 h1 · h2)이 머리 아래로 들어가고 나오는 순간만 IntersectionObserver가 알린다. 제목은 본문이
  // 읽힌 뒤에 생기므로 본문의 줄 추가 · 제거만 지켜보다가 나타나면 그때 붙는다. 제목이 없는 동안은 스크롤 위치로 판단한다.
  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    let heading: HTMLHeadingElement | null = null;
    const watch = new IntersectionObserver(([entry]) => {
      if (!entry?.rootBounds) return;
      setScrolled(!entry.isIntersecting && entry.boundingClientRect.bottom <= entry.rootBounds.top);
    }, { root: element, rootMargin: `-${headHeight}px 0px 0px 0px` });
    const find = () => {
      if (heading?.isConnected) return;
      if (heading) watch.unobserve(heading);
      heading = element.querySelector<HTMLHeadingElement>('h1, h2');
      if (heading) watch.observe(heading);
      else setScrolled(element.scrollTop > 24);
    };
    const scroll = () => { if (!heading) setScrolled(element.scrollTop > 24); };
    find();
    const content = new MutationObserver(find);
    content.observe(element, { childList: true, subtree: true });
    element.addEventListener('scroll', scroll, { passive: true });
    return () => { watch.disconnect(); content.disconnect(); element.removeEventListener('scroll', scroll); };
  }, [headHeight]);
  // 본문이 머리 아래로 들어갔는가(조금이라도 스크롤했는가): 그늘은 그때만 필요하다.
  const [isLifted, setLifted] = useState(false);
  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const scroll = () => setLifted(element.scrollTop > 0);
    scroll();
    element.addEventListener('scroll', scroll, { passive: true });
    return () => element.removeEventListener('scroll', scroll);
  }, []);
  const showsTitle = isTitleShown || isScrolled;
  const { sidebarToggle } = usePageChrome();
  return <div className="group/pane relative flex min-h-0 flex-1 flex-col">
    <h2 className="sr-only">{label ? `${label}: ${title}` : title}</h2>
    <div ref={head} className="absolute inset-x-0 top-0 z-20 bg-background">
      <div className="flex h-13 items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-2">
          {isPageHead ? sidebarToggle : null}
          {onBack ? <Button variant="tool" size="icon" aria-label={backLabel} title={backLabel} onClick={onBack} className="shrink-0"><ChevronLeftIcon /></Button> : null}
          <div aria-hidden className={cn('flex min-w-0 flex-col leading-tight transition-opacity duration-150', showsTitle ? 'opacity-100' : 'opacity-0')}>
            {label && !isTitleShown ? <span className="truncate text-xs text-muted-foreground">{label}</span> : null}
            <span className="truncate text-sm font-semibold">{title}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <ButtonStyleProvider value={TOOL_BUTTONS}>{actions}</ButtonStyleProvider>
        </div>
      </div>
      {below ? <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">{below}</div> : null}
      {/* 구분선 대신: 머리 아래로 본문이 서서히 사라진다. 본문이 머리 아래로 들어갔을 때만 보인다(맨 위에서는 가릴 것이 없다).
          머리 바로 아래에 제 아래 선을 가진 줄이 붙는 화면(본문 편집의 서식 줄)은 그 선이 이미 나누므로 그늘을 두지 않는다:
          그늘이 서식 줄을 덮어 흐려 보인다. */}
      <div aria-hidden className={cn('pointer-events-none absolute inset-x-0 top-full h-6 bg-linear-to-b from-background to-transparent transition-opacity duration-150 group-has-[.rd-format-bar]/pane:hidden',
        isLifted ? 'opacity-100' : 'opacity-0')} />
    </div>
    {/* check-ui: allow-style 머리 높이(보기 탭이 있으면 더 높다)를 재어 본문을 그만큼 내린다. */}
    <div ref={scroller} style={{ paddingTop: headHeight }} className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">{children}</div>
  </div>;
}
