import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { bodyActivityOptions, changeBodyComment, type BodyActivityEntry, type BodyTarget } from '@/entities/document';
import { sessionOptions } from '@/shared/auth';
import { ActivityFeed, type ActivityItem } from '@/shared/ui/activity';

/**
 * A document's or a 매뉴얼 chapter's 활동 (the common activity): the saves of its body and its discussion on one rule, the
 * box to comment at the foot for whoever may comment (canWrite: a document's project members, viewers too). Who moderates
 * (canModerate: the project's administrators) deletes any comment. onQuote shows in the body the words a comment quotes.
 */
export function BodyActivity({ target, id, canWrite, canModerate, onQuote }: {
  target: BodyTarget; id: string; canWrite: boolean; canModerate?: boolean; onQuote?: (quote: string, blockId?: string) => void;
}) {
  const client = useQueryClient();
  const options = bodyActivityOptions(target, id);
  const timeline = useQuery(options);
  const session = useQuery(sessionOptions()).data;
  const [error, setError] = useState<string>();
  const run = (change: Parameters<typeof changeBodyComment>[2]) => {
    setError(undefined);
    return changeBodyComment(target, id, change)
      .catch((failure: Error) => { setError(failure.message); throw failure; })
      .finally(() => client.invalidateQueries({ queryKey: options.queryKey }));
  };
  return <ActivityFeed items={(timeline.data ?? []).map(itemOf)} meId={session?.id} canWrite={canWrite}
    canModerate={canModerate ?? (session?.roles ?? []).includes('WORKSPACE_ADMIN')} error={error ?? timeline.error?.message} onQuote={onQuote}
    onComment={(text, parentId) => run({ text, parentId })} onEdit={(commentId, text) => run({ commentId, text })}
    onDelete={commentId => run({ commentId, isDeleting: true })} />;
}

const EVENT_TEXT: Record<string, string> = {
  COMMENT_EDITED: '댓글을 고쳤습니다', COMMENT_DELETED: '댓글을 지웠습니다', COMMENT_RESOLVED: '댓글 스레드를 해결했습니다',
  COMMENT_REOPENED: '댓글 스레드를 다시 열었습니다', BODY: '본문을 고쳤습니다',
};

function itemOf(entry: BodyActivityEntry): ActivityItem {
  return entry.kind === 'COMMENT'
    ? { id: entry.id, kind: 'comment', at: entry.at, actorId: entry.actorId, actorName: entry.actorName, agent: entry.agent, body: entry.body, quote: entry.quote, editedAt: entry.editedAt, parentId: entry.parentId,
      blockId: entry.blockId, resolvedAt: entry.resolvedAt }
    : { id: entry.id, kind: 'event', at: entry.at, actorId: entry.actorId, actorName: entry.actorName, agent: entry.agent,
      text: EVENT_TEXT[entry.field ?? ''] ?? '문서를 바꿨습니다', icon: entry.field === 'BODY' ? 'document' : entry.field?.startsWith('COMMENT_RE') ? 'comment' : 'edit' };
}
