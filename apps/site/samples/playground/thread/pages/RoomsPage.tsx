import { Button } from '@/shared/ui/button';
import { MailIcon } from '@/shared/ui/icon';
import { Page } from '@/shared/ui/page';
import { PageState } from '@/shared/ui/page-state';
import { RowLink } from '@/shared/ui/row-link';
import { Spinner } from '@/shared/ui/spinner';
import { useQuery } from '@tanstack/react-query';
import { threadQueries, useThreadApi } from '../entities/thread';

/** 대화방 목록. 휴대폰은 대화방이 전체 화면이라 여기서 고르고, 데스크톱도 같은 목록을 메뉴와 나란히 쓴다. */
export function RoomsPage() {
  const api = useThreadApi();
  const query = useQuery(threadQueries.rooms(api));
  const content = () => {
    if (query.isPending) return <div className="flex flex-1 items-center justify-center"><Spinner aria-label="대화방을 불러오는 중" className="size-6" /></div>;
    if (query.isError) return <PageState kind="error" title="대화방을 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
      action={<Button variant="secondary" onClick={() => void query.refetch()}>다시 시도</Button>} />;
    if (query.data.length === 0) return <PageState kind="empty" title="대화방이 없습니다" description="초대받으면 여기에 모입니다." />;
    return (
      <ul aria-label="대화방" className="flex flex-col">
        {query.data.map(room => (
          <li key={room.id} className="relative flex min-h-14 items-center gap-3 border-b bg-background px-4 py-2.5 hover:bg-row-hover">
            <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-icon-muted"><MailIcon /></span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <RowLink to={`/rooms/${room.id}` as string} className="truncate font-medium">{room.name}</RowLink>
              <span className="truncate text-sm text-muted-foreground">{room.members.join(', ')}</span>
            </span>
            <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{room.members.length}명</span>
          </li>
        ))}
      </ul>
    );
  };
  return <Page crumbs={[{ label: '대화', icon: MailIcon }]}>{content()}</Page>;
}
