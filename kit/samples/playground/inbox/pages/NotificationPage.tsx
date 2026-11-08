import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { Spinner } from '@astryxdesign/core/Spinner';
import { PageState } from '@kit/composites/state/PageState';
import { Page } from '@kit/layouts/page/Page';
import { PageBanner } from '@kit/layouts/page/PageParts';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { notificationQueries, useNotificationApi, useNotificationRead } from '../entities/notification';
import { useArchiveToggle } from './archive';
import { NotificationView } from './NotificationView';

/** 알림 한 건의 자기 페이지. 휴대폰의 목록 행과 상세 칸의 "페이지로 열기", 공유한 주소가 연다. */
export function NotificationPage({ id }: { id: string }) {
  const api = useNotificationApi();
  const navigate = useNavigate();
  const { markRead } = useNotificationRead();
  const query = useQuery(notificationQueries.all(api));
  const item = query.data?.find(each => each.id === id);
  useEffect(() => { if (item) markRead(item.id); }, [item, markRead]);
  const toggle = useArchiveToggle(() => void navigate({ href: item?.archived ? '/archive' : '/inbox', replace: true }));
  const crumbs = [{ label: '받은 알림', href: '/inbox' }];
  if (query.isPending) return <Page crumbs={[...crumbs, { label: '알림' }]} isDetail><Center height="100%"><Spinner label="알림을 불러오는 중" /></Center></Page>;
  if (!item) {
    const isFailed = query.isError && !query.data;
    return <Page crumbs={[...crumbs, { label: isFailed ? '알림' : '없는 알림' }]} isDetail>
      <PageState kind={isFailed ? 'error' : 'not-found'} title={isFailed ? '알림을 불러오지 못했습니다' : '알림을 찾을 수 없습니다'}
        description={isFailed ? '잠시 후 다시 시도해 주세요.' : '지워졌거나 주소가 바뀌었을 수 있습니다.'}
        action={isFailed ? <Button label="다시 시도" variant="secondary" onClick={() => void query.refetch()} /> : <Button label="받은 알림으로" variant="secondary" href="/inbox" />} />
    </Page>;
  }
  return <Page crumbs={[...(item.archived ? [{ label: '보관함', href: '/archive' }] : crumbs), { label: item.subject }]} isDetail hasHeading={false}>
    {toggle.isError ? <PageBanner status="error" title="알림을 옮기지 못했습니다" description="잠시 후 다시 눌러 주세요." /> : null}
    <NotificationView item={item} isBusy={toggle.isPending} onToggleArchive={() => toggle.mutate(item)} />
  </Page>;
}
