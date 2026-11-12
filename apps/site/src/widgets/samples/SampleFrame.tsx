import { useEffect, useState, useSyncExternalStore } from 'react';
import { loadSample, type SampleEntry } from '@samples/catalog/registry';
import { SampleView } from '@samples/catalog/SampleView';
import type { Meta, Sample } from '@samples/catalog/types';
import { THEME_KEY } from '@/shared/config/preferences';

type Mode = 'light' | 'dark';

/** 가이드 안에서는 바깥 문서의 data-theme을, 새 창에서는 저장한 선택과 시스템 설정을 따른다. */
function readMode(): Mode {
  try {
    const outer = window.parent !== window ? window.parent.document.documentElement.dataset.theme : undefined;
    if (outer === 'dark' || outer === 'light') return outer;
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch { /* 다른 출처이거나 저장소를 쓸 수 없으면 시스템 설정을 따른다. */ }
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function subscribe(listener: () => void) {
  const observer = new MutationObserver(listener);
  try { if (window.parent !== window) observer.observe(window.parent.document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); } catch { /* 같은 출처가 아니면 건너뛴다. */ }
  const media = matchMedia('(prefers-color-scheme: dark)');
  window.addEventListener('storage', listener);
  media.addEventListener('change', listener);
  return () => { observer.disconnect(); window.removeEventListener('storage', listener); media.removeEventListener('change', listener); };
}

/** 문서 안에 끼운 부품 견본은 내용의 폭 · 높이를 바깥에 알려 틀 크기를 맞춘다. */
function useReportSize(isInline: boolean) {
  useEffect(() => {
    if (!isInline) return undefined;
    const frame = document.querySelector<HTMLElement>('[data-sample-frame]');
    if (!frame) return undefined;
    // 틀 바로 아래의 요소들이 견본이다(견본의 라우터는 DOM을 더하지 않는다).
    const parts = () => [...frame.children];
    const report = () => {
      const width = Math.max(0, ...parts().map(child => child.getBoundingClientRect().width));
      window.parent.postMessage({ type: 'sample-size', width, height: frame.getBoundingClientRect().height }, location.origin);
    };
    const observer = new ResizeObserver(report);
    observer.observe(frame);
    parts().forEach(child => observer.observe(child));
    report();
    return () => observer.disconnect();
  }, [isInline]);
}

type Entry = SampleEntry & { sample: Sample; meta: Meta };


export function SampleFrame({ id }: { id: string }) {
  const mode = useSyncExternalStore(subscribe, readMode, () => 'light' as Mode);
  const [entry, setEntry] = useState<Entry | null>();
  useEffect(() => { void loadSample(id).then(found => setEntry(found ?? null)); }, [id]);
  const isEmbedded = window.parent !== window;
  // 큰 화면에서 가이드는 루트 글자를 키운다(tailwind.css). 견본 iframe은 폭이 1280px라 그 규칙을 받지 못하므로
  // 데스크톱으로 보는 부품 견본은 가이드의 루트 글자 크기를 쓴다. 앱 화면 견본은 셸이 창 폭으로 크기를 정하므로 두지 않는다.
  useEffect(() => {
    if (!entry || !isEmbedded || entry.layout === 'fullscreen' || new URLSearchParams(location.search).get('device') === 'phone') return;
    try { document.documentElement.style.fontSize = getComputedStyle(window.parent.document.documentElement).fontSize; } catch { /* 다른 출처면 그대로 둔다. */ }
  }, [entry, isEmbedded]);
  // 높이를 정한 견본(대화상자 등)과 화면 전체 견본은 틀 크기가 정해져 있다. 기기 폭은 iframe 폭이 정하므로(?device=)
  // 부품 견본은 데스크톱 · 휴대폰 모두 내용 크기를 알린다.
  const isInline = isEmbedded && !!entry && entry.layout !== 'fullscreen' && !entry.height;
  useReportSize(isInline);
  if (entry === undefined) return null;
  if (entry === null) return <p>견본이 없습니다: {id}</p>;
  return <SampleView meta={entry.meta} sample={entry.sample} mode={mode} layout={isInline ? 'inline' : entry.layout} />;
}
