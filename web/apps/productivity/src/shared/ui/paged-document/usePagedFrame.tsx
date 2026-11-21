import type { AnyExtension, Editor } from '@tiptap/core';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { formatOf, type PageLook, type PageSetup } from './model';
import { PageCanvas, type PageArea, type PageNumbering } from './PageCanvas';
import { Pagination, refreshPagination, type PageLayout } from './pagination';

/**
 * 리치 에디터를 페이지 보기로 만드는 연결: 페이지 나누기 확장(extensions), 종이 틀(frame), 지금 배치(layout).
 * 확장은 isPaged가 바뀔 때만 새로 만들고(그때 호스트가 에디터 key를 바꾼다), 용지·여백·간격이 바뀌면 에디터를 새로 만들지 않고 다시 나눈다.
 */
export function usePagedFrame({ isPaged, setup, look, zoom, editor, onEditArea, activeArea, numbering, onLayout }: {
  isPaged: boolean; setup: PageSetup; look?: PageLook; zoom: number; editor: Editor | null;
  onEditArea?: (area: PageArea) => void; activeArea?: PageArea | null;
  numbering?: PageNumbering; onLayout?: (layout: PageLayout) => void;
}): { extensions: AnyExtension[]; frame?: (content: ReactNode) => ReactNode; layout: PageLayout | null } {
  const [layout, setLayout] = useState<PageLayout | null>(null);
  const format = formatOf(setup);
  const formatRef = useRef(format), notify = useRef(onLayout);
  formatRef.current = format;
  notify.current = onLayout;
  const extensions = useMemo(() => isPaged ? [Pagination.configure({ format: () => formatRef.current, onLayout: next => {
    setLayout(current => current && JSON.stringify(current) === JSON.stringify(next) ? current : next);
    notify.current?.(next);
  } })] : [], [isPaged]);
  useEffect(() => { if (editor && isPaged && !editor.isDestroyed) refreshPagination(editor.view); }, [editor, isPaged, format.name, format.gap]);
  const frame = isPaged ? (content: ReactNode) => <PageCanvas setup={setup} layout={layout} zoom={zoom} look={look}
    onEditArea={onEditArea} activeArea={activeArea} numbering={numbering}>{content}</PageCanvas> : undefined;
  return { extensions, frame, layout };
}
