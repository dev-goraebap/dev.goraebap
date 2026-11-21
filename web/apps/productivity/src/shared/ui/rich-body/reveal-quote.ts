import { toast } from '@/shared/ui/kit/toast';
import { openBlockThread } from './block-comments';

/**
 * Shows in the body on the page the words a comment quotes: picks the first place they are still written and brings it
 * into view; false when the body no longer has them.
 */
export function revealQuote(quote: string): boolean {
  const line = quote.split('\n').map(each => each.trim()).find(Boolean);
  if (!line) return false;
  for (const root of document.querySelectorAll('.bit-rich-document .ProseMirror')) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const at = node.textContent?.indexOf(line) ?? -1;
      if (at < 0) continue;
      const range = document.createRange();
      range.setStart(node, at);
      range.setEnd(node, at + line.length);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      (node.parentElement ?? (root as HTMLElement)).scrollIntoView({ behavior: 'smooth', block: 'center' });
      return true;
    }
  }
  return false;
}

/**
 * 활동 기록에서 댓글이 가리키는 곳을 본문에 보인다: 블록 댓글이면 그 블록으로 가서 스레드를 열고, 옛 인용 댓글이면 그 글을 고른다.
 * 본문에 더는 없으면 그렇다고 알린다.
 */
export function useRevealQuote() {
  return (quote: string, blockId?: string) => {
    if (blockId ? openBlockThread(blockId) : revealQuote(quote)) return;
    toast.add({ title: blockId ? '본문에서 지워진 블록입니다.' : '본문에서 바뀌었거나 지워진 글입니다.' });
  };
}
