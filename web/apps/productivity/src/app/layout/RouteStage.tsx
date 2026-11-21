import { Outlet, useRouterState } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { cn } from 'cn';
import { isWorkItemViewChange } from '../router/work-item-view-transition';

/** 이 시간 안에 끝나는 이동에는 진행 막대를 띄우지 않는다. */
const SHOW_AFTER_MS = 150;
/** 한 번 띄운 막대는 이만큼은 두어 깜빡이지 않게 한다. */
const KEEP_AT_LEAST_MS = 300;

/**
 * 화면 이동의 진행 표시. 가리는 판(오버레이)을 두지 않는다: 캐시가 있는 이동은 즉시 그리고(stale-while-revalidate),
 * 캐시가 없어 다음 화면을 준비하는 동안은 지금 화면을 그대로 두고, 콘텐츠 카드의 위쪽 테두리가 테마 강조색으로 은은하게
 * 흐르며 빛난다(top loading indicator). 카드 위에 겹쳐 그리므로 배치는 움직이지 않는다. 150ms 안에 끝나면 띄우지 않고,
 * 띄웠으면 최소 300ms 둔 뒤 새 화면과 함께 내린다. 앱 첫 진입만 스플래시 화면(BootCover)이 덮는다.
 * 콘텐츠 영역 하나가 화면 전환의 교차 페이드 단위(view-transition-name: cowork-content, app/styles/index.css)다.
 */
export function RouteStage() {
  const moving = useRouterState({ select: state => state.status === 'pending' && !!state.resolvedLocation
    && (state.location.pathname !== state.resolvedLocation.pathname || isWorkItemViewChange(state.resolvedLocation, state.location)) });
  const [shown, setShown] = useState(false);
  const shownAt = useRef(0);
  useEffect(() => {
    if (moving) {
      const timer = setTimeout(() => { shownAt.current = Date.now(); setShown(true); }, SHOW_AFTER_MS);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setShown(false), Math.max(0, KEEP_AT_LEAST_MS - (Date.now() - shownAt.current)));
    return () => clearTimeout(timer);
  }, [moving]);
  return (
    <div className="relative isolate flex h-full min-h-0 min-w-0 flex-col" aria-busy={moving}>
      {/* 늘 그려 두고 보이기만 바꾼다(나타나고 사라질 때 부드럽게). 화면 읽기 프로그램에는 상태 문구로 알린다. */}
      <div aria-hidden data-route-progress={shown ? '' : undefined}
        className={cn('route-glow pointer-events-none absolute inset-x-0 top-0 z-4 h-0.5 opacity-0 transition-opacity duration-240',
          shown && 'opacity-100 motion-safe:animate-[route-glow-flow_1.6s_ease-in-out_infinite,route-glow-breathe_2.4s_ease-in-out_infinite]')} />
      <p className="sr-only" role="status" aria-live="polite">{shown ? '다음 화면을 불러오는 중' : ''}</p>
      {/* 전환 스냅숏은 상위 카드의 잘림을 상속하지 않으므로 캡처 대상 자체에서 넘치는 메뉴와 스크롤을 자른다. */}
      <div className="route-content flex h-full min-h-0 min-w-0 flex-col overflow-clip"><Outlet /></div>
    </div>
  );
}
