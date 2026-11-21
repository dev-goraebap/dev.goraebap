import { useState } from 'react';
import { CommentComposer } from './CommentComposer';

/**
 * A card's foot, as Linear's: a quiet 답글 남기기 row under a hairline; pressed, the comment box in its place (Esc or
 * 취소 folds it back). A reply sent folds it too.
 */
export function ActivityReplyBox({ onSend }: { onSend: (body: string) => Promise<unknown> }) {
  const [isOpen, setOpen] = useState(false);
  return <div className="border-t px-3 py-2">
    {isOpen
      ? <CommentComposer label="답글" placeholder="답글을 남겨 주세요" onCancel={() => setOpen(false)}
        onSend={body => onSend(body).then(() => setOpen(false))} />
      : <button type="button" onClick={() => setOpen(true)}
        className="h-8 w-full cursor-text rounded-md px-2 text-left text-sm text-muted-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring max-md:h-11">
        답글 남기기…
      </button>}
  </div>;
}
