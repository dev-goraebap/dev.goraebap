import { createElement, lazy, type ComponentType } from 'react';

/**
 * 지연 로딩하는 부품을 미리 받아 둘 수 있게 한다. React.lazy는 코드가 이미 받아져 있어도 처음 그릴 때 한 번 멈추고(Suspense),
 * 그동안 그 자리가 비어 아래 내용이 밀린다. 라우트 준비(page.tsx의 loader, shared/lib/prepare)에서 preload를 불러 두면 첫 그림부터 바로 그린다.
 * 받기 전에 그리면 보통의 lazy처럼 가장 가까운 Suspense에서 기다린다.
 */
export function preloadable<P extends object>(load: () => Promise<ComponentType<P>>) {
  let loaded: ComponentType<P> | undefined;
  let pending: Promise<ComponentType<P>> | undefined;
  const preload = () => (pending ??= load().then(component => (loaded = component)));
  const Lazy = lazy(() => preload().then(component => ({ default: component })));
  function Preloadable(props: P) {
    return createElement((loaded ?? Lazy) as ComponentType<P>, props);
  }
  return Object.assign(Preloadable, { preload });
}
