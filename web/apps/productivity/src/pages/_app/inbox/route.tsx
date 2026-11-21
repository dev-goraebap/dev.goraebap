import { createFileRoute, useParams } from '@tanstack/react-router';
import { notificationsOptions, unreadNotificationsOptions } from '@/entities/notification';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { NotificationsPage } from './ui/NotificationsPage';

/**
 * /inbox와 /inbox/{id}: 목록과 옆 칸(상세)이 한 페이지다. 하위 주소($id)는 그릴 것이 없어 이 페이지가 그대로 남고, 주소의 id만
 * 새로 읽는다. 그래서 상세를 열고 닫아도 목록의 자리 · 거르기가 남는다.
 */
export const Route = createFileRoute('/_app/inbox')({
  loader: ({ context }) => Promise.all([
    context.queryClient.infiniteQuery(notificationsOptions({})).catch(() => undefined),
    context.queryClient.query(unreadNotificationsOptions()).catch(() => undefined),
  ]),
  component: InboxRoute,
});

function InboxRoute() {
  const { id } = useParams({ strict: false }) as { id?: string };
  return <NotificationsPage crumbs={useCrumbs()} id={id} />;
}
