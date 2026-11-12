import { useEffect, useRef, useState, type RefObject } from 'react';

const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

/** 본문을 스크롤하는 가장 가까운 상자. 없으면 창(null). */
function scrollRootOf(node: HTMLElement | null) {
  let current = node?.parentElement ?? null;
  while (current && !/(auto|scroll)/.test(getComputedStyle(current).overflowY)) current = current.parentElement;
  return current;
}

/**
 * 지금 읽는 제목. 기준선(스크롤 상자 위 + 제목의 scroll-margin-top)을 지난 마지막 제목이 기본이다. 문서 끝의 짧은 절들은
 * 끝까지 내려도 기준선에 닿지 못해 영원히 고르지 못하므로, 닿지 못하는 제목들에 남은 스크롤 구간(아래쪽 반 화면)을 고르게
 * 나눠 준다: 내려갈수록 하나씩 차례로 고르고, 맨 아래에서 마지막 제목이 된다.
 */
export function resolveActive(ids: string[], root: HTMLElement | null) {
  const elements = ids.map(id => document.getElementById(id));
  const rootTop = root ? root.getBoundingClientRect().top : 0;
  const scrollTop = root ? root.scrollTop : window.scrollY;
  const viewport = root ? root.clientHeight : window.innerHeight;
  const max = (root ? root.scrollHeight : document.documentElement.scrollHeight) - viewport;
  const remaining = Math.max(0, max - scrollTop);
  const line = (element: HTMLElement) => rootTop + (Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 0) + 8;
  let passed = 0;
  let firstUnreachable = -1;
  elements.forEach((element, index) => {
    if (!element) return;
    const top = element.getBoundingClientRect().top;
    if (top <= line(element)) passed = index;
    if (firstUnreachable < 0 && top - remaining > line(element)) firstUnreachable = index;
  });
  if (firstUnreachable < 0 || max <= 0) return ids[passed];
  const zone = Math.min(max, viewport * 0.5);
  const progress = Math.min(1, Math.max(0, (scrollTop - (max - zone)) / zone));
  if (progress <= 0) return ids[passed];
  // 닿지 못하는 제목 k개와 그 앞의 마지막으로 닿는 제목, 모두 k+1칸으로 나눈다.
  const unreachable = ids.length - firstUnreachable;
  const slot = Math.min(unreachable, Math.floor(progress * (unreachable + 1)));
  return ids[Math.max(passed, Math.max(0, firstUnreachable - 1 + slot))];
}

/**
 * 문서 안 목차의 선택: 스크롤 위치로 고르고, 목차를 누르면 사용자가 직접 스크롤(휠·터치·키)할 때까지 누른 제목을 지킨다.
 * 누른 제목이 문서 끝 근처라 기준선까지 못 올라가도 다른 제목으로 바뀌지 않는다.
 */
export function useTocSpy(ids: string[], article: RefObject<HTMLElement | null>) {
  const [active, setActive] = useState<string | undefined>(ids[0]);
  const pinned = useRef<string | null>(null);
  const key = ids.join('\n');
  useEffect(() => {
    if (!ids.length) return undefined;
    const root = scrollRootOf(article.current);
    const target: HTMLElement | Window = root ?? window;
    let frame = 0;
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { if (!pinned.current) setActive(resolveActive(ids, root)); });
    };
    const release = () => { pinned.current = null; };
    const onKey = (event: KeyboardEvent) => { if (SCROLL_KEYS.has(event.key)) release(); };
    target.addEventListener('scroll', sync, { passive: true });
    target.addEventListener('wheel', release, { passive: true });
    target.addEventListener('touchmove', release, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', sync);
    pinned.current = null;
    sync();
    return () => {
      cancelAnimationFrame(frame);
      target.removeEventListener('scroll', sync);
      target.removeEventListener('wheel', release);
      target.removeEventListener('touchmove', release);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', sync);
    };
    // ids는 key로 비교한다(같은 제목 목록이면 다시 걸지 않는다).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, article]);
  const pin = (id: string) => { pinned.current = id; setActive(id); };
  return [active, pin] as const;
}
