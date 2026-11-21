import { cn } from 'cn';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/kit/table';
import { PersonAvatar } from '@/shared/ui/person';
import type { PushMember } from '../api/push';
import { formatPushMoment, PUSH_OPENS_ROW } from '../model/push-format';
import { PushStatusToken } from './PushStatusToken';

/**
 * Working members as a desktop table: the picture and name, how many devices take pushes, the latest push
 * and how it went, then the week's delivered, failed and no-device counts, the failures in red; a row opens the member.
 */
export function PushMembersTable({ rows, opened, onOpen }: { rows: PushMember[]; opened: PushMember | null; onOpen: (member: PushMember) => void }) {
  // The side panel takes half the centred box; below this width the list scrolls sideways instead of squeezing the names out.
  return <Table className="bg-background">
    <TableHeader>
      <TableRow>
        <TableHead className={cn('pl-4')}>구성원</TableHead>
        <TableHead className={cn('w-20')}>기기</TableHead>
        <TableHead className={cn('w-58')}>최근 알림</TableHead>
        <TableHead className={cn('w-20 text-right')}>전달</TableHead>
        <TableHead className={cn('w-20 text-right')}>실패</TableHead>
        <TableHead className={cn('w-24 pr-4 text-right')}>기기 없음</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.map(row => <TableRow key={row.id} data-state={opened?.id === row.id ? 'selected' : undefined}>
        <TableCell>
          <span className="flex min-w-0 items-center gap-2">
            <PersonAvatar id={row.id} name={row.name} size={20} isStatic />
            <button type="button" className={PUSH_OPENS_ROW} onClick={() => onOpen(row)}>{row.name}</button>
          </span>
        </TableCell>
        <TableCell className={row.devices > 0 ? undefined : 'text-muted-foreground'}>{row.devices > 0 ? `${row.devices}대` : '없음'}</TableCell>
        <TableCell>{row.lastPushAt
          ? <span className="flex items-center gap-2"><span className="tabular-nums">{formatPushMoment(row.lastPushAt)}</span><PushStatusToken status={row.lastStatus} /></span>
          : <span className="text-muted-foreground">-</span>}</TableCell>
        <TableCell className="text-right tabular-nums">{row.sent}</TableCell>
        <TableCell className={cn('text-right tabular-nums', row.failed > 0 && 'text-destructive')}>{row.failed}</TableCell>
        <TableCell className="text-right tabular-nums">{row.noDevice}</TableCell>
      </TableRow>)}
    </TableBody>
  </Table>;
}
