import { useLocation, useNavigate, useRouter } from '@tanstack/react-router';
import { useIsPhone } from '../../foundations/media';

/** 이 세션에서 목록 위에 연 패널인지 표시하는 히스토리 상태 키. */
const OPENED = 'openedPanel';
const ROOT_ENTRY = 'root';

/**
 * 데스크톱에서는 지금 목록을 둔 채 ?panel=에 대상 주소를 넣고, 주소창에는 대상의 실제 주소를 마스크로 보인다. 휴대폰은
 * 바로 그 페이지로 간다. 라우터에는 unmaskOnReload를 켜 새로고침하면 독립 페이지로 열리게 한다.
 */
export function useOpenPanel() {
  const location = useLocation();
  const navigate = useNavigate();
  const isPhone = useIsPhone();
  return (href: string) => {
    if (isPhone) return void navigate({ href });
    const target = new URL(href, 'https://panel.invalid');
    const replacing = typeof (location.search as Record<string, unknown>).panel === 'string';
    const marker = replacing ? (location.state as unknown as Record<string, unknown> | undefined)?.[OPENED] : ROOT_ENTRY;
    void navigate({
      replace: replacing, to: location.pathname, search: { ...(location.search as Record<string, unknown>), panel: href }, state: { [OPENED]: marker } as never,
      mask: { to: target.pathname, search: Object.fromEntries(target.searchParams), state: { [OPENED]: marker } as never, unmaskOnReload: true },
    });
  };
}

/**
 * 목록 위 패널의 상태와 동작. close는 이 세션에서 열었으면 히스토리 뒤로(목록의 조건·스크롤이 그대로), 아니면 패널만 뺀
 * 목록으로 바꾼다. expand는 같은 대상을 페이지로(초안은 DraftProvider가 지킨다), done은 저장 뒤 결과로 바꿔 간다.
 */
export function useRoutedPanel() {
  const location = useLocation();
  const navigate = useNavigate();
  const router = useRouter();
  const isPhone = useIsPhone();
  const { panel, ...rest } = location.search as Record<string, unknown>;
  const openedHere = (location.state as unknown as Record<string, unknown> | undefined)?.[OPENED] === ROOT_ENTRY;
  const href = typeof panel === 'string' && panel.startsWith('/') ? panel : undefined;
  return {
    /** 휴대폰 폭에서는 패널을 그리지 않고 페이지로 옮긴다. */
    href: isPhone ? undefined : href,
    pendingPhoneHref: isPhone ? href : undefined,
    close: () => openedHere ? router.history.back() : void navigate({ to: location.pathname, search: rest as never, replace: true }),
    expand: () => href && void navigate({ href, replace: true }),
    done: (next: string) => void navigate({ href: next, replace: true }),
  };
}
