import { useIsMobile } from '@/shared/lib/use-mobile';
import { Button } from '@/shared/ui/button';
import { FileTextIcon } from '@/shared/ui/icon';
import { Page } from '@/shared/ui/page';
import { PageState } from '@/shared/ui/page-state';
import { PersonAvatar } from '@/shared/ui/person-avatar';
import { RowLink } from '@/shared/ui/row-link';
import { Spinner } from '@/shared/ui/spinner';
import { useQuery } from '@tanstack/react-query';
import { approvalQueries, currentOf, dayText, me, rangeText, titleOf, useApprovalApi } from '../../entities/approval';

/**
 * 결재할 문서: 지금 내 차례인 신청만 오래된 것부터. 결정하면 목록에서 빠진다. 행을 누르면 신청 상세가 열리고 거기서 승인·반려한다.
 */
export function InboxPage() {
  const api = useApprovalApi();
  const isMobile = useIsMobile();
  const query = useQuery(approvalQueries.all(api));
  const items = (query.data ?? []).filter(each => each.applicant !== me && currentOf(each)?.approver === me).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const content = () => {
    if (query.isPending) return <div className="flex flex-1 items-center justify-center"><Spinner aria-label="결재할 문서를 불러오는 중" className="size-6" /></div>;
    if (query.isError && !query.data) return <PageState kind="error" title="결재할 문서를 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
      action={<Button variant="secondary" onClick={() => void query.refetch()}>다시 시도</Button>} />;
    if (items.length === 0) return <PageState kind="empty" title="결재할 문서가 없습니다" description="내 차례가 된 신청이 생기면 여기에 나타납니다." />;
    return (
      <ul aria-label="결재할 문서" className="flex flex-col">
        {items.map(approval => (
          <li key={approval.id} className="relative flex min-h-14 items-center gap-3 border-b bg-background px-4 py-2.5 hover:bg-row-hover">
            <PersonAvatar name={approval.applicant} className="size-8" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <RowLink to={`/requests/${approval.id}` as string} className="truncate font-medium">{`${approval.applicant}님의 ${titleOf(approval)}`}</RowLink>
              {isMobile ? null : <span className="truncate text-sm text-muted-foreground">{approval.reason}</span>}
            </span>
            <span className="shrink-0 text-sm whitespace-nowrap text-muted-foreground tabular-nums">
              {isMobile ? rangeText(approval.start, approval.end) : `${dayText(approval.createdAt)} 신청`}
            </span>
          </li>
        ))}
      </ul>
    );
  };
  return <Page crumbs={[{ label: '결재', icon: FileTextIcon }, { label: '결재할 문서' }]}>{content()}</Page>;
}
