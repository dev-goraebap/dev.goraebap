import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { subtreeIds } from "../model/tree"
import type { DocumentDraft, DocumentLibrary, ProjectDocument } from "../model/types"
import { DOCUMENT_ME, mockLibrary } from "./mock"

/** 문서함은 프로젝트마다 하나다. 키는 대문자로 맞춰 주소의 소문자 키와 같은 캐시를 읽는다. */
const libraryKey = (projectKey: string) => ["documents", projectKey.toUpperCase()] as const

const libraryOptions = (projectKey: string) => ({
  queryKey: libraryKey(projectKey),
  // 서버가 없으므로 약 300ms 뒤에 목 데이터를 돌려준다. 이후 변경은 쿼리 캐시에만 남는다.
  queryFn: () => new Promise<DocumentLibrary>(resolve => setTimeout(() => resolve(mockLibrary(projectKey)), 300)),
  staleTime: Infinity,
})

/** 한 프로젝트의 문서함(라벨 · 뷰 · 문서). */
export function useDocumentLibrary(projectKey: string) {
  return useQuery({ ...libraryOptions(projectKey), enabled: Boolean(projectKey) })
}

const patchLibrary = (change: (library: DocumentLibrary) => DocumentLibrary) => (old?: DocumentLibrary) => (old ? change(old) : old)

/**
 * 새 문서 · 하위 페이지를 "나"의 이름으로 만든다. 맨 위 문서는 문서함 끝에, 하위 페이지는 형제 페이지의 끝(그 아래 페이지들 뒤)에 놓는다.
 */
export function useCreateDocument(projectKey: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (draft: DocumentDraft): Promise<ProjectDocument> => {
      const now = new Date().toISOString()
      return {
        id: `doc-${Date.now().toString(36)}`, projectKey: projectKey.toUpperCase(), parentId: draft.parentId, title: draft.title, body: draft.body,
        icon: "document", labelIds: draft.parentId ? [] : draft.labelIds, author: DOCUMENT_ME, updatedBy: DOCUMENT_ME, createdAt: now, updatedAt: now,
      }
    },
    onSuccess: document => client.setQueryData<DocumentLibrary>(libraryKey(projectKey), patchLibrary(library => {
      const documents = [...library.documents]
      if (!document.parentId) documents.push(document)
      else {
        const family = new Set(subtreeIds(documents, document.parentId))
        const at = documents.findLastIndex(each => family.has(each.id))
        documents.splice(at + 1, 0, document)
      }
      return { ...library, documents }
    })),
  })
}

/** 제목 · 본문 · 라벨을 고친다. 고친 사람과 때를 남긴다. */
export function useUpdateDocument(projectKey: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, draft }: { id: string; draft: Omit<DocumentDraft, "parentId"> }) => ({ id, draft, at: new Date().toISOString() }),
    onSuccess: ({ id, draft, at }) => client.setQueryData<DocumentLibrary>(libraryKey(projectKey), patchLibrary(library => ({
      ...library,
      documents: library.documents.map(each => each.id === id
        ? { ...each, ...draft, labelIds: each.parentId ? [] : draft.labelIds, updatedBy: DOCUMENT_ME, updatedAt: at }
        : each),
    }))),
  })
}

/** 문서를 지운다. 그 아래 하위 페이지도 함께 지운다(호호코워크와 같다). */
export function useDeleteDocument(projectKey: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => id,
    onSuccess: id => client.setQueryData<DocumentLibrary>(libraryKey(projectKey), patchLibrary(library => {
      const gone = new Set(subtreeIds(library.documents, id))
      return { ...library, documents: library.documents.filter(each => !gone.has(each.id)) }
    })),
  })
}
