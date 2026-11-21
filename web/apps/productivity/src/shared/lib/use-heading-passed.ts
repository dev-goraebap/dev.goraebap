import { useEffect, useState, type RefObject } from 'react';

/**
 * 스크롤 칸 안의 큰 제목(첫 h1)이 위로 올라가 보이지 않게 됐는가. 머리 줄이 그때 이름을 대신 보인다(칸 머리 틀 · 휴대폰 앱 바).
 * 스크롤마다 위치를 재지 않는다: 제목이 선(칸의 위 끝에서 topInset만큼 아래)을 넘는 순간만 IntersectionObserver가 알린다. 제목은
 * 본문이 읽힌 뒤에 생기므로 본문의 줄 추가 · 제거를 지켜보다가 나타나면 그때 붙는다. 제목이 없는 동안은 스크롤 위치로 판단한다.
 */
export function useHeadingPassed(scroller: RefObject<HTMLElement | null>, topInset = 0): boolean {
  const [isPassed, setPassed] = useState(false);
  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    let heading: HTMLHeadingElement | null = null;
    const watch = new IntersectionObserver(([entry]) => {
      if (!entry?.rootBounds) return;
      setPassed(!entry.isIntersecting && entry.boundingClientRect.bottom <= entry.rootBounds.top);
    }, { root: element, rootMargin: `-${topInset}px 0px 0px 0px` });
    const find = () => {
      if (heading?.isConnected) return;
      if (heading) watch.unobserve(heading);
      heading = element.querySelector('h1');
      if (heading) watch.observe(heading);
      else setPassed(element.scrollTop > 24);
    };
    const scroll = () => { if (!heading) setPassed(element.scrollTop > 24); };
    find();
    const content = new MutationObserver(find);
    content.observe(element, { childList: true, subtree: true });
    element.addEventListener('scroll', scroll, { passive: true });
    return () => { watch.disconnect(); content.disconnect(); element.removeEventListener('scroll', scroll); };
  }, [scroller, topInset]);
  return isPassed;
}
