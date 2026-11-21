import type { NoticeKindRow } from '../api/push';

/** The kind's latest notice as it read, or a note that none has gone yet. */
export function NoticeKindExample({ row }: { row?: NoticeKindRow }) {
  if (!row?.exampleTitle) return <p className="text-sm text-muted-foreground">아직 보낸 적이 없습니다.</p>;
  return <div className="flex flex-col gap-0.5 border-l-2 border-input px-3 py-2">
    <p className="font-medium">{row.exampleTitle}</p>
    {row.exampleMessage ? <p className="line-clamp-2 text-sm text-muted-foreground">{row.exampleMessage}</p> : null}
  </div>;
}
