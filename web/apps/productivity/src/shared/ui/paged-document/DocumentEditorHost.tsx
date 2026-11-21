import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type EditorSlots = { toolbar: HTMLElement | null };
const EditorSlotsContext = createContext<EditorSlots | null>(null);

/**
 * 문서 수정 화면의 틀: 화면 맨 위 전체 폭에 붙는 서식 막대 줄과 그 아래 본문. 본문 칸(RichBody)이 서식 막대를 이 자리에
 * 그린다(createPortal). 본문은 스크롤하고 서식 막대는 스크롤하지 않는다. 줄 자체가 막대라 막대의 테두리 · 둥근 모서리는 편집기 규칙
 * (rich-document/styles.css의 [data-document-toolbar])이 뺀다.
 */
export function DocumentEditorHost({ children }: { children: ReactNode }) {
  const [toolbar, setToolbar] = useState<HTMLElement | null>(null);
  const value = useMemo(() => ({ toolbar }), [toolbar]);
  return <EditorSlotsContext value={value}>
    <div className="flex h-full min-h-0 flex-col">
      <div ref={setToolbar} data-document-toolbar="" className="relative z-6 flex flex-none flex-col border-b bg-background px-4 py-1.5 empty:hidden" />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">{children}</div>
    </div>
  </EditorSlotsContext>;
}

/** 문서 수정 화면의 서식 막대 자리(DocumentEditorHost 안에서만). */
export const useDocumentEditorSlots = () => useContext(EditorSlotsContext);
