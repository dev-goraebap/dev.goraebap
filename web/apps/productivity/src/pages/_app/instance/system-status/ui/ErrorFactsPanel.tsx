import { useQuery } from '@tanstack/react-query';
import { Facts } from '@/shared/ui/kit/side-panel';
import { errorOptions, type ErrorRow } from '../api/system';
import { momentText } from '../model/format';

/** An error's facts: when it began and was last seen, how often, the request (or the job's logger), the trace id, its stack. */
export function ErrorFactsPanel({ row }: { row: ErrorRow }) {
  const detail = useQuery(errorOptions(row.id));
  const error = detail.data?.error ?? row;
  return <div className="flex flex-col gap-4">
    <p className="font-semibold wrap-anywhere">{error.message}</p>
    <Facts facts={[
      ['처음', momentText(error.firstAt)],
      ['마지막', momentText(error.lastAt)],
      ['횟수', `${error.occurrences}번`],
      ['요청', error.method && error.path ? `${error.method} ${error.path}` : '요청 밖(예약 작업 등)'],
      ['구성원', error.employeeName ?? (error.employeeId ? '알 수 없는 구성원' : '-')],
      ['IP', error.ip ?? '-'],
      ['로거', error.logger],
      ['예외', error.exception ?? '-'],
      ['추적 번호', error.traceId ?? '-'],
    ]} />
    <section className="flex flex-col gap-2" aria-label="스택">
      <h3 className="text-sm font-medium text-muted-foreground">스택</h3>
      {detail.isPending ? <p className="text-sm text-muted-foreground">불러오는 중…</p>
        : detail.data?.stack ? <pre className="m-0 max-h-96 overflow-auto rounded-xl border bg-card p-3 font-mono text-xs leading-normal whitespace-pre">{detail.data.stack}</pre>
          : <p className="text-sm text-muted-foreground">예외 없이 남긴 기록입니다.</p>}
    </section>
  </div>;
}
