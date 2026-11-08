import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { HStack } from '@astryxdesign/core/HStack';
import { ListItem } from '@astryxdesign/core/List';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { useFilters } from '@kit/composites/filter/use-filters';
import type { ListFilter } from '@kit/composites/filter/types';
import { PageState } from '@kit/composites/state/PageState';
import { icon } from '@kit/foundations/icons/solar-icon';
import { useIsPhone } from '@kit/foundations/media';
import { Page } from '@kit/layouts/page/Page';
import { PageList } from '@kit/layouts/page/PageParts';
import { useAddressFilters } from '@kit/patterns/list/list-address';
import { useQuery } from '@tanstack/react-query';
import { approvalQueries, currentOf, dayText, resultLabel, resultOf, titleOf, me, useApprovalApi } from '../../entities/approval';
import { ResultMark } from '../../entities/approval/ui';

const filters: ListFilter[] = [
  { key: 'result', label: '결과', icon: 'clock', isMultiple: true, options: Object.entries(resultLabel).map(([value, label]) => ({ value, label })) },
];

/**
 * 내 신청: 내가 낸 신청을 최신 순으로. 행에는 지금 누가 결재할 차례인지 보인다. 결과로 거르는 필터만 있고 주소가 가진다.
 * 상태 순서: 대기 → 실패 → 조건이 있는 0건 → 0건(휴가 신청). 휴가 신청은 단계형이라 자기 페이지로 간다.
 */
export function RequestsPage({ onCreate }: { onCreate: () => void }) {
  const api = useApprovalApi();
  const isPhone = useIsPhone();
  const [state, setState] = useAddressFilters(filters);
  const list = useFilters(filters, { state, onStateChange: setState });
  const query = useQuery(approvalQueries.all(api));
  const mine = (query.data ?? []).filter(each => each.applicant === me).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const items = mine.filter(each => !state.result?.length || state.result.includes(resultOf(each)));
  const content = () => {
    if (query.isPending) return <Center height="100%"><Spinner label="신청을 불러오는 중" /></Center>;
    if (query.isError && !query.data) return <PageState kind="error" title="신청을 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
      action={<Button label="다시 시도" variant="secondary" onClick={() => void query.refetch()} />} />;
    if (items.length === 0 && list.count > 0) return <PageState kind="search" title="조건에 맞는 신청이 없습니다" description="결과 필터를 바꿔 보세요."
      action={<Button label="조건 지우기" variant="secondary" onClick={list.clear} />} />;
    if (items.length === 0) return <PageState kind="empty" title="낸 신청이 없습니다" description="휴가가 필요하면 결재선을 정해 신청합니다."
      action={<Button label="휴가 신청" variant="secondary" icon={icon('plus')} onClick={onCreate} />} />;
    return <PageList hasDividers aria-label="내 신청">
      {items.map(approval => {
        const current = currentOf(approval);
        return <ListItem key={approval.id} href={`/requests/${approval.id}`}
          label={<Text weight="medium" maxLines={1}>{titleOf(approval)}</Text>}
          description={isPhone ? undefined : <Text color="secondary" maxLines={1}>{current ? `${current.approver} ${current.role}님이 결재할 차례입니다` : approval.reason}</Text>}
          startContent={<Text type="supporting" color="secondary" hasTabularNumbers>{approval.id}</Text>}
          endContent={<HStack gap={3} vAlign="center">
            <ResultMark approval={approval} />
            {isPhone ? null : <Text type="supporting" color="secondary" hasTabularNumbers textWrap="nowrap">{dayText(approval.createdAt)} 신청</Text>}
          </HStack>} />;
      })}
    </PageList>;
  };
  return <Page crumbs={[{ label: '결재', icon: 'document' }, { label: '내 신청' }]} tools={list.tools} applied={list.applied}
    create={{ label: '휴가 신청', onClick: onCreate }}>
    {content()}
  </Page>;
}
