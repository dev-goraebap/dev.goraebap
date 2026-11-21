import { CommentComposer as KitCommentComposer } from '@/shared/ui/kit/reading';

/**
 * Where a comment is written: the kit's comment box (its round send button inside; Enter sends, Shift+Enter breaks the
 * line). The text stays until it is saved, so a failed send loses nothing; a comment keeps to 10,000 characters, the
 * server's limit. Changing one, 취소 gives it up.
 */
export function CommentComposer({ initial = '', label = '댓글', placeholder = '의견을 남겨 주세요', onSend, onCancel }: {
  initial?: string; label?: string; placeholder?: string;
  onSend: (body: string) => Promise<unknown>; onCancel?: () => void;
}) {
  return <KitCommentComposer initial={initial} label={label} placeholder={placeholder} onCancel={onCancel}
    onSend={body => onSend(body.slice(0, 10000))} />;
}
