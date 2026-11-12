export type DocumentPerson = { id: string; name: string }

/** 문서 라벨(호호코워크 DocumentLabel): 프로젝트 문서함마다 따로 둔다. 색은 사용자가 고른 데이터 값이다. */
export type DocumentLabel = { id: string; name: string; color: string }

/** 문서 표식의 아이콘 이름(marks.ts의 DOCUMENT_ICONS). */
export type DocumentIconName = "document" | "notes" | "structure" | "workflow" | "branch" | "shield" | "sparkles" | "megaphone" | "folder" | "settings" | "checks" | "key" | "calendar"

/**
 * 문서함의 문서 한 장(호호코워크 DocumentRow). 맨 위 문서와 그 아래 하위 페이지가 같은 모양이고 parentId로 이어진다.
 * 라벨은 맨 위 문서에만 붙는다. 본문은 Markdown이다.
 */
export type ProjectDocument = {
  id: string
  /** 대문자 프로젝트 키(COWORK). */
  projectKey: string
  /** 위 페이지. 없으면 문서함 맨 위의 문서다. */
  parentId?: string
  title: string
  body: string
  icon: DocumentIconName
  /** 표식 색(#RRGGBB). 없으면 카드는 첫 라벨 색을 쓴다. */
  color?: string
  labelIds: string[]
  author: DocumentPerson
  updatedBy: DocumentPerson
  /** ISO 시각 */
  createdAt: string
  updatedAt: string
}

export type DocumentLayout = "grid" | "list"
/** 사용자 지정(문서함의 순서) · 제목 · 수정일 · 작성일. */
export type DocumentSort = "custom" | "title" | "updated" | "created"
export type DocumentDirection = "asc" | "desc"

/** 저장한 뷰(호호코워크 DocumentSavedView): 고른 라벨과 표시 방법. */
export type DocumentSavedView = {
  id: string
  name: string
  labelIds: string[]
  layout: DocumentLayout
  sort: DocumentSort
  direction: DocumentDirection
}

/** 한 프로젝트의 문서함: 라벨 · 저장한 뷰 · 문서(사용자 지정 순서대로). */
export type DocumentLibrary = { labels: DocumentLabel[]; views: DocumentSavedView[]; documents: ProjectDocument[] }

/** 새 문서 · 문서 수정 양식이 정하는 것. */
export type DocumentDraft = Pick<ProjectDocument, "title" | "body" | "labelIds"> & { parentId?: string }
