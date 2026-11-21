import { cn } from 'cn';
import { stampText } from '@/shared/lib/date-stamp';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/kit/table';
import { ToneBadge } from '@/shared/ui/tone-badge';
import type { ActivityRow } from '../api/system';
import { activityOutcome, activityText, agentText, durationText } from '../model/format';

const OPENS_ROW = 'min-w-0 truncate text-left outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring';
const whoOf = (row: ActivityRow) => row.employeeName ?? (row.employeeId ? '알 수 없는 구성원' : '로그인 전');

/** The activities as a desktop table: what, when, who, how it ended, how long, from where; a row opens its detail. */
export function ActivityTable({ rows, opened, onOpen }: { rows: ActivityRow[]; opened: ActivityRow | null; onOpen: (row: ActivityRow) => void }) {
  // The side panel takes half the centred box; below this width the list scrolls sideways instead of squeezing 한 일 out.
  return <Table className="bg-background">
    <TableHeader>
      <TableRow>
        <TableHead className={cn('pl-4')}>한 일</TableHead>
        <TableHead className={cn('w-44')}>시각</TableHead>
        <TableHead className={cn('w-40')}>구성원</TableHead>
        <TableHead className={cn('w-30')}>결과</TableHead>
        <TableHead className={cn('w-24')}>걸린 시간</TableHead>
        <TableHead className={cn('w-46 pr-4')}>접속</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.map(row => {
        const text = activityText(row);
        const outcome = activityOutcome(row);
        return <TableRow key={`${row.kind}-${row.id}`} data-state={opened?.id === row.id && opened.kind === row.kind ? 'selected' : undefined}>
          <TableCell>
            <span className="flex min-w-0 flex-col">
              <button type="button" className={OPENS_ROW} onClick={() => onOpen(row)}>{text.title}</button>
              <span className={cn('truncate text-xs text-muted-foreground', row.kind === 'CHANGE' && 'font-mono')}>{text.detail}</span>
            </span>
          </TableCell>
          <TableCell className="tabular-nums">{stampText(row.at)}</TableCell>
          <TableCell>
            <span className="block truncate">{whoOf(row)}</span>
          </TableCell>
          <TableCell><ToneBadge label={outcome.label} tone={outcome.color} /></TableCell>
          <TableCell className="tabular-nums">{row.durationMs == null ? '-' : durationText(row.durationMs)}</TableCell>
          <TableCell>
            <span className="flex min-w-0 flex-col">
              <span className="truncate tabular-nums">{row.ip}</span>
              <span className="truncate text-xs text-muted-foreground">{agentText(row.userAgent) ?? '-'}</span>
            </span>
          </TableCell>
        </TableRow>;
      })}
    </TableBody>
  </Table>;
}
