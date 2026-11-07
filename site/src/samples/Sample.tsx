import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { loadSample, type SampleEntry } from '@frontend/catalog/registry';
import type { Device } from '@frontend/catalog/types';

/** 견본을 그리는 기기 폭. 데스크톱은 키트가 데스크톱으로 판정하는 최소 폭, 휴대폰은 390px. */
const WIDTH: Record<Device, number> = { desktop: 1024, phone: 390 };
const rem = (value?: string) => (value?.endsWith('rem') ? Math.round(parseFloat(value) * 16) : undefined);

/** 부품 견본이 알려 온 크기. 같은 견본을 다시 열 때 처음부터 그 크기로 자리를 잡아 글이 밀리지 않게 한다. */
const sizes = new Map<string, { width: number; height: number }>();

/**
 * 규칙 옆에 견본 하나를 띄운다. 오른쪽 위에서 데스크톱·휴대폰을 바꿔 같은 견본을 두 기기 폭으로 본다. 견본은 실제 기기
 * 폭으로 그리고 본문 칸이 좁으면 비율대로 줄인다. 부품 견본은 내용이 칸에 들어가면 줄이지 않고 가운데만 보인다.
 */
export function Sample({ id, caption, device }: { id: string; caption?: string; device?: Device }) {
  const [entry, setEntry] = useState<SampleEntry | null>(null);
  const [shown, setShown] = useState<Device | undefined>(device);
  const [isNear, setNear] = useState(false);
  const [isLoaded, setLoaded] = useState(false);
  const [stageWidth, setStageWidth] = useState(0);
  const [size, setSize] = useState<{ width: number; height: number } | undefined>();
  const stage = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => { void loadSample(id).then(found => setEntry(found ?? null)); }, [id]);
  const current: Device = shown ?? entry?.device ?? 'desktop';
  const key = `${id}:${current}`;
  useEffect(() => { setSize(sizes.get(key)); setLoaded(false); }, [key]);
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
      sizes.set(key, next);
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
    <div ref={stage} className="sample-stage" style={{ blockSize: Math.ceil(height * scale) }}>
      {src && isNear ? <iframe key={src} ref={frame} src={src} title={`견본: ${name}`} onLoad={() => setLoaded(true)}
        style={{ inlineSize: width, blockSize: height, transform: scale < 1 ? `scale(${scale})` : undefined,
          marginInlineStart: stageWidth / 2 - (width * scale) / 2 }} /> : null}
      {isLoaded ? null : <span className="sample-wait" aria-hidden="true">견본을 불러오는 중</span>}
    </div>
  </figure>;
}
