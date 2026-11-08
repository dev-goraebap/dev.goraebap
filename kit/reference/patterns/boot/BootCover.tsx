import { Text } from '@astryxdesign/core/Text';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import defaultMark from './boot-mark.svg?raw';
import styles from './boot.module.css';

/**
 * 첫 방문 덮개. index.html에 미리 넣은 덮개(bootCover 플러그인)와 같은 모양으로 그 자리를 이어받고, 첫 경로의 데이터가
 * 준비되면(isReady) 걷는다. 너무 빨리 걷혀 깜빡이지 않도록 최소 0.3초 보이고 0.7초에 걸쳐 걷는다. 덮개 아래의 첫 화면은
 * 이미 다 그려져 있으므로 걷히는 동안 두 화면이 반쯤 섞이지 않는다. 이후 화면 전환에는 쓰지 않는다.
 *
 *   // TanStack Router: 첫 경로가 풀리면 준비됨
 *   const [isReady, setReady] = useState(false);
 *   useEffect(() => router.subscribe('onResolved', () => setReady(true)), [router]);
 */
export function BootCover({ isReady, mark, label = '불러오는 중입니다' }: {
  isReady: boolean;
  /** 제품의 표시. 없으면 중립 기본 그림. */
  mark?: ReactNode;
  label?: string;
}) {
  const shownAt = useRef(performance.now());
  const [isVisible, setVisible] = useState(true);
  const [isGone, setGone] = useState(false);
  useEffect(() => {
    if (!isReady) return undefined;
    const lift = window.setTimeout(() => setVisible(false), Math.max(0, 300 - (performance.now() - shownAt.current)));
    return () => window.clearTimeout(lift);
  }, [isReady]);
  if (isGone) return null;
  return <div className={styles.cover} data-visible={isVisible || undefined} aria-hidden={isVisible ? undefined : true}
    role={isVisible ? 'status' : undefined} aria-label={isVisible ? label : undefined}
    onTransitionEnd={event => { if (!isVisible && event.target === event.currentTarget) setGone(true); }}>
    <span className={styles.mark} aria-hidden="true">{mark ?? <span dangerouslySetInnerHTML={{ __html: defaultMark }} />}</span>
    <Text type="supporting" color="secondary">{label}</Text>
  </div>;
}
