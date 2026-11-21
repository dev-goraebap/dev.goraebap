import { bodyActivityOptions, documentOptions, documentsOptions, libraryOptions } from '@/entities/document';
import type { Prep } from '@/shared/lib/prepare';

/** 문서함의 첫 화면: 연 문서(본문 · 활동)와, 프로젝트의 것이면 그 문서 목록. */
export async function prepareDocuments({ prime, primeInfinite, body }: Prep, { projectKey, documentId }: { projectKey?: string; documentId?: string }) {
  if (documentId) await Promise.all([prime(documentOptions(documentId)), body(`/api/v1/workspace/documents/${documentId}/body`), prime(bodyActivityOptions('documents', documentId))]);
  if (projectKey) await Promise.all([prime(libraryOptions(projectKey)), primeInfinite(documentsOptions({ project: projectKey }))]);
}

/** 문서의 페이지 관리: 프로젝트 문서의 갈래. */
export const prepareDocumentPages = ({ prime }: Prep, projectKey: string) => prime(libraryOptions(projectKey));
