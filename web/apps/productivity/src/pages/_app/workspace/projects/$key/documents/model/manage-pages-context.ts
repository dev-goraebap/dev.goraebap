import { createContext, useContext } from 'react';
import type { DocumentRow } from '@/entities/document';

/** 지금 열린 입력 하나: 어느 페이지 아래에 새 페이지를 쓰는지, 어느 페이지의 이름을 바꾸는지. */
export type ManageDraft = { kind: 'new'; parentId: string } | { kind: 'rename'; id: string } | null;

export type ManagePagesState = {
  pages: DocumentRow[]; draft: ManageDraft; setDraft: (draft: ManageDraft) => void; busy: boolean;
  create: (parentId: string, title: string, mark?: { icon: string | null; color: string | null }) => void; rename: (page: DocumentRow, title: string) => void;
  onMove: (page: DocumentRow) => void; onDelete: (page: DocumentRow) => void;
  order: (ids: string[], parentId: string) => Promise<void>; onError: (failure: unknown) => void;
};

export const ManagePagesContext = createContext<ManagePagesState | null>(null);
export const useManagePages = () => useContext(ManagePagesContext)!;

/** 관리 다이얼로그의 한 줄: 손잡이 · 아이콘 · 이름 · …, 가리키면 옅은 바탕. */
export const MANAGED_ROW = 'flex min-h-9 min-w-0 items-center gap-1 rounded-lg pr-1 hover:bg-accent max-md:min-h-12';
