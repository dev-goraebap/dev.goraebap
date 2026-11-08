import { EmptyState } from '@astryxdesign/core/EmptyState';
import { VStack } from '@astryxdesign/core/VStack';
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { StateLandscape, type StateKind } from './StateLandscape';
import styles from './state.module.css';

export type { StateKind };

/** 페이지의 상태 문구가 시작하는 창 높이의 비율. 위의 막대 구성과 무관하게 같은 자리에 둔다. */
const ANCHOR = 0.32;

/**
 * 보여 줄 것이 없을 때의 상태: 빈 목록, 검색·필터 결과 없음, 없는 대상, 조회 실패를 구분한다. 그림·제목·필요할 때의
 * 설명·다음 행동. 페이지에서는 창 높이의 32%에 문구를 고정해 필터 줄·탭이 다른 페이지 사이를 오가도 흔들리지 않는다.
 * 방이 짧으면 가능한 만큼 내린다. isCompact(패널·대화상자·작은 구역)는 방 위쪽에 둔다.
 * 로딩이나 기존 내용이 있는 재조회 실패에는 쓰지 않는다.
 */
export function PageState({ kind, title, description, action, illustration, isCompact = false }: {
  kind: StateKind; title: string; description?: string; action?: ReactNode; illustration?: ReactNode; isCompact?: boolean;
}) {
  const room = useRef<HTMLDivElement>(null);
  const group = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const box = room.current;
    const content = group.current;
    if (isCompact || !box || !content) return undefined;
    const place = () => {
      const top = box.getBoundingClientRect().top;
      const spare = box.getBoundingClientRect().height - content.getBoundingClientRect().height + (parseFloat(content.style.marginBlockStart) || 0);
      content.style.marginBlockStart = `${Math.round(Math.min(Math.max(window.innerHeight * ANCHOR - top, 0), Math.max(spare, 0)))}px`;
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(box);
    observer.observe(content);
    window.addEventListener('resize', place);
    return () => { observer.disconnect(); window.removeEventListener('resize', place); };
  }, [isCompact]);
  return <VStack ref={room} width="100%" height={isCompact ? undefined : '100%'} hAlign="center" paddingInline={4}>
    <VStack ref={group} width="100%" hAlign="center">
      <EmptyState className={styles.state} icon={illustration ?? <StateLandscape kind={kind} />} title={title} description={description} actions={action} />
    </VStack>
  </VStack>;
}
