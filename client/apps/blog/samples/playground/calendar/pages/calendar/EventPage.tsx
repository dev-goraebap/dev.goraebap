import { Button } from '@/shared/ui/kit/button';
import { CalendarIcon, ClockIcon, MapPinIcon, PencilIcon, Trash2Icon } from '@/shared/ui/kit/icon';
import { DetailSurface } from '@/shared/ui/kit/detail-surface';
import { InfoPill } from '@/shared/ui/kit/info-pill';
import { PageState } from '@/shared/ui/kit/page-state';
import { DetailLayout } from '@/shared/ui/kit/reading';
import { Spinner } from '@/shared/ui/kit/spinner';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { dayText, eventQueries, useEventApi, type CalendarEvent } from '../../entities/event';

const crumbsOf = (event?: CalendarEvent) => [{ label: '일정', href: '/calendar', icon: CalendarIcon }, { label: event?.title ?? '일정' }];

/**
 * 일정 하나의 상세. 격자 위 대화상자(surface="dialog")와 자기 페이지(surface="page")가 같은 조회 · 같은 본문을 쓴다.
 * 동작(수정 · 지우기)은 머리 줄 오른쪽 한 곳에 둔다.
 */
export function EventDetail({ id, surface, onEdit, onDelete, onClose, onExpand }: {
  id: string; surface: 'dialog' | 'page'; onEdit: () => void; onDelete?: (event: CalendarEvent) => void; onClose?: () => void; onExpand?: () => void;
}) {
  const query = useQuery(eventQueries.all(useEventApi()));
  const event = query.data?.find(each => each.id === id);
  const actions = event ? <>
    {onDelete ? <Button variant="tool" size="icon" aria-label="지우기" title="지우기" onClick={() => onDelete(event)}><Trash2Icon /></Button> : null}
    <Button variant="tool" size="icon" aria-label="수정" title="수정" onClick={onEdit}><PencilIcon /></Button>
  </> : undefined;
  return (
    <DetailSurface surface={surface} title="일정" crumbs={crumbsOf(event)} actions={actions} onClose={onClose} onExpand={onExpand}>
      {query.isPending
        ? <div className="flex flex-1 items-center justify-center bg-background"><Spinner aria-label="일정을 불러오는 중" className="size-6" /></div>
        : !event
          ? <div className="flex flex-1 flex-col bg-background"><PageState kind={query.isError ? 'error' : 'not-found'} isCompact={surface === 'dialog'} title="일정을 열 수 없습니다" /></div>
          : (
            <DetailLayout label={event.title} title={event.title}
              sections={[{ title: '일정', items: <>
                <InfoPill label="시작일" icon={<CalendarIcon />}>{dayText(event.start)}</InfoPill>
                <InfoPill label="종료일" icon={<CalendarIcon />}>{dayText(event.end)}</InfoPill>
                <InfoPill label="시각" icon={<ClockIcon />}>{event.time ?? '종일'}</InfoPill>
              </> }]}>
              {event.place ? <p className="flex items-center gap-2"><MapPinIcon className="text-icon-muted" />{event.place}</p> : null}
            </DetailLayout>
          )}
    </DetailSurface>
  );
}

/** 일정의 자기 페이지(/calendar/events/{id}): 휴대폰 · 새로고침 · 직접 링크 · 대화상자의 "페이지로 열기"가 여기로 온다. */
export function EventPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  return <EventDetail id={id} surface="page" onEdit={() => void navigate({ href: `/calendar/events/${id}/edit` })} />;
}
