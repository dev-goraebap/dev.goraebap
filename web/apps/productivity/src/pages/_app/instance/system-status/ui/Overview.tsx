import { useQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import { Button } from '@goraebap/ui-react/compact/button';
import { PageState } from '@/shared/ui/kit/page-state';
import { isLogUnavailable, statusOptions, trafficOptions, type TrafficRange } from '../api/system';
import { countText } from '../model/format';
import { ApiRouteList } from './ApiRouteList';
import { LogStoreNotice } from './LogStoreNotice';
import { SystemStatusTiles } from './SystemStatusTiles';
import { TrafficCharts } from './TrafficCharts';

/**
 * 개요: the server now (always shown, as it does not need the log store), then the chosen range (24 hours by hour, or 7 or
 * 30 days by day) in figures, charts and the busiest and slowest APIs. While the log store fails, the charts give way
 * to a notice saying so.
 */
export function Overview({ range }: { range: TrafficRange }) {
  const status = useQuery(statusOptions());
  const traffic = useQuery(trafficOptions(range));
  const storeDown = status.data ? !status.data.logStore.ok : isLogUnavailable(traffic.error);
  const usage = () => {
    if (isLogUnavailable(traffic.error) && !traffic.data) return <p className="text-sm text-muted-foreground">로그 저장소가 돌아오면 다시 보입니다.</p>;
    if (traffic.isError && !traffic.data) return <PageState kind="error" title="이용 현황을 불러오지 못했습니다" description={traffic.error.message} isCompact
      action={<Button variant="secondary" onClick={() => void traffic.refetch()}>다시 시도</Button>} />;
    if (!traffic.data) return null;
    const t = traffic.data.totals;
    const totals = [
      { label: '요청', value: `${countText(t.requests)}건` },
      { label: '서버 오류(5xx)', value: `${countText(t.serverErrors)}건`, alert: t.serverErrors > 0 },
      { label: '느린 요청', value: `${countText(t.slow)}건` },
      { label: '활동', value: `${countText(t.activities)}건` },
      { label: '활동한 구성원', value: `${t.activeMembers}명` },
    ];
    return <>
      <dl className="m-0 flex flex-wrap gap-x-4 gap-y-1">
        {totals.map(total => <div key={total.label} className="flex items-baseline gap-1">
          <dt className="text-sm text-muted-foreground">{total.label}</dt>
          <dd className={cn('m-0 font-semibold tabular-nums', total.alert && 'text-destructive')}>{total.value}</dd>
        </div>)}
      </dl>
      <TrafficCharts traffic={traffic.data} />
      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        <ApiRouteList title="가장 많이 부른 API" rows={traffic.data.busiest} measure="count" />
        <ApiRouteList title="가장 느린 API" rows={traffic.data.slowest} measure="time" />
      </div>
    </>;
  };
  return <div className="flex min-w-0 flex-col gap-6 p-6 max-md:p-4">
    {storeDown ? <LogStoreNotice since={status.data?.logStore.failingSince} /> : null}
    {status.isError && !status.data
      ? <PageState kind="error" title="서버 상태를 불러오지 못했습니다" description={status.error.message} isCompact
        action={<Button variant="secondary" onClick={() => void status.refetch()}>다시 시도</Button>} />
      : status.data ? <SystemStatusTiles status={status.data} /> : null}
    <section className="flex flex-col gap-4" aria-label="이용 현황">
      <h2 className="text-sm font-medium text-muted-foreground">이용 현황</h2>
      {usage()}
    </section>
  </div>;
}
