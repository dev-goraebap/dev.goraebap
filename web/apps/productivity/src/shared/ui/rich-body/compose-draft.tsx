import { Suspense } from 'react';
import { Button } from '@goraebap/ui-react/compact/button';
import { LazyRichDraft as RichDraft } from './LazyRichBody';
import type { useMarkdownDraft } from './markdown-draft';
import { Spinner } from '@goraebap/ui-react/components/spinner';

/*
 * A compose form's title and its Markdown body on the paper (the kit's ComposeFields with the body editor in place of its
 * plain text box). The size follows the place: ComposeSurface marks a page (group/compose) for the larger title.
 * (Shared by the announcement and meeting compose forms.)
 */

export function ComposeTitle({ value, onChange, placeholder, isReadOnly }: {
  value: string; onChange: (value: string) => void; placeholder: string; isReadOnly?: boolean;
}) {
  return <input aria-label="제목" placeholder={placeholder} autoFocus autoComplete="off" value={value} readOnly={isReadOnly}
    onChange={event => onChange(event.target.value)}
    className="w-full bg-transparent text-lg leading-snug font-semibold outline-none placeholder:text-muted-foreground/70 group-data-page/compose:text-2xl" />;
}

/** The body being written, once the stored Markdown is open in the editor; why it cannot open, with a retry. */
export function DraftBody({ draft, draftId, label, placeholder }: {
  draft: ReturnType<typeof useMarkdownDraft>; draftId: string; label: string; placeholder?: string;
}) {
  if (draft.error) return <div role="alert" className="flex flex-col items-start gap-2 text-sm">
    {draft.error.message}
    <Button variant="secondary" size="sm" onClick={draft.retry}>본문 다시 불러오기</Button>
  </div>;
  const waiting = <Spinner aria-label="본문을 불러오는 중" className="text-muted-foreground" />;
  if (draft.isPending) return waiting;
  return <div className="min-h-14 group-data-page/compose:min-h-48">
    <Suspense fallback={waiting}>
      <RichDraft isMarkdownDraft id={draftId} label={label} value={draft.value} upload={draft.upload}
        onUploadPendingChange={draft.setUploadPending} onChange={draft.setValue} placeholder={placeholder} />
    </Suspense>
  </div>;
}
