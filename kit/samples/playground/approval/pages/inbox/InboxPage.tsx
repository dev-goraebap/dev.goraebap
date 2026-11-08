import { PersonAvatar as Avatar } from '@kit/foundations/avatar/PersonAvatar';
import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { ListItem } from '@astryxdesign/core/List';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { PageState } from '@kit/composites/state/PageState';
import { useIsPhone } from '@kit/foundations/media';
import { Page } from '@kit/layouts/page/Page';
import { PageList } from '@kit/layouts/page/PageParts';
import { useQuery } from '@tanstack/react-query';
import { approvalQueries, currentOf, dayText, me, rangeText, titleOf, useApprovalApi } from '../../entities/approval';

/**
 * 결재할 문서: 지금 내 차례인 신청만 오래된 것부터. 결정하면 목록에서 빠진다. 행을 누르면 신청 상세가 열리고 거기서 승인·반려한다.
 */
export function InboxPage() {
  const api = useApprovalApi();
  const isPhone = useIsPhone();
  const query = useQuery(approvalQueries.all(api));
  const items = (query.data ?? []).filter(each => each.applicant !== me && currentOf(each)?.approver === me).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const content = () => {
    if (query.isPending) return <Center height="100%"><Spinner label="결재할 문서를 불러오는 중" /></Center>;
    if (query.isError && !query.data) return <PageState kind="error" title="결재할 문서를 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
      action={<Button label="다시 시도" variant="secondary" onClick={() => void query.refetch()} />} />;
    if (items.length === 0) return <PageState kind="empty" title="결재할 문서가 없습니다" description="내 차례가 된 신청이 생기면 여기에 나타납니다." />;
    return <PageList hasDividers aria-label="결재할 문서">
      {items.map(approval => <ListItem key={approval.id} href={`/requests/${approval.id}`}
        label={<Text weight="medium" maxLines={1}>{`${approval.applicant}님의 ${titleOf(approval)}`}</Text>}
        description={isPhone ? undefined : <Text color="secondary" maxLines={1}>{approval.reason}</Text>}
        startContent={<Avatar name={approval.applicant} size="sm" shape="circle" />}
        endContent={<Text type="supporting" color="secondary" hasTabularNumbers textWrap="nowrap">{isPhone ? rangeText(approval.start, approval.end) : `${dayText(approval.createdAt)} 신청`}</Text>} />)}
    </PageList>;
  };
  return <Page crumbs={[{ label: '결재', icon: 'document' }, { label: '결재할 문서' }]}>{content()}</Page>;
}
