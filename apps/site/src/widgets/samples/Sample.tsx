import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { loadSample, type SampleEntry } from '@samples/catalog/registry';
import type { Device } from '@samples/catalog/types';
import measured from './sample-sizes.json';

/** 견본을 그리는 기기 폭. 데스크톱은 키트가 데스크톱으로 판정하는 최소 폭, 휴대폰은 390px. */
const WIDTH: Record<Device, number> = { desktop: 1280, phone: 390 };
const rem = (value?: string) => (value?.endsWith('rem') ? Math.round(parseFloat(value) * 16) : undefined);

/**
 * 부품 견본이 알려 온 크기. 같은 견본을 다시 열 때 처음부터 그 크기로 자리를 잡아 글이 밀리지 않게 한다. 브라우저에 남겨
 * 다음 방문에도 쓴다(저장소를 쓸 수 없으면 이번 방문 동안만).
 */
const SIZE_KEY = 'webcraft-sample-sizes';
// 빌드 전에 잰 크기(npm run site:sizes) 위에, 이 브라우저에서 잰 크기를 덮는다.
const sizes = new Map<string, { width: number; height: number }>([...Object.entries(measured as unknown as Record<string, { width: number; height: number }>), ...(() => {
  try { return Object.entries(JSON.parse(localStorage.getItem(SIZE_KEY) ?? '{}') as Record<string, { width: number; height: number }>); }
  catch { return []; }
})()]);
const remember = (key: string, size: { width: number; height: number }) => {
  sizes.set(key, size);
  try { localStorage.setItem(SIZE_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(SIZE_KEY) ?? '{}'), [key]: size })); } catch { /* 저장소를 쓸 수 없으면 기억만 한다. */ }
};

/** 견본 정보(전체 화면인지, 정한 높이, 기기). 문서로 옮기기 전에 받아 두면 첫 그림부터 제 높이로 자리를 잡는다. */
const entries = new Map<string, SampleEntry | null>();
/** 문서 준비(라우트 loader)에서 부른다: 본문이 띄우는 견본의 정보를 미리 받는다. */
export async function prepareSamples(ids: readonly string[]) {
  await Promise.all(ids.filter(id => !entries.has(id)).map(id => loadSample(id).then(found => { entries.set(id, found ?? null); }, () => undefined)));
}

/**
 * 규칙 옆에 견본 하나를 띄운다. 오른쪽 위에서 데스크톱·휴대폰을 바꿔 같은 견본을 두 기기 폭으로 본다. 견본은 실제 기기
 * 폭으로 그리고 본문 칸이 좁으면 비율대로 줄인다. 부품 견본은 내용이 칸에 들어가면 줄이지 않고 가운데만 보인다.
 */
export function Sample({ id, caption, device }: { id: string; caption?: string; device?: Device }) {
  const [entry, setEntry] = useState<SampleEntry | null>(() => entries.get(id) ?? null);
  const [shown, setShown] = useState<Device | undefined>(device);
  const [isNear, setNear] = useState(false);
  const [isLoaded, setLoaded] = useState(false);
  const [stageWidth, setStageWidth] = useState(0);
  const [size, setSize] = useState<{ width: number; height: number } | undefined>();
  const stage = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (entries.has(id)) { setEntry(entries.get(id) ?? null); return; }
    void loadSample(id).then(found => { entries.set(id, found ?? null); setEntry(found ?? null); });
  }, [id]);
  const current: Device = shown ?? entry?.device ?? 'desktop';
  const key = `${id}:${current}`;
  useLayoutEffect(() => { setSize(sizes.get(key)); setLoaded(false); }, [key]);
  // 보이는 견본만 불러온다.
  useLayoutEffect(() => {
    const node = stage.current;
    if (!node) return undefined;
    const resize = new ResizeObserver(() => setStageWidth(node.clientWidth));
    resize.observe(node);
    const seen = new IntersectionObserver(items => { if (items.some(item => item.isIntersecting)) { setNear(true); seen.disconnect(); } }, { rootMargin: '200px' });
    seen.observe(node);
    return () => { resize.disconnect(); seen.disconnect(); };
  }, []);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.data?.type !== 'sample-size' || event.source !== frame.current?.contentWindow) return;
      const next = { width: Math.ceil(event.data.width), height: Math.ceil(event.data.height) };
      remember(key, next);
      setSize(next);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [key]);

  const isScreen = entry?.layout === 'fullscreen';
  const fixed = rem(entry?.height);
  const isAuto = !!entry && !isScreen && !fixed;
  const width = WIDTH[current];
  const height = isAuto ? size?.height ?? 160 : current === 'phone' && isScreen ? Math.max(fixed ?? 0, 844) : fixed ?? (isScreen ? 760 : 160);
  const visible = isAuto && size ? Math.min(width, size.width + 32) : width;
  const scale = stageWidth ? Math.min(1, stageWidth / visible) : 1;
  const src = entry ? `/sample.html?id=${encodeURIComponent(id)}${current !== entry.device ? `&device=${current}` : ''}` : undefined;
  const name = entry?.name ?? '';

  return <figure className="sample">
    <div className="sample-bar">
      <span className="sample-name">{caption ?? name}</span>
      <div className="sample-tools">
        <div className="sample-devices" role="group" aria-label={`${name} 보기 기기`}>
          {(['desktop', 'phone'] as const).map(each => <button key={each} type="button" aria-pressed={current === each}
            onClick={() => setShown(each)}>{each === 'desktop' ? '데스크톱' : '휴대폰'}</button>)}
        </div>
        {src ? <a className="sample-open" href={src} target="_blank" rel="noopener">새 창에서 열기</a> : null}
      </div>
    </div>
    {/* 크기를 아는 견본(정한 높이, 기억한 크기)은 처음부터 그 높이로, 모르는 견본은 크기가 오면 높이를 부드럽게 늘린다.
        견본은 다 그려지고 크기가 정해진 뒤에 나타난다(그리는 도중의 모습을 보이지 않는다). */}
    <div ref={stage} className="sample-stage" data-sizing={isAuto && !size ? '' : undefined} style={{ blockSize: Math.ceil(height * scale) }}>
      {src && isNear ? <iframe key={src} ref={frame} src={src} title={`견본: ${name}`} onLoad={() => setLoaded(true)}
        data-ready={isLoaded && (!isAuto || !!size) ? '' : undefined}
        style={{ inlineSize: width, blockSize: height, transform: scale < 1 ? `scale(${scale})` : undefined,
          marginInlineStart: stageWidth / 2 - (width * scale) / 2 }} /> : null}
      {isLoaded ? null : <span className="sample-wait" aria-hidden="true">견본을 불러오는 중</span>}
    </div>
  </figure>;
}
