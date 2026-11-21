import type { ReactNode } from 'react';
import { Facts } from '@/shared/ui/kit/side-panel';
import { ToneBadge } from '@/shared/ui/tone-badge';
import type { ActivityRow } from '../api/system';
import { activityOutcome, activityText, agentText, durationText, momentText, shortRoute } from '../model/format';

/**
 * Everything kept of an activity: a change's path values naming what was acted on, and the trace id that finds the same
 * request among the server errors; a screen opened, when it was first and last opened and how many times. Both, the
 * address and browser.
 */
export function ActivityFactsPanel({ row }: { row: ActivityRow }) {
  const who = row.employeeName ?? row.employeeId ?? '로그인 전';
  const outcome = activityOutcome(row);
  const facts: [string, ReactNode][] = row.kind === 'VISIT'
    ? [
      ['처음 연 시각', momentText(row.at)],
      ['마지막 연 시각', momentText(row.lastAt ?? row.at)],
      ['횟수', `${row.visits ?? 1}회 (마지막으로 연 뒤 30분 안에 다시 연 것을 묶음)`],
      ['구성원', who],
      ['화면', row.route],
    ]
    : [
      ['시각', momentText(row.at)],
      ['구성원', who],
      ['한 일', `${activityText(row).title} · ${row.method ?? ''} ${shortRoute(row.route)}`],
      ['대상', row.target ?? '-'],
      ['결과', <ToneBadge key="outcome" label={outcome.label} tone={outcome.color} />],
      ['걸린 시간', row.durationMs == null ? '-' : durationText(row.durationMs)],
    ];
  return <Facts facts={[...facts, ['IP', row.ip], ['브라우저', agentText(row.userAgent) ?? '-'], ['User-Agent', row.userAgent ?? '-'],
    ...(row.traceId ? [['추적 번호', row.traceId] as [string, ReactNode]] : [])]} />;
}
