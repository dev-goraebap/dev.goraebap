import { cn } from 'cn';
import { Progress } from '@goraebap/ui-react/compact/progress';
import type { SystemStatus } from '../api/system';
import { STATUS_SURFACE } from '../model/chart-style';
import { bytesText, countText, momentText, percentText, uptimeText } from '../model/format';

type Tile = { key: string; label: string; value: string; unit?: string; note?: string; meter?: number; alert?: boolean };

/**
 * The server now in eight tiles: how long it has run and which release, memory and processor use with a meter, the disk
 * left, the size of the business and log databases, and the log store with its latest weekly copy (red when the store
 * fails or the copy did).
 */
export function SystemStatusTiles({ status }: { status: SystemStatus }) {
  const { runtime, disk, logStore, lastBackup } = status;
  const heap = runtime.heapMax > 0 ? runtime.heapUsed / runtime.heapMax : undefined;
  const used = disk.total > 0 ? 1 - disk.free / disk.total : undefined;
  const tiles: Tile[] = [
    { key: 'uptime', label: '가동 시간', value: uptimeText(status.uptimeSeconds), note: `${status.version} · ${momentText(status.startedAt)} 시작` },
    { key: 'memory', label: '메모리', value: bytesText(runtime.heapUsed), unit: `/ ${bytesText(runtime.heapMax)}`, meter: heap },
    { key: 'cpu', label: '프로세서', value: percentText(runtime.processCpu), note: `서버 전체 ${percentText(runtime.systemCpu)} · 코어 ${runtime.processors}개`,
      meter: runtime.processCpu ?? undefined },
    { key: 'disk', label: '디스크 남은 공간', value: bytesText(disk.free), unit: `/ ${bytesText(disk.total)}`, meter: used,
      alert: used !== undefined && used > 0.9 },
    { key: 'db', label: '업무 DB', value: bytesText(status.businessDbBytes) },
    { key: 'logs', label: '로그 DB', value: bytesText(logStore.bytes), note: '30일 보관' },
    { key: 'store', label: '로그 저장', value: logStore.ok ? '정상' : '문제 있음', alert: !logStore.ok,
      note: logStore.lost > 0 ? `시작 후 못 남긴 기록 ${countText(logStore.lost)}건` : '빠진 기록 없음' },
    { key: 'backup', label: '주간 백업', value: lastBackup ? (lastBackup.error ? '실패' : momentText(lastBackup.at)) : '아직 없음', alert: !!lastBackup?.error,
      note: lastBackup?.error ?? (lastBackup?.bytes != null ? `${bytesText(lastBackup.bytes)} · 매주 일요일 새벽` : '매주 일요일 새벽') },
  ];
  return <dl className="m-0 grid grid-cols-4 gap-3 max-md:grid-cols-2">{tiles.map(tile => <div key={tile.key}
    className={cn(STATUS_SURFACE, 'flex flex-col gap-1', tile.alert && 'border-destructive/45')}>
    <dt className="text-sm text-muted-foreground">{tile.label}</dt>
    <dd className="m-0 flex min-w-0 flex-wrap items-baseline gap-x-1">
      <span className={cn('text-2xl leading-tight font-bold tabular-nums wrap-anywhere max-md:text-base', tile.alert && 'text-destructive')}>{tile.value}</span>
      {tile.unit ? <span className="text-sm whitespace-nowrap text-muted-foreground">{tile.unit}</span> : null}
    </dd>
    {tile.meter !== undefined ? <Progress aria-label={tile.label} value={Math.min(100, Math.round(tile.meter * 100))} max={100}
      className={cn(tile.meter > 0.85 && '[&_[data-slot=progress-indicator]]:bg-mark-high')} /> : null}
    {tile.note ? <p className="line-clamp-2 text-sm text-muted-foreground">{tile.note}</p> : null}
  </div>)}</dl>;
}
