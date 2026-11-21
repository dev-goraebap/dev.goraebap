import { useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';

/** 같은 주소를 다시 준비하기 전에 기다리는 시간. 그 안의 재방문은 이미 받은 캐시로 즉시 그린다. */
const AGAIN_MS = 10_000;

/**
 * 앱 안의 링크에 포인터가 올라가거나 초점이 오면 그 화면을 미리 준비한다(intent prefetch). 화면마다 따로 붙이지 않고
 * 문서에 한 번 건다: 목록 행·카드·사이드바·경로처럼 a[href]로 그린 것은 모두 해당한다. 준비는 라우트 loader(각 page.tsx)
 * 그대로라, 누르면 캐시가 있어 진행 막대 없이 바로 바뀐다.
 */
export function useIntentPreload() {
  const router = useRouter();
  useEffect(() => {
    const prepared = new Map<string, number>();
    const prepare = (event: Event) => {
      const link = (event.target as Element | null)?.closest?.('a[href]');
      const href = link?.getAttribute('href');
      if (!href || !href.startsWith('/') || href.startsWith('//') || link?.hasAttribute('download') || link?.getAttribute('target') === '_blank') return;
      const path = href.split(/[?#]/, 1)[0];
      if (path === window.location.pathname || path === '/login' || path.startsWith('/api/')) return;
      const now = Date.now();
      if (now - (prepared.get(href) ?? 0) < AGAIN_MS) return;
      prepared.set(href, now);
      void router.preloadRoute({ to: href as never }).catch(() => undefined);
    };
    document.addEventListener('pointerover', prepare, { passive: true });
    document.addEventListener('focusin', prepare);
    return () => { document.removeEventListener('pointerover', prepare); document.removeEventListener('focusin', prepare); };
  }, [router]);
}
