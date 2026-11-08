import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { icon, type IconName } from '../../foundations/icons/solar-icon';
import { useIsPhone, useToolSize } from '../../foundations/media';
import styles from './page.module.css';

/**
 * 머리 아래 툴바: 44px(휴대폰 52px). 왼쪽은 보기·탭이 자기 안에서 가로로 넘기고(넘친 쪽 가장자리를 흐리게, 세로 휠도
 * 가로로), 오른쪽 도구(검색·필터·표시)는 고정한다. 페이지 전체는 가로로 넘치지 않는다.
 */
export function PageToolbar({ start, end }: { start?: ReactNode; end?: ReactNode }) {
  const isPhone = useIsPhone();
  const hasViews = !!start;
  const views = useRef<HTMLElement>(null);
  const [more, setMore] = useState({ start: false, end: false });
  const measure = () => {
    const box = views.current;
    if (!box) return;
    setMore({ start: box.scrollLeft > 1, end: box.scrollLeft + box.clientWidth < box.scrollWidth - 1 });
  };
  useEffect(() => {
    const box = views.current;
    if (!box) return undefined;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    const wheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX) || box.scrollWidth <= box.clientWidth) return;
      box.scrollLeft += event.deltaY;
      event.preventDefault();
    };
    box.addEventListener('wheel', wheel, { passive: false });
    return () => { observer.disconnect(); box.removeEventListener('wheel', wheel); };
  }, [hasViews]);
  return <HStack className={styles.rule} height={isPhone ? '3.25rem' : '2.75rem'} paddingInline={4} gap={3} vAlign="center" hAlign={hasViews ? undefined : 'end'}>
    {/* Stack은 자식을 줄이지 않으므로 줄어들며 넘길 이 영역은 자기 요소로 둔다. */}
    {hasViews ? <nav ref={views} className={styles.views} aria-label="보기" onScroll={measure}
      data-more-start={more.start || undefined} data-more-end={more.end || undefined}>{start}</nav> : null}
    {end ? <HStack className={styles.tools} gap={1} vAlign="center">{end}</HStack> : null}
  </HStack>;
}

/** 툴바 아래 적용한 필터 줄: 데스크톱 40px, 휴대폰은 칩이 자기 여백을 가진다. */
export function PageAppliedFilters({ children }: { children: ReactNode }) {
  const isPhone = useIsPhone();
  if (!children) return null;
  return isPhone ? children : <HStack className={styles.rule} height="2.5rem" paddingInline={4} vAlign="center">{children}</HStack>;
}

export type PageView = { id: string; label: string; icon?: IconName };

/**
 * 고정된 탭이나 저장한 보기를 알약으로: 아이콘과 이름, 현재 것은 눌린 모양(view-active, Bold Duotone, aria-pressed).
 * isCompact는 공간이 좁은 휴대폰에서 아이콘만 두고 이름을 툴팁으로.
 */
export function PageViews({ views, value, onChange, isCompact = false }: {
  views: PageView[]; value: string; onChange: (id: string) => void; isCompact?: boolean;
}) {
  const size = useToolSize();
  return <HStack gap={1} vAlign="center">
    {views.map(view => {
      const isCurrent = view.id === value;
      return <Button key={view.id} size={size} label={view.label} variant={isCurrent ? 'view-active' : 'view'} aria-pressed={isCurrent}
        isIconOnly={isCompact && !!view.icon} tooltip={isCompact ? view.label : undefined}
        icon={view.icon ? icon(view.icon, isCurrent) : undefined} onClick={() => onChange(view.id)} />;
    })}
  </HStack>;
}
