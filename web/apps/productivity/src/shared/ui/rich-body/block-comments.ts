import type { CSSProperties } from 'react';

/** 블록 스레드의 댓글 하나: 첫 댓글이나 답글. */
export type BlockCommentItem = {
  id: string; at: string; actorId?: string; actorName?: string; body?: string; editedAt?: string;
  agent?: { name?: string };
};
/** 본문 블록 하나에 달린 스레드: 첫 댓글의 id, 그 블록, 단 때의 블록 글 앞부분, 해결 여부와 댓글들(첫 댓글부터). */
export type BlockThread = { id: string; blockId: string; quote?: string; resolvedAt?: string; comments: BlockCommentItem[] };
/**
 * 본문의 블록 댓글(2026-11-11 사용자 결정): 댓글은 주인의 활동 기록에 있고, 스레드 첫 댓글이 블록 하나에 달린다. 도메인이 활동 기록에서
 * 스레드를 만들어(blockThreadsOf) 주고, 쓰기·답글·고치기·지우기·해결을 맡는다.
 */
export type BlockComments = {
  threads: BlockThread[]; meId?: string; canComment: boolean; canModerate?: boolean;
  create: (blockId: string, quote: string, body: string) => Promise<unknown>;
  reply: (threadId: string, body: string) => Promise<unknown>;
  edit: (commentId: string, body: string) => Promise<unknown>;
  remove: (commentId: string) => Promise<unknown>;
  resolve: (threadId: string, resolved: boolean) => Promise<unknown>;
};

export type BlockBox = { top: number; left: number; width: number; height: number };

/** 활동 기록의 댓글에서 블록 스레드를 만든다: 블록에 달린 첫 댓글마다 그 답글을 차례로 붙인다. */
export function blockThreadsOf<T extends BlockCommentItem & { parentId?: string; blockId?: string; quote?: string; resolvedAt?: string }>(comments: T[]): BlockThread[] {
  const roots = comments.filter(comment => !comment.parentId && comment.blockId);
  return roots.map(root => ({
    id: root.id, blockId: root.blockId!, quote: root.quote, resolvedAt: root.resolvedAt,
    comments: [root, ...comments.filter(comment => comment.parentId === root.id)],
  }));
}

/** 활동 기록(댓글과 일)에서 블록 댓글을 만든다: 댓글만 골라 스레드로 묶고, 쓰기·해결은 도메인이 준 것으로. */
export function blockCommentsOf(entries: readonly ({ kind: string; id: string; at: string; actorId?: string; actorName?: string; body?: string; editedAt?: string;
  agent?: { name?: string }; parentId?: string; blockId?: string; quote?: string; resolvedAt?: string })[], rest: Omit<BlockComments, 'threads'>): BlockComments {
  return { ...rest, threads: blockThreadsOf(entries.filter(entry => entry.kind === 'COMMENT')) };
}

export const BLOCK_THREAD_EVENT = 'cowork:block-thread';
/** 활동 기록에서 블록 댓글을 누르면: 본문이 그 블록으로 가서 스레드를 연다. 본문에 그 블록이 없으면 false. */
export function openBlockThread(blockId: string): boolean {
  if (!document.querySelector(`.ProseMirror [data-block-id="${CSS.escape(blockId)}"]`)) return false;
  window.dispatchEvent(new CustomEvent(BLOCK_THREAD_EVENT, { detail: blockId }));
  return true;
}

const when = new Intl.RelativeTimeFormat('ko-KR', { numeric: 'auto' });
export function formatCommentAgo(at: string) {
  const seconds = (new Date(at).getTime() - Date.now()) / 1000;
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [['second', 60], ['minute', 60], ['hour', 24], ['day', 30], ['month', 12], ['year', Infinity]];
  let value = seconds;
  for (const [unit, size] of steps) {
    if (Math.abs(value) < size) return unit === 'second' ? '방금' : when.format(Math.round(value), unit);
    value /= size;
  }
  return '';
}

/** 본문의 맨 바깥 블록: 블록 id → 그 블록의 바깥 요소(표처럼 감싼 상자가 있으면 그 상자). */
export function topBlocks(box: HTMLElement) {
  const map = new Map<string, HTMLElement>();
  box.querySelectorAll<HTMLElement>('.ProseMirror > *').forEach(element => {
    const id = element.dataset.blockId ?? element.querySelector<HTMLElement>(':scope > [data-block-id]')?.dataset.blockId;
    if (id && !map.has(id)) map.set(id, element);
  });
  return map;
}

export const topBlockAt = (target: EventTarget | null) => {
  let element = (target as HTMLElement | null)?.closest?.<HTMLElement>('.ProseMirror > *') ?? null;
  while (element && !element.parentElement?.classList.contains('ProseMirror')) element = element.parentElement?.closest<HTMLElement>('.ProseMirror > *') ?? null;
  return element;
};

export const blockElementId = (element: HTMLElement) => element.dataset.blockId ?? element.querySelector<HTMLElement>(':scope > [data-block-id]')?.dataset.blockId;

/**
 * 댓글이 달린 블록의 모양(Tiptap의 댓글 글처럼): 글을 조금 옅게, 노란 점선 밑줄. 올리거나 그 스레드를 보는 동안 진하게. 블록 id는
 * 이 화면이 만든 값이라 따옴표만 걸러 선택자에 넣는다.
 */
export function blockMarkRules(scope: string, blockIds: string[], active: string | null) {
  const at = (id: string) => {
    const safe = id.replace(/["\\]/g, '');
    return `[data-comment-scope="${scope}"] .ProseMirror > :is([data-block-id="${safe}"], :has(> [data-block-id="${safe}"]))`;
  };
  const all = blockIds.map(at).join(',\n');
  return `${all} { cursor: pointer; opacity: 0.72;
  text-decoration: underline dashed color-mix(in srgb, var(--mark-medium) 85%, transparent); text-decoration-thickness: 1.5px;
  text-underline-offset: 0.3em; transition: opacity 120ms ease, text-decoration-color 120ms ease; }
${blockIds.map(id => `${at(id)}:hover`).join(',\n')}${active && blockIds.includes(active) ? `,\n${at(active)}` : ''} {
  opacity: 1; text-decoration-color: var(--mark-medium); }`;
}

/** 본문 칸에 붙이는 모양: 층의 기준이 되고, 댓글 모드에서는 커서가 '더하기'(copy)로 바뀐다. */
export const blockCommentBox = 'relative data-[commenting=true]:cursor-copy data-[commenting=true]:[&_.ProseMirror]:cursor-copy';

export const blockBoxStyle = (place: BlockBox) => ({
  insetBlockStart: `${place.top}px`, insetInlineStart: `${place.left}px`, inlineSize: `${place.width}px`, blockSize: `${place.height}px`,
}) as CSSProperties;
