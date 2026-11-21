import { cn } from 'cn';
import { SettingsSection } from '@/shared/ui/kit/settings';
import type { RouteRow } from '../api/system';
import { areaOf, countText, durationText, shortRoute } from '../model/format';

/**
 * A short list of API mappings, each the part of cowork it belongs to over its method and path, and at its end either how
 * often it was called or how long it took (average, slowest), with any server failures in red.
 */
export function ApiRouteList({ title, rows, measure }: { title: string; rows: RouteRow[]; measure: 'count' | 'time' }) {
  if (rows.length === 0) return <SettingsSection title={title}>
    <p className="p-4 text-sm text-muted-foreground">이 기간에 요청이 없습니다.</p>
  </SettingsSection>;
  return <SettingsSection title={title}>
    {rows.map(row => <div key={`${row.method} ${row.route}`} className="flex min-h-11 items-center gap-3 px-3 py-2">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{areaOf(row.route)}</span>
        <span className="font-mono text-xs wrap-anywhere text-muted-foreground">{`${row.method} ${shortRoute(row.route)}`}</span>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <span className="tabular-nums">{measure === 'count' ? `${countText(row.requests)}건` : `평균 ${durationText(row.avgMs)}`}</span>
        <span className={cn('text-xs tabular-nums', row.serverErrors > 0 ? 'text-destructive' : 'text-muted-foreground')}>
          {measure === 'count' ? `평균 ${durationText(row.avgMs)}` : `가장 느림 ${durationText(row.maxMs)}`}
          {row.serverErrors > 0 ? ` · 서버 오류 ${row.serverErrors}건` : ''}
        </span>
      </div>
    </div>)}
  </SettingsSection>;
}
