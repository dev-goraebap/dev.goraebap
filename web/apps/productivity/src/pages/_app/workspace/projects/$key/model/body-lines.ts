import { diffLines, diffWordsWithSpace } from 'diff';
import type { JSONNode } from '@/shared/lib/rich-document';

const textOf = (node?: JSONNode): string => !node ? '' : node.text ?? (node.type === 'hardBreak' ? ' ' : (node.content ?? []).map(textOf).join(''));

/**
 * 본문을 읽을 수 있는 줄들로: 제목은 #, 목록은 - · 1. · [x], 인용·안내는 >, 코드는 ``` 울타리, 표는 | 칸 |, 도표·수식은 원문, 파일은 이름.
 * git이 파일을 줄로 비교하듯 버전 둘을 이 줄들로 비교한다(빈 문단은 줄을 만들지 않는다).
 */
export function bodyLines(doc: JSONNode | null | undefined): string[] {
  const lines: string[] = [];
  const walk = (node: JSONNode, indent: string, quote: string) => {
    const put = (text: string) => lines.push(`${quote}${indent}${text}`);
    switch (node.type) {
      case 'paragraph': { const text = textOf(node); if (text.trim()) put(text); return; }
      case 'heading': put(`${'#'.repeat(Number(node.attrs?.level) || 2)} ${textOf(node)}`); return;
      case 'bulletList': case 'orderedList': case 'taskList':
        (node.content ?? []).forEach((item, index) => {
          const mark = node.type === 'orderedList' ? `${index + 1}. ` : node.type === 'taskList' ? `- [${item.attrs?.checked ? 'x' : ' '}] ` : '- ';
          const [first, ...rest] = item.content ?? [];
          put(`${mark}${first ? textOf(first) : ''}`);
          rest.forEach(child => walk(child, `${indent}  `, quote));
        });
        return;
      case 'blockquote': case 'callout': (node.content ?? []).forEach(child => walk(child, indent, `${quote}> `)); return;
      case 'codeBlock': case 'mermaidBlock': {
        put(`\`\`\`${node.type === 'mermaidBlock' ? 'mermaid' : String(node.attrs?.language ?? '')}`);
        (node.type === 'mermaidBlock' ? String(node.attrs?.source ?? '') : textOf(node)).split('\n').forEach(put);
        put('```');
        return;
      }
      case 'mathBlock': put(`$$ ${String(node.attrs?.source ?? '')} $$`); return;
      case 'horizontalRule': put('---'); return;
      case 'media': put(`[${String(node.attrs?.mime ?? '').startsWith('image/') ? '그림' : '파일'}: ${String(node.attrs?.name ?? '')}]`); return;
      case 'webEmbed': put(`[링크: ${String(node.attrs?.url ?? node.attrs?.src ?? '')}]`); return;
      case 'table': (node.content ?? []).forEach(row => put(`| ${(row.content ?? []).map(cell => (cell.content ?? []).map(textOf).join(' ')).join(' | ')} |`)); return;
      case 'toggle': {
        const [summary, body] = node.content ?? [];
        put(`▸ ${textOf(summary)}`);
        (body?.content ?? []).forEach(child => walk(child, `${indent}  `, quote));
        return;
      }
      default:
        if (node.content?.some(child => child.type !== 'text')) node.content.forEach(child => walk(child, indent, quote));
        else { const text = textOf(node); if (text.trim()) put(text); }
    }
  };
  (doc?.content ?? []).forEach(node => walk(node, '', ''));
  return lines;
}

export type Piece = { text: string; isChanged: boolean };
/** 좌우 한 줄: 왼쪽(앞 버전)·오른쪽(이 버전)의 줄 번호와 글. 바뀐 줄의 짝은 바뀐 낱말을 표시한다. */
export type Row = { kind: 'same' | 'change'; left?: { number: number; pieces: Piece[] }; right?: { number: number; pieces: Piece[] } };
export type Hunk = { rows: Row[]; hidden: number; from: number };
export type LineDiff = { hunks: Hunk[]; added: number; removed: number; tail: number };

/** 두 줄의 낱말 차이: 왼쪽은 지운 낱말, 오른쪽은 넣은 낱말을 표시한다. */
function wordPieces(before: string, after: string): [Piece[], Piece[]] {
  const left: Piece[] = [], right: Piece[] = [];
  for (const part of diffWordsWithSpace(before, after)) {
    if (!part.added) left.push({ text: part.value, isChanged: !!part.removed });
    if (!part.removed) right.push({ text: part.value, isChanged: !!part.added });
  }
  return [left, right];
}

/**
 * GitHub의 나란히 보기처럼: 줄 비교로 같은 줄은 양쪽에, 지운 줄은 왼쪽, 넣은 줄은 오른쪽에 두고, 지운 줄과 넣은 줄이 이어지면 한 행에
 * 짝지어 바뀐 낱말을 표시한다. 바뀐 곳 앞뒤로 context 줄만 남기고 나머지 같은 줄은 접어 둔 줄 수(hidden)로 센다.
 */
export function lineDiff(before: string[], after: string[], context = 3): LineDiff {
  const rows: Row[] = [];
  let left = 0, right = 0, added = 0, removed = 0;
  const parts = diffLines(before.map(line => `${line}\n`).join(''), after.map(line => `${line}\n`).join(''));
  const linesOf = (value: string) => value.replace(/\n$/, '').split('\n');
  for (let index = 0; index < parts.length; index++) {
    const part = parts[index];
    if (!part.added && !part.removed) {
      linesOf(part.value).forEach(text => rows.push({ kind: 'same', left: { number: ++left, pieces: [{ text, isChanged: false }] }, right: { number: ++right, pieces: [{ text, isChanged: false }] } }));
      continue;
    }
    const gone = part.removed ? linesOf(part.value) : [];
    const next = part.removed && parts[index + 1]?.added ? parts[++index] : part.added ? part : undefined;
    const come = next ? linesOf(next.value) : [];
    removed += gone.length; added += come.length;
    for (let at = 0; at < Math.max(gone.length, come.length); at++) {
      const [l, r] = at < gone.length && at < come.length ? wordPieces(gone[at], come[at])
        : [at < gone.length ? [{ text: gone[at], isChanged: false }] : [], at < come.length ? [{ text: come[at], isChanged: false }] : []];
      rows.push({ kind: 'change', left: at < gone.length ? { number: ++left, pieces: l } : undefined, right: at < come.length ? { number: ++right, pieces: r } : undefined });
    }
  }
  // 바뀐 행 앞뒤 context 줄만 남기고 묶는다.
  const keep = rows.map(() => false);
  rows.forEach((row, at) => { if (row.kind === 'change') for (let near = Math.max(0, at - context); near <= Math.min(rows.length - 1, at + context); near++) keep[near] = true; });
  const hunks: Hunk[] = [];
  let hidden = 0;
  rows.forEach((row, at) => {
    if (!keep[at]) { hidden++; return; }
    if (at === 0 || !keep[at - 1]) { hunks.push({ rows: [], hidden, from: at }); hidden = 0; }
    hunks[hunks.length - 1].rows.push(row);
  });
  return { hunks, added, removed, tail: hidden };
}
