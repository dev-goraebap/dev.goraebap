import { useRouter } from '@tanstack/react-router';
import type { ComponentPropsWithRef, MouseEvent } from 'react';

/**
 * Astryx 부품이 그리는 모든 링크(LinkProvider로 연결). 앱 주소를 보통 클릭하면 페이지를 다시 읽지 않고 라우터로 이동하고,
 * 보조 키·새 창·다른 사이트는 브라우저에 맡긴다. 라우터 루트에서 한 번 `<LinkProvider component={RouterLink}>`로 감싼다.
 */
export function RouterLink({ href, target, onClick, ...props }: ComponentPropsWithRef<'a'>) {
  const router = useRouter();
  const follow = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    const isPlain = event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
    if (event.defaultPrevented || !isPlain || (target && target !== '_self') || !href?.startsWith('/')) return;
    event.preventDefault();
    void router.navigate({ href });
  };
  return <a href={href} target={target} onClick={follow} {...props} />;
}
