import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { ListItem } from '@astryxdesign/core/List';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { PageState } from '@kit/composites/state/PageState';
import { icon } from '@kit/foundations/icons/solar-icon';
import { Page } from '@kit/layouts/page/Page';
import { PageList } from '@kit/layouts/page/PageParts';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { customerQueries, useCustomerApi } from '../../entities/customer';

/** 가져오기가 시작되고 끝나는 곳: 고객 목록. 가져오기는 머리 줄의 만들기 자리에 둔다. */
export function CustomersPage() {
  const api = useCustomerApi();
  const navigate = useNavigate();
  const query = useQuery(customerQueries.all(api));
  const start = () => void navigate({ href: '/import' });
  const content = () => {
    if (query.isPending) return <Center height="100%"><Spinner label="고객을 불러오는 중" /></Center>;
    if (query.isError && !query.data) return <PageState kind="error" title="고객을 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
      action={<Button label="다시 시도" variant="secondary" onClick={() => void query.refetch()} />} />;
    if (!query.data.length) return <PageState kind="empty" title="아직 고객이 없습니다" description="CSV 파일로 한 번에 가져올 수 있습니다."
      action={<Button label="고객 가져오기" variant="secondary" icon={icon('upload')} onClick={start} />} />;
    return <PageList hasDividers aria-label="고객">
      {query.data.map(customer => <ListItem key={customer.id} label={<Text weight="medium" maxLines={1}>{customer.name}</Text>}
        description={<Text type="supporting" color="secondary" maxLines={1}>{customer.email}</Text>}
        endContent={customer.tier ? <Token label={customer.tier} size="sm" /> : undefined} />)}
    </PageList>;
  };
  return <Page crumbs={[{ label: '고객', icon: 'people' }]} create={{ label: '고객 가져오기', onClick: start }}>{content()}</Page>;
}
