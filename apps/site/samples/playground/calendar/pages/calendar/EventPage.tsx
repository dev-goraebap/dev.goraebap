import { useIsMobile } from '@/shared/lib/use-mobile';
import { Button } from '@/shared/ui/button';
import { CalendarIcon, ClockIcon, MapPinIcon, PencilIcon } from '@/shared/ui/icon';
import { InfoPill } from '@/shared/ui/info-pill';
import { Page } from '@/shared/ui/page';
import { PageState } from '@/shared/ui/page-state';
import { DetailLayout } from '@/shared/ui/reading';
import { Spinner } from '@/shared/ui/spinner';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { dayText, eventQueries, useEventApi, whenText } from '../../entities/event';
import { EventDot } from './EventParts';

/** 일정의 자기 페이지(/calendar/events/{id}): 링크 · 새로고침 · 팝오버의 "페이지로 열기"가 여기로 온다. 수정은 작성 페이지로 간다. */
export function EventPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const query = useQuery(eventQueries.all(useEventApi()));
  const event = query.data?.find(each => each.id === id);
  const edit = (
    <Button variant="secondary" size={isMobile ? 'icon' : 'default'} aria-label={isMobile ? '수정' : undefined} className="max-md:size-11"
      onClick={() => void navigate({ href: `/calendar/events/${id}/edit` })}>
      <PencilIcon data-icon={isMobile ? undefined : 'inline-start'} />{isMobile ? null : '수정'}
    </Button>
  );
  return (
    <Page crumbs={[{ label: '일정', href: '/calendar', icon: CalendarIcon }, { label: event?.title ?? '일정' }]} isFullScreen actions={event ? edit : undefined}>
      {query.isPending
        ? <div className="flex flex-1 items-center justify-center bg-background"><Spinner aria-label="일정을 불러오는 중" className="size-6" /></div>
        : !event
          ? <div className="flex flex-1 flex-col bg-background"><PageState kind={query.isError ? 'error' : 'not-found'} title="일정을 열 수 없습니다" /></div>
          : (
            <DetailLayout label={event.title} title={event.title}
              head={<p className="flex items-center gap-2 text-sm text-muted-foreground tabular-nums"><EventDot event={event} />{whenText(event)}</p>}
              sections={[{ title: '일정', items: <>
                <InfoPill label="시작일" icon={<CalendarIcon />}>{dayText(event.start)}</InfoPill>
                <InfoPill label="종료일" icon={<CalendarIcon />}>{dayText(event.end)}</InfoPill>
                <InfoPill label="시각" icon={<ClockIcon />}>{event.time ?? '종일'}</InfoPill>
              </> }]}>
              <p className="flex items-center gap-2"><MapPinIcon className="text-icon-muted" />{event.place || '정한 장소가 없습니다.'}</p>
            </DetailLayout>
          )}
    </Page>
  );
}
