import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button, buttonVariants } from '@/shared/ui/button';
import { TriangleAlertIcon } from '@/shared/ui/icon';
import { Page } from '@/shared/ui/page';
import { PageState } from '@/shared/ui/page-state';
import { Spinner } from '@/shared/ui/spinner';
import { notificationQueries, useNotificationApi, useNotificationRead } from '../entities/notification';
import { useArchiveToggle } from './archive';
import { NotificationView } from './NotificationView';

/**
 * 알림 한 건의 자기 페이지. 휴대폰의 목록 행과 상세 칸의 "페이지로 열기", 공유한 주소가 연다. 휴대폰은 전체 화면(하단 탭 없음)이다.
 * 내용의 제목이 페이지의 h1이다(Page 앱 바 이름은 그때 h1이 아니다).
 */
export function NotificationPage({ id }: { id: string }) {
  const api = useNotificationApi();
  const navigate = useNavigate();
  const { markRead } = useNotificationRead();
  const query = useQuery(notificationQueries.all(api));
  const item = query.data?.find(each => each.id === id);
  useEffect(() => { if (item) markRead(item.id); }, [item, markRead]);
  const toggle = useArchiveToggle(() => void navigate({ href: item?.archived ? '/archive' : '/inbox', replace: true }));
  const crumbs = [{ label: '받은 알림', href: '/inbox' }];
  if (query.isPending) return <Page crumbs={[...crumbs, { label: '알림' }]} isFullScreen>
    <div className="flex flex-1 items-center justify-center"><Spinner aria-label="알림을 불러오는 중" className="size-6" /></div>
  </Page>;
  if (!item) {
    const isFailed = query.isError && !query.data;
    return <Page crumbs={[...crumbs, { label: isFailed ? '알림' : '없는 알림' }]} isFullScreen>
      <PageState kind={isFailed ? 'error' : 'not-found'} title={isFailed ? '알림을 불러오지 못했습니다' : '알림을 찾을 수 없습니다'}
        description={isFailed ? '잠시 후 다시 시도해 주세요.' : '지워졌거나 주소가 바뀌었을 수 있습니다.'}
        action={isFailed ? <Button variant="secondary" onClick={() => void query.refetch()}>다시 시도</Button>
          : <Link to={'/inbox' as string} className={buttonVariants({ variant: 'secondary', className: 'max-md:h-11' })}>받은 알림으로</Link>} />
    </Page>;
  }
  return <Page crumbs={[...(item.archived ? [{ label: '보관함', href: '/archive' }] : crumbs), { label: item.subject }]} isFullScreen
    below={toggle.isError ? <Alert variant="destructive" className="shrink-0 rounded-none border-x-0 border-t-0">
      <TriangleAlertIcon />
      <AlertTitle>알림을 옮기지 못했습니다</AlertTitle>
      <AlertDescription>잠시 후 다시 눌러 주세요.</AlertDescription>
    </Alert> : undefined}>
    <div className="flex flex-1 flex-col bg-background">
      <NotificationView item={item} isBusy={toggle.isPending} onToggleArchive={() => toggle.mutate(item)} />
    </div>
  </Page>;
}
