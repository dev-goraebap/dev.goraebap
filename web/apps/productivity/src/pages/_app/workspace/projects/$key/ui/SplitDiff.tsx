import { Fragment, useMemo, useState, type ReactNode } from 'react';
import type { JSONNode } from '@/shared/lib/rich-document';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { cn } from 'cn';
import { Button } from '@goraebap/ui-react/compact/button';
import { bodyLines, lineDiff, type Piece, type Row } from '../model/body-lines';

type Kind = 'removed' | 'added' | 'same';

/*
 * 칸의 모양(GitHub 나란히 보기): 지운 줄은 빨강 바탕, 넣은 줄은 초록 바탕, 번호 · 부호는 그 색의 글자, 짝이 없는 쪽은 옅은 회색.
 * 색은 일정 분류의 빨강 · 초록 토큰이라 다크에서도 테마가 바꾼다.
 */
const TONE: Record<Kind | 'empty', string> = {
  removed: 'bg-event-red/55',
  added: 'bg-event-green/55',
  same: '',
  empty: 'bg-foreground/3',
};
const INK: Record<Kind, string> = { removed: 'text-event-red-foreground', added: 'text-event-green-foreground', same: 'text-muted-foreground' };
const NUMBER = 'px-2 text-right align-top text-muted-foreground tabular-nums select-none';
const SIGN = 'text-center align-top text-muted-foreground select-none';
const CODE = 'pr-2 align-top whitespace-pre-wrap wrap-anywhere';
/** 고친 줄에서 바뀐 낱말: 같은 색을 진하게. */
const WORD: Record<Kind, string> = { removed: 'bg-event-red-foreground/20', added: 'bg-event-green-foreground/20', same: '' };

const text = (pieces: Piece[], kind: Kind) => pieces.map((piece, at) => piece.isChanged
  ? <mark key={at} className={cn('rounded-[0.1875rem] text-inherit', WORD[kind])}>{piece.text}</mark> : <Fragment key={at}>{piece.text}</Fragment>);
const sign = (kind: Kind) => kind === 'removed' ? '−' : kind === 'added' ? '+' : '';

function Side({ side, kind, isLeft }: { side?: Row['left']; kind: Kind; isLeft?: boolean }) {
  // 왼쪽 열 끝의 가는 선으로 두 쪽을 가른다.
  const divider = isLeft ? 'border-r' : '';
  if (!side) return <><td className={cn(NUMBER, TONE.empty)} /><td className={cn(SIGN, TONE.empty)} /><td className={cn(CODE, TONE.empty, divider)} /></>;
  return <>
    <td className={cn(NUMBER, TONE[kind], kind !== 'same' && INK[kind])}>{side.number}</td>
    <td className={cn(SIGN, TONE[kind], kind !== 'same' && INK[kind])}>{sign(kind)}</td>
    <td className={cn(CODE, TONE[kind], divider)}>{text(side.pieces, kind)}</td>
  </>;
}

/** 위아래로 보기의 한 줄: 앞 번호·뒤 번호·부호·글. */
function Line({ before, after, pieces, kind }: { before?: number; after?: number; pieces: Piece[]; kind: Kind }) {
  const ink = kind !== 'same' && INK[kind];
  return <tr>
    <td className={cn(NUMBER, TONE[kind], ink)}>{before ?? ''}</td>
    <td className={cn(NUMBER, TONE[kind], ink)}>{after ?? ''}</td>
    <td className={cn(SIGN, TONE[kind], ink)}>{sign(kind)}</td>
    <td className={cn(CODE, TONE[kind])}>{text(pieces, kind)}</td>
  </tr>;
}

/** 위아래로 보기(git diff): 같은 줄은 한 번, 바뀐 곳은 지운 줄들 다음에 넣은 줄들. */
function stackedRows(rows: Row[]): ReactNode[] {
  const out: ReactNode[] = [];
  let at = 0;
  while (at < rows.length) {
    const row = rows[at];
    if (row.kind === 'same') { out.push(<Line key={`s${at}`} before={row.left?.number} after={row.right?.number} pieces={row.left?.pieces ?? []} kind="same" />); at++; continue; }
    const run: Row[] = [];
    while (at < rows.length && rows[at].kind === 'change') run.push(rows[at++]);
    run.forEach((each, index) => { if (each.left) out.push(<Line key={`r${at}-${index}`} before={each.left.number} pieces={each.left.pieces} kind="removed" />); });
    run.forEach((each, index) => { if (each.right) out.push(<Line key={`a${at}-${index}`} after={each.right.number} pieces={each.right.pieces} kind="added" />); });
  }
  return out;
}

/**
 * GitHub처럼 두 본문을 줄로 비교한다. 넓은 화면은 나란히(왼쪽 before, 오른쪽 after), 휴대폰은 위아래로(지운 줄 다음 넣은 줄). 지운 줄은
 * 빨강(−), 넣은 줄은 초록(+), 고친 줄은 바뀐 낱말만 진하게. 바뀐 곳 앞뒤 세 줄만 두고 나머지 같은 줄은 접는다(모두 펼치기로 다 본다).
 */
export function SplitDiff({ before, after, title }: { before: JSONNode | null; after: JSONNode | null; title: string }) {
  const [isAll, setAll] = useState(false);
  const isStacked = useIsMobile();
  const diff = useMemo(() => lineDiff(bodyLines(before), bodyLines(after), isAll ? Number.MAX_SAFE_INTEGER : 3), [before, after, isAll]);
  const isSame = diff.added === 0 && diff.removed === 0;
  const span = isStacked ? 4 : 6;
  const gap = (count: number, key: string) => count > 0 ? <tr key={key}>
    <td colSpan={span} className="bg-muted px-3 py-1 text-xs text-muted-foreground">⋯ 같은 줄 {count}개</td>
  </tr> : null;
  const numberCol = isStacked ? 'w-9' : 'w-12';
  return <div className="flex flex-col overflow-hidden rounded-xl border bg-card">
    <div className="flex items-center gap-2 border-b bg-muted px-3 py-2">
      <span className="min-w-0 flex-1 truncate font-semibold">{title}</span>
      <span className="text-xs text-event-green-foreground">+{diff.added}</span>
      <span className="text-xs text-event-red-foreground">−{diff.removed}</span>
      {isSame ? null : <Button variant="ghost" size="sm" onClick={() => setAll(all => !all)}>{isAll ? '바뀐 곳만 보기' : '같은 줄 모두 펼치기'}</Button>}
    </div>
    {isSame ? <p className="p-4 text-muted-foreground">바뀐 줄이 없습니다.</p>
      : <table className="w-full table-fixed border-collapse text-sm leading-[1.6]" aria-label={`${title} 변경`}>
        {isStacked
          ? <colgroup><col className={numberCol} /><col className={numberCol} /><col className="w-5" /><col /></colgroup>
          : <colgroup><col className={numberCol} /><col className="w-5" /><col /><col className={numberCol} /><col className="w-5" /><col /></colgroup>}
        <tbody>
          {diff.hunks.map((hunk, index) => <Fragment key={index}>
            {gap(hunk.hidden, `g${index}`)}
            {isStacked ? stackedRows(hunk.rows) : hunk.rows.map((row, at) => <tr key={at}>
              <Side side={row.left} kind={row.kind === 'change' ? 'removed' : 'same'} isLeft />
              <Side side={row.right} kind={row.kind === 'change' ? 'added' : 'same'} />
            </tr>)}
          </Fragment>)}
          {gap(diff.tail, 'tail')}
        </tbody>
      </table>}
  </div>;
}
