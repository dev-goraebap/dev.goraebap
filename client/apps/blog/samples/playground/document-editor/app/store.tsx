import type { JSONContent } from '@tiptap/react';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { DEFAULT_PAGE_LOOK, type PageLook, type PageSetup } from '@/shared/ui/document';
import { sampleDocument } from '../mocks/seed';

/** 견본 문서: 제목·본문과 페이지 설정(용지·여백·머리말·바닥글). 본문은 페이지를 모른다. */
type DocumentValue = { title: string; body: JSONContent; setup: PageSetup };
const DocumentContext = createContext<{ document: DocumentValue; save: (next: DocumentValue) => void; look: PageLook; setLook: (look: PageLook) => void } | null>(null);

/** 견본 하나를 메모리에 두는 저장소. 수정 화면의 저장이 읽기 화면에 바로 보인다. */
export function DocumentStoreProvider({ children }: { children: ReactNode }) {
  const [document, save] = useState<DocumentValue>(sampleDocument);
  // 페이지 모양은 보는 사람의 화면 설정이라 문서와 따로 둔다(읽기와 편집이 같은 값을 쓴다).
  const [look, setLook] = useState<PageLook>(DEFAULT_PAGE_LOOK);
  return <DocumentContext value={{ document, save, look, setLook }}>{children}</DocumentContext>;
}

const useStore = () => {
  const store = useContext(DocumentContext);
  if (!store) throw Error('DocumentStoreProvider 안에서만 씁니다.');
  return store;
};
export const useDocumentValue = () => useStore().document;
export const useSaveDocumentValue = () => useStore().save;

/** 페이지 모양과 바꾸는 함수. */
export const usePageLook = () => { const { look, setLook } = useStore(); return [look, setLook] as const; };
