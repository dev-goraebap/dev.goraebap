import { useAddressFilters } from '@/shared/lib/list-address';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { Button } from '@/shared/ui/button';
import { FilterBar, FilterChips, FilterMenu, useFilters, type FilterDef } from '@/shared/ui/filter';
import { ClockIcon, FileTextIcon, PlusIcon } from '@/shared/ui/icon';
import { Page } from '@/shared/ui/page';
import { PageState } from '@/shared/ui/page-state';
import { RowLink } from '@/shared/ui/row-link';
import { Spinner } from '@/shared/ui/spinner';
import { useQuery } from '@tanstack/react-query';
import { approvalQueries, currentOf, dayText, me, ResultMark, resultLabel, resultOf, titleOf, useApprovalApi } from '../../entities/approval';

const FILTERS: FilterDef<'result'>[] = [
  { key: 'result', label: '결과', icon: ClockIcon, options: Object.entries(resultLabel).map(([value, label]) => ({ value, label })) },
];
const KEYS = FILTERS.map(each => each.key);

/**
 * 내 신청: 내가 낸 신청을 최신 순으로. 행에는 지금 누가 결재할 차례인지 보인다. 결과로 거르는 필터만 있고 주소가 가진다(?result=).
 * 상태 순서: 대기 → 실패 → 조건이 있는 0건 → 0건(휴가 신청). 휴가 신청은 단계형이라 자기 페이지로 간다.
 */
export function RequestsPage({ onCreate }: { onCreate: () => void }) {
  const api = useApprovalApi();
  const isMobile = useIsMobile();
  const [state, setState] = useAddressFilters(KEYS);
  const filters = useFilters(FILTERS, { state, onStateChange: setState });
  const query = useQuery(approvalQueries.all(api));
  const mine = (query.data ?? []).filter(each => each.applicant === me).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const items = mine.filter(each => !state.result?.length || state.result.includes(resultOf(each)));
  const content = () => {
    if (query.isPending) return <div className="flex flex-1 items-center justify-center"><Spinner aria-label="신청을 불러오는 중" className="size-6" /></div>;
    if (query.isError && !query.data) return <PageState kind="error" title="신청을 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
      action={<Button variant="secondary" onClick={() => void query.refetch()}>다시 시도</Button>} />;
    if (items.length === 0 && filters.active.length > 0) return <PageState kind="search" title="조건에 맞는 신청이 없습니다" description="결과 필터를 바꿔 보세요."
      action={<Button variant="secondary" onClick={filters.clear}>조건 지우기</Button>} />;
    if (items.length === 0) return <PageState kind="empty" title="낸 신청이 없습니다" description="휴가가 필요하면 결재선을 정해 신청합니다."
      action={<Button variant="secondary" onClick={onCreate}><PlusIcon data-icon="inline-start" />휴가 신청</Button>} />;
    return (
      <ul aria-label="내 신청" className="flex flex-col">
        {items.map(approval => {
          const current = currentOf(approval);
          return (
            <li key={approval.id} className="relative flex min-h-12 items-center gap-3 border-b bg-background px-4 py-2.5 hover:bg-row-hover">
              <span className="w-10 shrink-0 text-sm text-muted-foreground tabular-nums">{approval.id}</span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5 md:flex-row md:items-baseline md:gap-3">
                <RowLink to={`/requests/${approval.id}` as string} className="shrink-0 truncate font-medium">{titleOf(approval)}</RowLink>
                {isMobile ? null : (
                  <span className="min-w-0 truncate text-sm text-muted-foreground">
                    {current ? `${current.approver} ${current.role}님이 결재할 차례입니다` : approval.reason}
                  </span>
                )}
              </span>
              <ResultMark approval={approval} />
              {isMobile ? null : <span className="shrink-0 text-sm whitespace-nowrap text-muted-foreground tabular-nums">{dayText(approval.createdAt)} 신청</span>}
            </li>
          );
        })}
      </ul>
    );
  };
  return (
    <Page crumbs={[{ label: '결재', icon: FileTextIcon }, { label: '내 신청' }]} tools={<FilterMenu filters={filters} />}
      below={isMobile ? <FilterChips filters={filters} /> : <FilterBar filters={filters} />} create={{ label: '휴가 신청', onClick: onCreate }}>
      {content()}
    </Page>
  );
}
