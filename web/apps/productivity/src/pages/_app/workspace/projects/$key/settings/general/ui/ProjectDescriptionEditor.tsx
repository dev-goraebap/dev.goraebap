import { Button } from '@goraebap/ui-react/compact/button';
import { Spinner } from '@goraebap/ui-react/components/spinner';
import { RichDraft } from '@/shared/ui/rich-body';
import type { useMarkdownDraft } from '@/shared/ui/rich-body/markdown-draft';

/** 설명 칸: 프로젝트 설명(Markdown)을 본문 편집기로 쓴다. 불러오지 못하면 다시 불러오기를 둔다. */
export function ProjectDescriptionEditor({ draft, draftId }: { draft: ReturnType<typeof useMarkdownDraft>; draftId: string }) {
  if (draft.error) return <div className="flex flex-col items-start gap-2">
    <p role="alert" className="text-sm">{draft.error.message}</p>
    <Button variant="secondary" size="sm" onClick={draft.retry}>본문 다시 불러오기</Button>
  </div>;
  if (draft.isPending) return <Spinner aria-label="본문을 불러오는 중" />;
  return <RichDraft isMarkdownDraft id={draftId} label="프로젝트 설명" value={draft.value} upload={draft.upload}
    onUploadPendingChange={draft.setUploadPending} onChange={draft.setValue} placeholder="프로젝트가 하는 일과 목표" />;
}
