import { useState } from "react"
import {
  DocumentLabelDot, useCreateDocument, useUpdateDocument, type DocumentLabel, type ProjectDocument,
} from "@/entities/document"
import { paths, projectPath } from "@/shared/config"
import { ComposeFields, ComposeSurface, PlaceChip } from "@/shared/ui/compose"
import { FolderWithFilesIcon, TagIcon } from "@/shared/ui/icon"
import type { Crumb } from "@/shared/ui/page"
import { OptionPill } from "@/shared/ui/property-pill"
import { toast } from "@/shared/ui/toast"

const TITLE_MAX = 200

/**
 * 새 문서 · 새 하위 페이지 · 문서 수정(호호코워크 NewDocumentDialog · DocumentEditPage): 제목과 Markdown 본문을 쓰고,
 * 맨 위 문서만 라벨을 알약으로 고른다. 호호코워크의 본문은 블록 편집기지만, 이 앱은 Markdown 글 상자로 쓴다.
 * 표식(아이콘 · 색)과 첨부는 고르지 않는다.
 */
export function DocumentCompose({ projectKey, projectName, labels, document, parent, surface, onClose, onSaved }: {
  projectKey: string
  projectName: string
  labels: DocumentLabel[]
  /** 고칠 문서. 없으면 새로 만든다. */
  document?: ProjectDocument
  /** 새 하위 페이지의 위 페이지. */
  parent?: ProjectDocument
  surface: "dialog" | "page"
  onClose: () => void
  onSaved: (id: string) => void
}) {
  const create = useCreateDocument(projectKey)
  const update = useUpdateDocument(projectKey)
  const [title, setTitle] = useState(document?.title ?? "")
  const [body, setBody] = useState(document?.body ?? "")
  const [labelIds, setLabelIds] = useState<string[]>(document?.labelIds ?? [])
  const isTop = !(document?.parentId ?? parent)
  const base = projectPath(projectKey, "documents")

  const submit = () => {
    const draft = { title: title.trim(), body: body.trim(), labelIds: isTop ? labelIds : [] }
    if (document) {
      update.mutate({ id: document.id, draft }, {
        onSuccess: () => {
          toast.add({ type: "success", title: "문서를 고쳤습니다" })
          onSaved(document.id)
        },
      })
    } else {
      create.mutate({ ...draft, parentId: parent?.id }, {
        onSuccess: item => {
          toast.add({ type: "success", title: parent ? "하위 페이지를 만들었습니다" : "문서를 만들었습니다", description: item.title })
          onSaved(item.id)
        },
      })
    }
  }

  const name = document ? "문서 수정" : parent ? "새 하위 페이지" : "새 문서"
  const crumbs: Crumb[] = [
    { label: "프로젝트", href: paths.projects },
    { label: projectName, href: projectPath(projectKey) },
    { label: "문서", href: base },
    ...(document ? [{ label: document.title, href: `${base}/${document.id}` }] : parent ? [{ label: parent.title, href: `${base}/${parent.id}` }] : []),
    { label: name },
  ]
  return (
    <ComposeSurface surface={surface} crumbs={crumbs} chip={<PlaceChip icon={<FolderWithFilesIcon />} label={parent ? parent.title : `${projectName} 문서`} />}
      onClose={onClose}
      submit={{ label: document ? "저장" : "만들기", onSubmit: submit, isDisabled: !title.trim(), isPending: create.isPending || update.isPending }}
      pills={isTop && (
        <OptionPill label="문서 라벨" icon={TagIcon} isMultiple value={labelIds} onChange={setLabelIds}
          options={labels.map(label => ({ value: label.id, label: label.name, icon: <DocumentLabelDot color={label.color} /> }))} />
      )}>
      <ComposeFields title={title} onTitle={next => setTitle(next.slice(0, TITLE_MAX))} titlePlaceholder="문서 제목"
        body={body} onBody={setBody} bodyPlaceholder="내용을 Markdown으로 적어 주세요. ## 소제목, - 목록, > 인용" />
    </ComposeSurface>
  )
}
