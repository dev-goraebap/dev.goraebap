import { useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentPropsWithRef } from 'react';
let renderQueue = Promise.resolve();
const subscribeTheme = (notify: () => void) => {
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
};
export function Diagram({ 'data-diagram': source, ...props }: ComponentPropsWithRef<'div'> & { 'data-diagram'?: string }) {
  const mode = useSyncExternalStore(subscribeTheme, () => document.documentElement.dataset.theme);
  const id = useId().replace(/:/g, '');
  const node = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    const work = renderQueue.then(async () => {
      if (cancelled) return;
      const { default: mermaid } = await import('mermaid');
      await document.fonts.ready;
      if (cancelled) return;
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: mode === 'dark' ? 'dark' : 'neutral', fontFamily: getComputedStyle(document.body).fontFamily, suppressErrorRendering: true });
      const { svg } = await mermaid.render(`diagram-${id}`, source);
      if (!cancelled && node.current) {
        node.current.innerHTML = svg;
        // 글에 지정된 밝은 배경은 다크 테마에서도 남으므로 실제 도형 면을 기준으로 글자 대비를 정한다.
        for (const group of node.current.querySelectorAll<SVGGElement>('.node, .cluster')) {
          const shape = group.querySelector<SVGElement>('rect, polygon, circle, path');
          if (!shape) continue;
          const fill = getComputedStyle(shape).fill;
          const rgb = fill.match(/[\d.]+/g)?.slice(0, 3).map(Number);
          if (!rgb || rgb.length !== 3 || fill === 'none') continue;
          const linear = rgb.map(v => { const c = v / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; });
          const luminance = .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
          const ink = luminance > .179 ? '#000000' : '#ffffff';
          for (const label of group.querySelectorAll<HTMLElement | SVGElement>('.nodeLabel, .cluster-label, foreignObject span, foreignObject p, text, tspan')) {
            label.style.color = ink;
            if (label.namespaceURI === 'http://www.w3.org/2000/svg') label.style.fill = ink;
          }
        }
      }
    });
    renderQueue = work.catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [source, id, mode]);
  if (!source) return <div {...props} />;
  return <figure style={{ margin: '1.5rem 0', maxWidth: '100%', overflowX: 'auto' }}>
    {error ? <pre>{source}</pre> : <div ref={node} role="img" aria-label="본문의 구조와 흐름을 설명하는 도표" />}
    <details><summary>도표 원문</summary><pre>{source}</pre></details>
  </figure>;
}
