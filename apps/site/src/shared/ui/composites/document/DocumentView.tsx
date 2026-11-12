import { VStack } from '@astryxdesign/core/VStack';
import type { JSONContent } from '@tiptap/react';
import { useState, type ReactNode, type RefObject } from 'react';
import { RichEditor, type EditorHandle } from '../editor/RichEditor';
import type { ReadLinkPreview } from '../editor/types';
import { useFitZoom, useIsPhoneScreen } from './hooks';
import { DEFAULT_PAGE_SETUP, formatOf, type DocumentMode, type PageLook, type PageSetup } from './model';
import type { PageLayout } from './pagination';
import { useContentVersion, usePagedFrame } from './usePagedFrame';
import styles from './document.module.css';

/** 페이지 보기에서 n번째 종이로 스크롤한다(페이지 목록이 쓴다). */
export function scrollToPage(root: RefObject<HTMLElement | null>, number: number) {
  root.current?.querySelector(`[data-sheet="${number}"]`)?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

/**
 * 문서 읽기. 편집기와 같은 본문을 읽기 전용으로 그린다. 페이지 모드는 페이지마다 나눠, 페이지 없음은 읽는 폭 한 열로 읽는다
 * (휴대폰은 늘 페이지 없음). isInline이면 상세 본문 안에서 페이지와 함께 내려가고, 아니면 칸 높이를 채우고 스스로 스크롤한다.
 * above는 페이지 없음일 때 본문 위에 둘 것(제목 등)이다. 인쇄는 앱 틀을 빼고 이 문서만 찍는다(data-print-root).
 */
export function DocumentView({ value, mode = 'pages', setup = DEFAULT_PAGE_SETUP, look, isInline = false, onLayout, above, label = '본문', readPreview, onNavigate, rootRef }: {
  value: JSONContent; mode?: DocumentMode; setup?: PageSetup; look?: PageLook; isInline?: boolean; onLayout?: (layout: PageLayout) => void;
  above?: ReactNode; label?: string; readPreview?: ReadLinkPreview; onNavigate?: (href: string) => void;
  /** scrollToPage로 쓸 바깥 칸. */
  rootRef?: RefObject<HTMLDivElement | null>;
}) {
  const isPhone = useIsPhoneScreen();
  const isPaged = !isPhone && mode === 'pages';
  const [handle, setHandle] = useState<EditorHandle | null>(null);
  const { ref, zoom } = useFitZoom(formatOf(setup).width, isInline ? 0 : 48);
  const { extensions, frame } = usePagedFrame({ isPaged, setup, look, zoom, handle, onLayout });
  const version = useContentVersion(value);
  const attach = (element: HTMLDivElement | null) => { ref.current = element; if (rootRef) rootRef.current = element; };
  return <VStack ref={attach} className={`${isPaged ? styles.desk : styles.pageless}${isInline ? ` ${styles.inline}` : ''}`} gap={4} data-print-root="">
    {above && !isPaged ? <VStack className={styles.column}>{above}</VStack> : null}
    <VStack className={isPaged ? undefined : styles.column}>
      <RichEditor key={`${isPaged ? 'pages' : 'pageless'}-${version}`} value={value} isEditable={false} label={label} readPreview={readPreview} onNavigate={onNavigate}
        onReady={setHandle} extensions={extensions} frame={frame} />
    </VStack>
  </VStack>;
}
