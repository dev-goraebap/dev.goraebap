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
      if (!cancelled && node.current) node.current.innerHTML = svg;
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
