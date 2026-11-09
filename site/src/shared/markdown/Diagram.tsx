import { lazy, Suspense, useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentPropsWithRef } from 'react';
import type { DiagramSlide } from './ZoomViewer';
import styles from './diagram.module.css';

type Scheme = 'light' | 'dark';
/*
 * 업무 앱의 리치 본문과 같은 Mermaid 그림: base 테마에 밝게·어둡게 전용 색표(파란 회색 면, 진한 글자, 회청색 선),
 * Pretendard 14px, 글자는 SVG 텍스트. Mermaid는 글자·선·메시지 라벨을 기본 글자색으로 그리므로 어두운 색표의 밝은
 * 글자가 밝은 면에서 사라지지 않게 색표를 따로 둔다.
 */
const palettes: Record<Scheme, Record<string, string | boolean>> = {
  dark: { darkMode: true, background: '#1c1e21', primaryColor: '#242c34', primaryTextColor: '#e0e7ed', primaryBorderColor: '#52697a', lineColor: '#8a9cab', secondaryColor: '#23292e', tertiaryColor: '#202529' },
  light: { darkMode: false, background: '#fafafa', primaryColor: '#edf2f6', primaryTextColor: '#1f2933', primaryBorderColor: '#7d90a1', lineColor: '#5c6d7c', secondaryColor: '#e3e9ee', tertiaryColor: '#f3f5f7' },
};
const pageScheme = (): Scheme => getComputedStyle(document.documentElement).colorScheme.includes('dark') ? 'dark' : 'light';
const subscribeTheme = (notify: () => void) => {
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style', 'class'] });
  const media = matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', notify);
  return () => { observer.disconnect(); media.removeEventListener('change', notify); };
};
// Mermaid 설정은 전역이라, 도표마다 제 색표를 정하고 그린 뒤에 다음 도표가 제 것을 정한다.
let renderQueue: Promise<unknown> = Promise.resolve();
// 크게 보기 창은 처음 열 때 받는다.
const ZoomViewer = lazy(() => import('./ZoomViewer'));
const LABEL = '본문의 구조와 흐름을 설명하는 도표';

export function Diagram({ 'data-diagram': source, ...props }: ComponentPropsWithRef<'div'> & { 'data-diagram'?: string }) {
  const scheme = useSyncExternalStore(subscribeTheme, pageScheme);
  const id = useId().replace(/:/g, '');
  const node = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [zoomed, setZoomed] = useState<DiagramSlide | null>(null);
  const open = () => {
    const root = node.current?.querySelector('svg');
    const [, , width, height] = (root?.getAttribute('viewBox') ?? '').split(/[ ,]+/).map(Number);
    if (!root || !width || !height) return;
    setZoomed({ type: 'diagram', svg: root.outerHTML, width, height, label: LABEL, background: String(palettes[scheme].background) });
  };
  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    const work = renderQueue.then(async () => {
      if (cancelled) return;
      const { default: mermaid } = await import('mermaid');
      await document.fonts.ready;
      if (cancelled) return;
      mermaid.initialize({ startOnLoad: false, theme: 'base', themeVariables: { ...palettes[scheme], fontFamily: 'Pretendard Variable, Pretendard, sans-serif', fontSize: '14px' },
        securityLevel: 'strict', htmlLabels: false, flowchart: { htmlLabels: false }, suppressErrorRendering: true });
      // 그릴 동안 문서 높이가 늘지 않도록 높이 0의 숨은 상자 안에서 잰다.
      const measuring = document.createElement('div');
      measuring.setAttribute('aria-hidden', 'true');
      Object.assign(measuring.style, { position: 'fixed', inset: '0 0 auto 0', height: '0', overflow: 'hidden', visibility: 'hidden', pointerEvents: 'none' });
      document.body.append(measuring);
      let svg: string;
      try { ({ svg } = await mermaid.render(`diagram-${id}`, source, measuring)); }
      finally { measuring.remove(); }
      if (cancelled || !node.current) return;
      node.current.innerHTML = svg;
      // 전체가 한눈에 보이게 본문 폭에 맞춰 줄이고(스크롤 없음), 작은 도표는 원래 크기보다 키우지 않는다. 자세히 볼 때는 크게 보기.
      const root = node.current.querySelector('svg');
      const width = Number(root?.getAttribute('viewBox')?.split(/[ ,]+/)[2]);
      if (root && Number.isFinite(width) && width > 0) { root.style.width = '100%'; root.style.maxWidth = `${width}px`; root.style.height = 'auto'; }
      setError(false);
    });
    renderQueue = work.catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [source, id, scheme]);
  if (!source) return <div {...props} />;
  return <figure className={styles.frame}>
    {error ? <pre>{source}</pre> : <>
      <button type="button" className={styles.zoom} onClick={open} aria-label="도표 크게 보기">크게 보기</button>
      <div ref={node} className={styles.canvas} role="img" aria-label={LABEL} onDoubleClick={open} />
    </>}
    {zoomed ? <Suspense fallback={null}><ZoomViewer slide={zoomed} onClose={() => setZoomed(null)} /></Suspense> : null}
    <details className={styles.source}><summary>도표 원문</summary><pre>{source}</pre></details>
  </figure>;
}
