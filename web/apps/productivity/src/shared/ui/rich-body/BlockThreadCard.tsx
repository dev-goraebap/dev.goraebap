import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Button } from '@/shared/ui/kit/button';
import { ConfirmDialog } from '@/shared/ui/kit/confirm-dialog';
import { CheckIcon, XIcon } from '@/shared/ui/kit/icon';
import { CommentComposer } from '@/shared/ui/kit/reading';
import type { BlockBox, BlockCommentItem, BlockComments, BlockThread } from './block-comments';
import { BlockThreadComment } from './BlockThreadComment';

/** 블록 아래에 뜨는 스레드 창: 첫 댓글과 답글, 해결·닫기, 답글 칸(스레드가 없으면 새 댓글 칸). Esc나 바깥을 누르면 닫는다. */
export function BlockThreadCard({ place, thread, comments, onClose, onCreate }: {
  place: BlockBox; thread?: BlockThread; comments: BlockComments; onClose: () => void; onCreate: (body: string) => Promise<unknown>;
}) {
  const card = useRef<HTMLDivElement>(null);
  const [deleting, setDeleting] = useState<BlockCommentItem | null>(null);
  const [isBusy, setBusy] = useState(false);
  useEffect(() => {
    const keys = (event: KeyboardEvent) => { if (event.key === 'Escape' && !deleting) onClose(); };
    const outside = (event: globalThis.PointerEvent) => {
      const target = event.target as Node;
      if (card.current?.contains(target) || (target as Element).closest?.('[role="menu"], [role="dialog"], [role="alertdialog"]')) return;
      onClose();
    };
    window.addEventListener('keydown', keys);
    window.addEventListener('pointerdown', outside, true);
    return () => { window.removeEventListener('keydown', keys); window.removeEventListener('pointerdown', outside, true); };
  }, [onClose, deleting]);
  // 열리면 창이 보이게 하고 입력 칸으로 간다(바로 쓸 수 있게).
  useEffect(() => {
    card.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    card.current?.querySelector<HTMLElement>('textarea, [contenteditable="true"]')?.focus({ preventScroll: true });
  }, []);
  const at = { insetBlockStart: `${place.top + place.height + 8}px`, insetInlineStart: `${Math.max(0, place.left)}px` } as CSSProperties;
  const mine = (item: BlockCommentItem) => !!comments.meId && item.actorId === comments.meId;
  const remove = (item: BlockCommentItem) => {
    setBusy(true);
    comments.remove(item.id).finally(() => { setBusy(false); setDeleting(null); if (thread && item.id === thread.id) onClose(); });
  };
  return <div ref={card} role="dialog" aria-label="블록 댓글"
    className="absolute z-5 box-border flex max-h-120 w-[min(26rem,100%)] flex-col overflow-hidden rounded-[0.875rem] border border-input bg-popover text-popover-foreground shadow-lg"
    // check-ui: allow-style 블록 아래 자리(잰 값)다.
    style={at} onPointerDown={(event: PointerEvent) => event.stopPropagation()}>
    <div className="flex flex-none items-center gap-1 border-b py-2 pr-2 pl-4">
      <p className="min-w-0 flex-1 text-sm font-semibold text-muted-foreground">{thread ? '댓글' : '새 댓글'}</p>
      {thread && comments.canComment ? <Button variant="ghost" size="icon-sm" aria-label="해결" title="해결하고 닫기"
        onClick={() => void comments.resolve(thread.id, true).then(onClose)}><CheckIcon /></Button> : null}
      <Button variant="ghost" size="icon-sm" aria-label="닫기" title="닫기 (Esc)" onClick={onClose}><XIcon /></Button>
    </div>
    {thread ? <div className="flex min-h-0 flex-auto flex-col divide-y overflow-y-auto">
      {thread.comments.map(item => <BlockThreadComment key={item.id} item={item}
        canEdit={comments.canComment && mine(item)} canDelete={comments.canComment && (mine(item) || !!comments.canModerate)}
        onSave={body => comments.edit(item.id, body)} onDelete={() => setDeleting(item)} />)}
    </div> : null}
    {comments.canComment ? <div className="flex-none border-t px-3 pt-2 pb-3">
      <CommentComposer label={thread ? '답글' : '댓글'} placeholder={thread ? '답글 쓰기…' : '댓글 쓰기…'}
        onSend={body => thread ? comments.reply(thread.id, body) : onCreate(body)} />
    </div> : null}
    <ConfirmDialog open={!!deleting} onOpenChange={value => { if (!value && !isBusy) setDeleting(null); }}
      title="댓글을 지울까요?" description={deleting && thread && deleting.id === thread.id ? '첫 댓글을 지우면 이 블록의 스레드가 닫힙니다. 답글은 활동에 남습니다.' : '지운 댓글은 활동에서 사라집니다.'}
      action={{ label: '삭제', isPending: isBusy, onAction: () => { if (deleting) remove(deleting); } }} />
  </div>;
}
