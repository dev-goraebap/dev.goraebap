import { useState } from 'react';
import { cn } from 'cn';
import { ActionMenu, type MenuAction } from '@/shared/ui/kit/action-menu';
import { PenSquareIcon, Trash2Icon } from '@/shared/ui/kit/icon';
import { Quote } from '@/shared/ui/kit/reading';
import { activityActorName, type ActivityItem } from './activity-item';
import { ActivityActorPictures } from './ActivityActorPictures';
import { ActivityWhen } from './ActivityWhen';
import { CommentComposer } from './CommentComposer';

export type ActivityCommentProps = {
  item: ActivityItem; canEdit: boolean; canDelete: boolean; onQuote?: (quote: string, blockId?: string) => void;
  onSave: (body: string) => Promise<unknown>; onDelete: () => void; isReply?: boolean;
};

/**
 * A comment or a reply in a card: its writer's picture, name and when (고침 when changed) in its head, the words of the
 * body it quotes, then its text under the name. A reply is parted from what is above it by a hairline. Its writer
 * changes it in place with the same box.
 */
export function ActivityComment({ item, canEdit, canDelete, onQuote, onSave, onDelete, isReply = false }: ActivityCommentProps) {
  const [isEditing, setEditing] = useState(false);
  const actions: MenuAction[] = [
    ...(canEdit ? [{ label: '고치기', icon: PenSquareIcon, onSelect: () => setEditing(true) }] : []),
    ...(canDelete ? [{ label: '삭제', icon: Trash2Icon, onSelect: onDelete }] : []),
  ];
  const name = activityActorName(item);
  return <div aria-label={isReply ? `${name}의 답글` : undefined} className={cn('flex min-w-0 flex-col', isReply && 'border-t')}>
    <header className="flex min-h-10 items-center gap-2 pt-2 pr-2 pl-3 text-sm">
      <ActivityActorPictures item={item} />
      <span className="font-medium">{name}</span>
      <ActivityWhen item={item} isEdited={!!item.editedAt} />
      {item.resolvedAt ? <span className="text-xs text-muted-foreground">· 해결됨</span> : null}
      {actions.length && !isEditing ? <span className="ml-auto"><ActionMenu label="댓글 메뉴" actions={actions} size="row" /></span> : null}
    </header>
    {item.quote ? <Quote text={item.quote} onQuote={onQuote ? quote => onQuote(quote, item.blockId) : undefined} /> : null}
    {isEditing
      ? <div className="px-3 pt-1 pb-3">
        <CommentComposer initial={item.body ?? ''} label="댓글 고치기" onCancel={() => setEditing(false)}
          onSend={body => onSave(body).then(() => setEditing(false))} />
      </div>
      // The text starts under the name: in past the card's edge, the picture (an agent's mark beside it too) and their gap.
      : <p className={cn('m-0 pt-1 pr-4 pb-4 text-[0.875rem]/normal whitespace-pre-wrap wrap-anywhere max-md:text-base', item.agent ? 'pl-14' : 'pl-10')}>{item.body}</p>}
  </div>;
}
