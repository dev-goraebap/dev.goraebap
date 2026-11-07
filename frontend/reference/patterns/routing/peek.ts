import { useLocation, useNavigate, useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useIsPhone } from '../../foundations/media';

/** 이 세션에서 미리보기를 연 기록인지 표시하는 히스토리 상태 키. */
const OPENED = 'openedPeek';

/**
 * 목록 옆 미리보기 패널의 상태. 대상은 목록 주소의 `?peek=ID`에 두어 뒤로가기·새로고침·공유가 같은 화면을 연다.
 * - open: 처음 열 때 기록을 하나 쌓는다(push). 뒤로가기가 패널을 닫는다.
 * - move: 열린 채 다른 항목으로 옮길 때는 기록을 쌓지 않는다(replace).
 * - close: 이 세션에서 열었으면 히스토리 뒤로, 아니면 peek만 뺀 주소로 바꾼다.
 * 휴대폰 폭에서 `?peek=`가 오면 패널 대신 대상 페이지로 바꿔 간다(pageHref).
 */
export function usePeek(pageHref: (id: string) => string) {
  const location = useLocation();
  const navigate = useNavigate();
  const router = useRouter();
  const isPhone = useIsPhone();
  const { peek, ...rest } = location.search as Record<string, unknown>;
  const id = typeof peek === 'string' && peek ? peek : undefined;
  const openedHere = !!(location.state as unknown as Record<string, unknown> | undefined)?.[OPENED];
  useEffect(() => {
    if (isPhone && id) void navigate({ href: pageHref(id), replace: true });
  }, [isPhone, id, navigate, pageHref]);
  const go = (next: string, replace: boolean) => void navigate({
    to: location.pathname, search: { ...rest, peek: next } as never, replace,
    state: { [OPENED]: replace ? openedHere : true } as never,
  });
  return {
    id: isPhone ? undefined : id,
    open: (next: string) => isPhone ? void navigate({ href: pageHref(next) }) : go(next, !!id),
    move: (next: string) => go(next, true),
    close: () => openedHere ? router.history.back() : void navigate({ to: location.pathname, search: rest as never, replace: true }),
    /** 미리보기 대상의 주소. 처리 목록은 행 링크를 이 주소로 둔다. */
    hrefOf: (next: string) => {
      const query = new URLSearchParams(Object.entries(rest).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)]));
      query.set('peek', next);
      return `${location.pathname}?${query}`;
    },
  };
}
