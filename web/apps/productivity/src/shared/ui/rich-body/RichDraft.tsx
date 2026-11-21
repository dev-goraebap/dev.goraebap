import { blank, nodeText, RichDocument, type JSONNode, type UploadFile } from '@/shared/lib/rich-document';
import { useState } from 'react';
import { useSerifBody } from '@/shared/lib/appearance';

/** Whether a body holds nothing: no words, and no block but an empty line. */
const isBlank = (body?: JSONNode) => !body || (!nodeText(body).trim() && (body.content?.length ?? 0) <= 1 && !body.content?.[0]?.content?.length);

/**
 * A body being written before it is anything (a new work item's, a new event's): the same editor as RichBody, open for
 * writing from the start, with nothing saved on its own (the form keeps value and sends it with the rest). While it is
 * empty its first line holds placeholder, as a sheet of paper with a hint on it. id names the draft; a new one starts over.
 */
export function RichDraft({ id, label, value, onChange, placeholder, upload, onUploadPendingChange, isMarkdownDraft }: {
  id: string; label?: string; value?: JSONNode; onChange: (body: JSONNode) => void; placeholder?: string; isMarkdownDraft?: boolean; upload?: UploadFile; onUploadPendingChange?: (pending: boolean) => void;
}) {
  const [isEmpty, setEmpty] = useState(() => isBlank(value));
  const isSerif = useSerifBody();
  return <div className="relative flex min-w-0 flex-col">
    {placeholder && isEmpty ? <p className="pointer-events-none absolute start-0 top-0 text-muted-foreground/70" aria-hidden>{placeholder}</p> : null}
    <RichDocument documentId={id} label={label} value={value ?? blank} mode="edit" font={isSerif ? 'serif' : 'default'} isMarkdownDraft={isMarkdownDraft} upload={upload} onUploadPendingChange={onUploadPendingChange}
      onChange={body => { setEmpty(isBlank(body)); onChange(body); }} />
  </div>;
}
