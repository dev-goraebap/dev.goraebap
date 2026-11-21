import { useState } from 'react';
import { ActionMenu, type MenuAction } from '@/shared/ui/kit/action-menu';
import { PenSquareIcon, Trash2Icon } from '@/shared/ui/kit/icon';
import { CommentComposer } from '@/shared/ui/kit/reading';
import { PersonAvatar } from '@/shared/ui/person';
import { formatCommentAgo, type BlockCommentItem } from './block-comments';

export function BlockThreadComment({ item, canEdit, canDelete, onSave, onDelete }: {
  item: BlockCommentItem; canEdit: boolean; canDelete: boolean; onSave: (body: string) => Promise<unknown>; onDelete: () => void;
}) {
  const [isEditing, setEditing] = useState(false);
  const actions: MenuAction[] = [
    ...(canEdit ? [{ label: '댓글 고치기', icon: PenSquareIcon, onSelect: () => setEditing(true) }] : []),
    ...(canDelete ? [{ label: '댓글 지우기', icon: Trash2Icon, onSelect: onDelete }] : []),
  ];
  const name = `${item.actorName ?? '알 수 없는 사람'}${item.agent?.name ? ` · ${item.agent.name}` : ''}`;
  return <div className="flex flex-col gap-1 px-4 py-3">
    <div className="flex items-center gap-2">
      <PersonAvatar id={item.actorId} name={item.actorName} />
      <p className="min-w-0 truncate text-sm font-semibold">{name}</p>
      <p className="min-w-0 flex-1 text-xs whitespace-nowrap text-muted-foreground">{item.editedAt ? `${formatCommentAgo(item.at)} · 고침` : formatCommentAgo(item.at)}</p>
      {actions.length && !isEditing ? <ActionMenu label="댓글 메뉴" actions={actions} size="row" /> : null}
    </div>
    {isEditing
      ? <CommentComposer initial={item.body ?? ''} label="댓글 고치기" onCancel={() => setEditing(false)} onSend={body => onSave(body).then(() => setEditing(false))} />
      : <p className="m-0 ps-8 text-sm wrap-anywhere whitespace-pre-wrap">{item.body}</p>}
  </div>;
}
