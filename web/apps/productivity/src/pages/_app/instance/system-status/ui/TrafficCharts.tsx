import type { Traffic } from '../api/system';
import type { ChartSeries } from '../model/chart-style';
import { bucketLabel, countText, durationText } from '../model/format';
import { ChartCard } from './ChartCard';
import { LinesChart } from './LinesChart';
import { StackedBarsChart } from './StackedBarsChart';

/**
 * The range in five charts: requests by how they ended (stacked), response time (average and slowest), what members did,
 * how many of them, and the errors the server logged.
 */
export function TrafficCharts({ traffic }: { traffic: Traffic }) {
  const hourly = traffic.range === 'DAY';
  const labels = traffic.buckets.map(bucket => bucketLabel(bucket.at, hourly));
  const of = (pick: (bucket: Traffic['buckets'][number]) => number | null) => traffic.buckets.map(pick);
  const requests: ChartSeries[] = [
    { key: 'ok', label: '성공', tone: 'blue', values: of(bucket => bucket.ok) },
    { key: 'refused', label: '거절됨(4xx)', tone: 'orange', values: of(bucket => bucket.clientErrors) },
    { key: 'failed', label: '서버 오류(5xx)', tone: 'red', values: of(bucket => bucket.serverErrors) },
  ];
  const timing: ChartSeries[] = [
    { key: 'avg', label: '평균', tone: 'blue', values: of(bucket => bucket.avgMs ?? null) },
    { key: 'max', label: '가장 느림', tone: 'yellow', values: of(bucket => (bucket.avgMs == null ? null : bucket.maxMs)) },
  ];
  const activity: ChartSeries[] = [{ key: 'activity', label: '활동', tone: 'green', values: of(bucket => bucket.activities) }];
  const members: ChartSeries[] = [{ key: 'members', label: '활동한 구성원', tone: 'blue', values: of(bucket => bucket.activeMembers) }];
  const errors: ChartSeries[] = [{ key: 'errors', label: '서버 오류 기록', tone: 'red', values: of(bucket => bucket.errors) }];
  const t = traffic.totals;
  return <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
    <ChartCard title="요청 수" total={`${countText(t.requests)}건`} series={requests}><StackedBarsChart labels={labels} series={requests} unit="건" /></ChartCard>
    <ChartCard title="응답 시간" total={`느린 요청(1초 이상) ${countText(t.slow)}건`} series={timing}>
      <LinesChart labels={labels} series={timing} format={value => durationText(Math.round(value))} />
    </ChartCard>
    <ChartCard title="구성원 활동" total={`${countText(t.activities)}건 · ${t.activeMembers}명`} series={activity}>
      <StackedBarsChart labels={labels} series={activity} unit="건" />
    </ChartCard>
    <ChartCard title={hourly ? '시간별 활동한 구성원' : '일별 활동한 구성원'} total={`${t.activeMembers}명`} series={members}>
      <StackedBarsChart labels={labels} series={members} unit="명" />
    </ChartCard>
    <ChartCard title="서버 오류 기록" total={`${countText(t.errors)}건`} series={errors}><StackedBarsChart labels={labels} series={errors} unit="건" /></ChartCard>
  </div>;
}
