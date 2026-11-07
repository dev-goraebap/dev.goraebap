import '@kit/foundations/base.css';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { loadSample, type SampleEntry } from '@frontend/catalog/registry';
import { SampleView } from '@frontend/catalog/SampleView';
import type { Meta, Sample } from '@frontend/catalog/types';

type Mode = 'light' | 'dark';

/** 가이드 안에서는 바깥 문서의 data-theme을, 새 창에서는 저장한 선택과 시스템 설정을 따른다. */
function readMode(): Mode {
  try {
    const outer = window.parent !== window ? window.parent.document.documentElement.dataset.theme : undefined;
    if (outer === 'dark' || outer === 'light') return outer;
    const stored = localStorage.getItem('guide-theme');
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

/** 문서 안에 끼운 부품 견본은 내용의 폭·높이를 바깥에 알려 틀 크기를 맞춘다. */
function useReportSize(isInline: boolean) {
  useEffect(() => {
    if (!isInline) return undefined;
    const frame = document.querySelector<HTMLElement>('[data-sample-frame]');
    if (!frame) return undefined;
    const report = () => {
      const width = Math.max(0, ...[...frame.children].map((child) => child.getBoundingClientRect().width));
      window.parent.postMessage({ type: 'sample-size', width, height: frame.getBoundingClientRect().height }, location.origin);
    };
    const observer = new ResizeObserver(report);
    observer.observe(frame);
    [...frame.children].forEach((child) => observer.observe(child));
    report();
    return () => observer.disconnect();
  }, [isInline]);
}

export function SampleFrame({ id }: { id: string }) {
  const mode = useSyncExternalStore(subscribe, readMode, () => 'light' as Mode);
  const [entry, setEntry] = useState<(SampleEntry & { sample: Sample; meta: Meta }) | null>();
  useEffect(() => { loadSample(id).then((found) => setEntry(found ?? null)); }, [id]);
  const isEmbedded = window.parent !== window;
  // 높이를 정한 견본(대화상자 등)과 화면 전체 견본은 틀 크기가 정해져 있다.
  const isInline = isEmbedded && !!entry && entry.layout !== 'fullscreen' && entry.device !== 'phone' && !entry.height;
  useReportSize(isInline);
  if (entry === undefined) return null;
  if (entry === null) return <p>견본이 없습니다: {id}</p>;
  return <SampleView meta={entry.meta} sample={entry.sample} mode={mode} layout={isInline ? 'inline' : entry.layout} />;
}
