import { closeHistory } from '@tiptap/pm/history';
import { Fragment, type Node as ProseNode } from '@tiptap/pm/model';
import { TextSelection, type EditorState, type Transaction } from '@tiptap/pm/state';

export type TreeBlock = { id: string; pos: number; node: ProseNode; index: number };
export type Destination = { anchorId?: string; side?: 'before' | 'after' };

/**
 * 옮길 수 있는 블록: 문서 바로 아래의 블록. 표 칸·목록 항목은 그 안의 편집 규칙을 따르므로 손잡이를 두지 않는다.
 * (토글·열·콜아웃처럼 블록을 담는 블록은 이 키트에 없다.)
 */
export function blockTree(doc: ProseNode): TreeBlock[] {
  const blocks: TreeBlock[] = [];
  doc.forEach((node, offset, index) => { const id = node.attrs.blockId as string | undefined; if (id) blocks.push({ id, pos: offset, node, index }); });
  return blocks;
}

export const selectionRoots = (blocks: TreeBlock[], ids: string[]) => { const chosen = new Set(ids); return blocks.filter(block => chosen.has(block.id)); };

export function destinationError(blocks: TreeBlock[], ids: string[], destination: Destination): string | null {
  const roots = selectionRoots(blocks, ids);
  if (!roots.length) return '이동할 블록이나 위치를 찾을 수 없습니다.';
  if (destination.anchorId) {
    const anchor = blocks.find(block => block.id === destination.anchorId);
    if (!anchor) return '이동 위치가 바뀌었습니다. 다시 선택하세요.';
    if (roots.some(root => root.id === anchor.id)) return '선택한 블록 위에는 놓을 수 없습니다.';
  }
  return null;
}

/** 옮기기 한 번은 실행 취소 한 단계다. 지운 뒤의 문서에서 ID로 다시 자리를 찾는다. */
export function blockMove(state: EditorState, ids: string[], destination: Destination): { transaction?: Transaction; ids: string[]; error?: string } {
  const blocks = blockTree(state.doc), roots = selectionRoots(blocks, ids), error = destinationError(blocks, ids, destination);
  if (error) return { ids: roots.map(block => block.id), error };
  let tr = closeHistory(state.tr);
  for (const block of [...roots].reverse()) tr = tr.delete(block.pos, block.pos + block.node.nodeSize);
  const fragment = Fragment.fromArray(roots.map(block => block.node));
  let insert = tr.doc.content.size;
  if (destination.anchorId) {
    const anchor = blockTree(tr.doc).find(block => block.id === destination.anchorId);
    if (!anchor) return { ids: [], error: '이동 위치가 바뀌었습니다.' };
    insert = anchor.pos + (destination.side === 'after' ? anchor.node.nodeSize : 0);
  }
  tr = tr.insert(insert, fragment);
  const first = blockTree(tr.doc).find(block => block.id === roots[0].id);
  if (first) tr = tr.setSelection(TextSelection.near(tr.doc.resolve(first.pos + 1)));
  if (tr.doc.eq(state.doc)) return { ids: roots.map(block => block.id) };
  return { transaction: tr.setMeta('blockMove', true), ids: roots.map(block => block.id) };
}

/** 고른 블록을 한 칸 위(-1)·아래(1)로 옮길 자리. 끝이면 null. */
export function siblingStep(blocks: TreeBlock[], ids: string[], direction: number): Destination | null {
  const indices = selectionRoots(blocks, ids).map(block => blocks.indexOf(block));
  if (!indices.length) return null;
  const next = (direction < 0 ? Math.min(...indices) : Math.max(...indices)) + direction;
  if (next < 0 || next >= blocks.length) return null;
  return { anchorId: blocks[next].id, side: direction < 0 ? 'before' : 'after' };
}
