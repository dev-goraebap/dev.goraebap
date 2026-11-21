import type { CSSProperties, HTMLAttributes, MouseEvent, ReactNode } from 'react';
import type { DocumentLabel, DocumentRow } from '@/entities/document';
import { PALETTE } from '@/shared/ui/color-palette';
import { CalendarIcon } from '@/shared/ui/kit/icon';
import { LabelDot } from '@/shared/ui/label-dot/LabelDot';
import { MarkIcon } from '@/shared/ui/mark-picker';
import { PersonAvatar } from '@/shared/ui/person';

const PAPER_TONE = PALETTE.find(tone => tone.name === '갈색')!.value;

/** 문서 카드: 위쪽 종이 그림은 문서 자신의 표식(아이콘·색)으로 칠하고, 색이 없으면 첫 라벨 색을 쓴다. */
export function DocumentCard({
  document,
  labels,
  href,
  onOpen,
  grip,
  rowProps,
}: {
  document: DocumentRow;
  labels: DocumentLabel[];
  href: string;
  onOpen: () => void;
  grip?: ReactNode;
  rowProps: HTMLAttributes<HTMLDivElement> & { 'data-row': string; 'data-carried'?: boolean };
}) {
  const author = document.updatedByName ?? document.createdByName ?? '구성원';
  const tone = document.color ?? labels[0]?.color ?? PAPER_TONE;
  const open = (event: MouseEvent) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    onOpen();
  };
  return (
    <div {...rowProps}
      className="group/card relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border bg-card wrap-anywhere shadow-xs hover:border-ring/50 data-carried:border-dashed data-carried:border-ring/55 data-carried:bg-accent data-carried:*:invisible">
      {grip ? <div className="absolute top-2 left-2 z-2 overflow-hidden rounded-md bg-card opacity-65 transition-opacity group-focus-within/card:opacity-100 group-hover/card:opacity-100 [&>button]:rounded-[inherit]">{grip}</div> : null}
      {/* check-ui: allow-style 종이 색은 사용자가 고른 표식 · 라벨 색(데이터 값)이다. */}
      <div aria-hidden style={{ '--tone': tone } as CSSProperties}
        className="relative grid h-40 place-items-center overflow-hidden bg-[color-mix(in_srgb,var(--tone)_13%,var(--background))] text-[color-mix(in_srgb,var(--tone)_70%,var(--foreground))]">
        <div className="relative top-6.5 flex h-40 w-[72%] -rotate-4 flex-col gap-2 rounded-t-lg border border-background/90 bg-background/85 px-4 pt-5 pb-4">
          <MarkIcon name={document.icon ?? 'document'} className="size-7.5" />
          <p className="line-clamp-2 max-w-[90%] text-[0.7rem] leading-[1.6] font-semibold">{document.title}</p>
          <div className="flex flex-col gap-1.25 *:h-0.5 *:bg-current *:opacity-15 *:last:w-[65%]"><i /><i /><i /></div>
        </div>
      </div>
      <div className="flex min-h-42 flex-1 flex-col gap-2 p-4">
        <p className="flex min-h-4 min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          {labels[0] ? <LabelDot color={labels[0].color} /> : null}
          <span className="truncate">{labels.map(label => label.name).join(' · ')}</span>
        </p>
        <a href={href} onClick={open}
          className="line-clamp-2 font-semibold outline-none after:absolute after:inset-0 after:rounded-[inherit] focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring">
          {document.title}
        </a>
        <p className="line-clamp-2 text-sm text-muted-foreground">{document.excerpt || '아직 작성한 내용이 없습니다.'}</p>
        <div className="mt-auto flex min-w-0 items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
          <span className="flex max-w-[60%] min-w-0 items-center gap-1.5">
            <PersonAvatar id={document.updatedById ?? document.createdById ?? undefined} name={author} size={20} isStatic />
            <span className="truncate">{author}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 tabular-nums whitespace-nowrap">
            <CalendarIcon className="size-4 text-icon-muted" />
            {new Date(document.updatedAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  );
}
