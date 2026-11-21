import { useState } from 'react';
import { ConfirmDialog } from '@/shared/ui/kit/confirm-dialog';
import { activityActorName, type ActivityItem } from './activity-item';
import { ActivityComment, type ActivityCommentProps } from './ActivityComment';
import { ActivityEventLine } from './ActivityEventLine';
import { ActivityReplyBox } from './ActivityReplyBox';
import { CommentComposer } from './CommentComposer';
import { Timeline } from './Timeline';
import { TimelineItem } from './TimelineItem';

/**
 * 활동: what happened to a thing with a body and what was said about it, on one rule as GitHub draws an issue's (BIT's
 * 활동), oldest first: the changes as quiet lines with their mark on the rule, the comments as cards over it (a quote of the
 * body they were written on above their text; onQuote shows those words in the body), each with its replies inside it
 * as Linear's threads, one level. Whoever may write comments in the box at the foot (Enter sends, Shift+Enter a new line)
 * and replies at a card's foot; their own they change and delete, and a moderator deletes anyone's. The kit's reading
 * ActivityFeed draws the same; this one keeps cowork's agents, automatic actors and resolved threads.
 */
export function ActivityFeed({ items, meId, canWrite, canModerate = false, error, onComment, onEdit, onDelete, onQuote }: {
  items: ActivityItem[]; meId?: string; canWrite: boolean; canModerate?: boolean;
  /** Why the last change to the comments failed, said under the box. */
  error?: string;
  /** A comment, or with parentId a reply to that comment. */
  onComment: (body: string, parentId?: string) => Promise<unknown>;
  onEdit: (id: string, body: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  onQuote?: (quote: string, blockId?: string) => void;
}) {
  const [deleting, setDeleting] = useState<ActivityItem | null>(null);
  const [isBusy, setBusy] = useState(false);
  const remove = (item: ActivityItem) => {
    setBusy(true);
    onDelete(item.id).then(() => setDeleting(null), () => undefined).finally(() => setBusy(false));
  };
  // A reply stands in its comment's card; one whose comment is gone stands on its own.
  const ids = new Set(items.map(item => item.id));
  const isReply = (item: ActivityItem) => !!item.parentId && ids.has(item.parentId);
  const repliesOf = (id: string) => items.filter(item => item.parentId === id);
  const mine = (item: ActivityItem) => !!meId && item.actorId === meId;
  const comment = (item: ActivityItem): ActivityCommentProps => ({
    item, canEdit: canWrite && mine(item), canDelete: canWrite && (mine(item) || canModerate), onQuote,
    onSave: body => onEdit(item.id, body), onDelete: () => setDeleting(item),
  });
  return <section aria-label="활동" className="flex flex-col gap-3">
    <h2 className="text-xs font-medium text-muted-foreground">활동</h2>
    {items.length ? <Timeline label="활동 기록">
      {items.filter(item => !isReply(item)).map(item => (item.kind === 'comment'
        ? <TimelineItem key={item.id} kind="card">
          <article aria-label={`${activityActorName(item)}의 댓글`} className="rounded-xl border bg-card">
            <ActivityComment {...comment(item)} />
            {repliesOf(item.id).map(reply => <ActivityComment key={reply.id} {...comment(reply)} isReply />)}
            {canWrite ? <ActivityReplyBox onSend={body => onComment(body, item.id)} /> : null}
          </article>
        </TimelineItem>
        : <ActivityEventLine key={item.id} item={item} />))}
    </Timeline> : null}
    {canWrite ? <CommentComposer onSend={onComment} /> : null}
    {error ? <p role="alert" className="text-xs text-muted-foreground">{error}</p> : null}
    <ConfirmDialog open={!!deleting} onOpenChange={open => { if (!open && !isBusy) setDeleting(null); }}
      title="댓글을 지울까요?" description="지운 댓글은 활동에서 사라집니다."
      action={{ label: '삭제', onAction: () => { if (deleting) remove(deleting); }, isPending: isBusy }} />
  </section>;
}
