import { useEffect, useRef, useState } from 'react';
import { diagramColors } from '../../foundations/colors';

export type Scheme = 'light' | 'dark';
/** 화면의 색 구성: 앱 테마가 <html>에 정한 color-scheme. */
export const pageScheme = (): Scheme => getComputedStyle(document.documentElement).colorScheme.includes('dark') ? 'dark' : 'light';
function useScheme() {
  const [scheme, setScheme] = useState(pageScheme);
  useEffect(() => {
    const watch = new MutationObserver(() => setScheme(pageScheme()));
    watch.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class', 'data-theme'] });
    return () => watch.disconnect();
  }, []);
  return scheme;
}

let mermaidModule: Promise<typeof import('mermaid')> | undefined;
// Mermaid의 설정은 전역이라, 도표마다 제 색표를 정하고 그린 뒤에 다음 도표가 제 것을 정한다.
let rendering: Promise<unknown> = Promise.resolve();
async function diagram(source: string, scheme: Scheme) {
  mermaidModule ??= import('mermaid');
  const { default: mermaid } = await mermaidModule;
  const turn = rendering.then(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'base', themeVariables: { ...diagramColors[scheme], fontFamily: 'Pretendard Variable, sans-serif', fontSize: '14px' },
      securityLevel: 'strict', htmlLabels: false, maxTextSize: 30000, maxEdges: 200, suppressErrorRendering: true, flowchart: { htmlLabels: false },
      secure: ['securityLevel', 'startOnLoad', 'maxTextSize', 'maxEdges', 'suppressErrorRendering'] });
    return draw(mermaid, source);
  });
  rendering = turn.catch(() => undefined);
  return turn;
}
async function draw(mermaid: typeof import('mermaid').default, source: string) {
  // 담을 상자를 주지 않으면 Mermaid는 <body> 끝에 상자를 붙여 그 안에서 재므로, 그리는 동안 페이지가 길어지고 스크롤 막대가
  // 깜빡인다. 높이 0의 숨은 고정 상자 안에서 잰다.
  const holder = document.createElement('div');
  holder.setAttribute('aria-hidden', 'true');
  holder.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:0;overflow:hidden;visibility:hidden;pointer-events:none';
  document.body.append(holder);
  const { svg } = await mermaid.render(`diagram-${crypto.randomUUID()}`, source, holder).finally(() => holder.remove());
  const root = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement as unknown as SVGSVGElement;
  const width = Number(root.getAttribute('viewBox')?.split(/[ ,]+/)[2]);
  // 칸 폭을 채운다(잘리지 않게 비율 유지). 아주 작은 도표가 지나치게 커지지 않게 원래 크기의 3배까지만 키우고, 높이 한도는 CSS가 둔다.
  if (Number.isFinite(width) && width > 0) { root.style.width = '100%'; root.style.maxWidth = `${Math.round(width * 3)}px`; root.style.height = 'auto'; }
  return root.outerHTML;
}

/** 도표 원문을 그린 SVG(html). 화면 색만 바뀌면 새 그림이 준비될 때까지 이전 그림을 둔다. */
export function useDiagram(source: string, isDiagram: boolean) {
  const [state, setState] = useState({ html: '', error: '', pending: isDiagram });
  const scheme = useScheme(), drawn = useRef(source);
  useEffect(() => {
    if (!isDiagram) return;
    let disposed = false;
    const recolour = drawn.current === source;
    drawn.current = source;
    if (!recolour) setState({ html: '', error: '', pending: true });
    const timer = setTimeout(() => {
      void (async () => {
        try {
          if (!source.trim()) throw Error('원문을 입력하세요.');
          if (source.length > 30000) throw Error('원문은 30,000자까지 입력할 수 있습니다.');
          const html = await diagram(source, scheme);
          if (!disposed) setState({ html, error: '', pending: false });
        } catch (error) {
          if (!disposed) setState({ html: '', error: (error instanceof Error ? error.message : '미리보기를 만들지 못했습니다').slice(0, 350), pending: false });
        }
      })();
    }, 150);
    return () => { disposed = true; clearTimeout(timer); };
  }, [source, scheme, isDiagram]);
  return { ...state, scheme };
}

/** 링크 카드의 주소를 검사한다: 로그인 정보가 없는 HTTPS 주소만, 이 화면 자신은 넣지 않는다. */
export function embedURL(source: string): { original: string; host: string } {
  let parsed: URL;
  try { parsed = new URL(source.trim()); } catch { throw Error('https://로 시작하는 웹 주소를 입력하세요.'); }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw Error('로그인 정보가 없는 HTTPS 주소를 입력하세요.');
  if (typeof location !== 'undefined' && parsed.origin === location.origin) throw Error('현재 문서 편집기 자체는 임베드할 수 없습니다.');
  return { original: parsed.href, host: parsed.hostname.toLowerCase() };
}
