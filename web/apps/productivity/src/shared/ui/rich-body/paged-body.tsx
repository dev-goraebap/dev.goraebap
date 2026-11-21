import type { Editor } from '@tiptap/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from 'cn';
import { DocumentFormatBar, type JSONNode, type LinkChoice } from '@/shared/lib/rich-document';
import {
  pageSetupOf, useDocumentEditorSlots, usePagedFrame, withPageSetup, type PageLayout, type PageNumbering, type PageSetup,
} from '../paged-document';

/**
 * 인쇄용 나눔의 쪽 설정: 쪽 아래에 한 줄쯤(12mm) 여유를 남겨 나눈다. 인쇄는 글자 폭이 화면과 조금 달라 줄바꿈이 바뀌어도 그 쪽
 * 안에 들어가게 한다(실제 쪽 여백은 인쇄 화면의 @page가 원래 설정대로 둔다). 쪽 사이 간격은 화면 미리보기에만 있다.
 */
const PRINT_SLACK_MM = 12;
const PRINT_TABLE_MIN = 24;
/** 미리보기의 쪽 사이 틈(px). 인쇄에서는 틈을 숨기고 쪽마다 새 종이를 연다. */
const PREVIEW_GAP = 24;
const printLayoutSetup = (setup: PageSetup): PageSetup => ({ ...setup, gap: PREVIEW_GAP, margins: { ...setup.margins, bottom: setup.margins.bottom + PRINT_SLACK_MM } });

/** 인쇄(PDF): 정한 쪽 설정으로 나누고, 쪽 번호를 이어 매기며 배치를 알린다. */
export type PagedPrint = { setup: PageSetup; numbering?: PageNumbering; onLayout: (layout: PageLayout) => void };

type Body = { value: JSONNode | null; current: () => JSONNode | null };
/** 본문 루트에 저장된 페이지 설정. 한 번도 고치지 않은 문서는 null(저장하지 않는다). */
const savedSetupOf = (body: JSONNode | null) => body?.attrs?.pageSetup ? pageSetupOf(body) : null;

/**
 * 본문 칸의 두 가지 덧붙임. 인쇄 화면(print)이면 에디터에 페이지 나누기 확장과 종이 틀을 붙인다(상세·수정 화면은 종이로 나누지
 * 않는다: 2026-11-11 사용자 결정, 쪽은 PDF 미리보기에서 본다). 수정 화면(DocumentEditorHost 안)이면 서식 막대를 화면 맨 위에 둔다.
 * 에디터는 본문 루트의 attrs를 모르므로, 저장된 페이지 설정을 고친 본문에 다시 붙인다(미리보기에서 정한 설정을 지우지 않게).
 */
export function usePagedBody({ body, print }: { body: Body; print?: PagedPrint }) {
  const [saved, setSaved] = useState(() => savedSetupOf(body.value));
  const savedRef = useRef(saved);
  savedRef.current = saved;
  // 다른 본문을 읽으면(최신 내용 보기, 버전 복원) 그 본문의 설정으로 바꾼다.
  const loaded = body.value;
  useEffect(() => { setSaved(savedSetupOf(loaded)); }, [loaded]);
  const [editor, setEditor] = useState<Editor | null>(null);
  const host = useDocumentEditorSlots();
  const { extensions: paging, frame } = usePagedFrame({ isPaged: !!print, setup: print ? printLayoutSetup(print.setup) : pageSetupOf(null), zoom: 1, editor,
    numbering: print?.numbering, onLayout: print?.onLayout });
  return {
    editor, extensions: paging, frame, onReady: setEditor,
    /** 인쇄 화면의 표 열 최소 폭: 종이 폭에 맞춰 줄인 열 폭이 그대로 쓰이게 낮춘다. */
    tableMinWidth: print ? PRINT_TABLE_MIN : undefined, toolbarSlot: host?.toolbar ?? null,
    /** 에디터 key에 붙인다: 인쇄 화면의 에디터는 페이지 나누기 확장을 가진다. */
    key: print ? ':print' : '',
    /** 에디터가 준 본문에 저장된 페이지 설정을 붙인다. */
    withSetup: (next: JSONNode) => withPageSetup(next, savedRef.current),
  };
}
export type PagedBodyState = ReturnType<typeof usePagedBody>;

/** 본문 칸: 수정 화면이면 화면 맨 위 줄에 서식 막대를 붙인다. */
export function PagedBody({ paged, isEditing, links, className, children }: {
  paged: PagedBodyState; isEditing: boolean; links?: LinkChoice[]; className?: string; children: ReactNode;
}) {
  return <div className={cn('flex min-w-0 flex-col', className)}>
    {isEditing && paged.toolbarSlot ? createPortal(<div className="bit-rich-document flex flex-col">
      <DocumentFormatBar editor={paged.editor} links={links} />
    </div>, paged.toolbarSlot) : null}
    {children}
  </div>;
}
