import { Button } from '@astryxdesign/core/Button';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { useQuery } from '@tanstack/react-query';
import { useNavigate,useParams } from '@tanstack/react-router';
import { Page } from '@/shared/ui/layouts/page/Page';
import { DetailLayout } from '@/shared/ui/layouts/detail/DetailLayout';
import { PropertyPill } from '@/shared/ui/composites/property/PropertyPill';
import { PageState } from '@/shared/ui/composites/state/PageState';
import { Spinner } from '@astryxdesign/core/Spinner';
import { icon } from '@/shared/ui/foundations/icons/solar-icon';
import {eventQueries,useEventApi,whenText,dayText} from '../../entities/event';
export function EventPage(){
 const {id}=useParams({strict:false}) as {id:string};const navigate=useNavigate();const query=useQuery(eventQueries.all(useEventApi()));const event=query.data?.find(e=>e.id===id);
 return <Page isDetail hasHeading={false} crumbs={[{label:'일정',href:'/calendar',icon:'calendar'},{label:event?.title??'일정'}]} pageActions={event?<Button label="수정" icon={icon('edit')} variant="secondary" onClick={()=>void navigate({href:`/calendar/events/${id}/edit`})}/>:undefined}>
 {query.isPending?<Spinner label="일정을 불러오는 중"/>:!event?<PageState kind={query.isError?'error':'not-found'} title="일정을 열 수 없습니다"/>:<DetailLayout label={event.title} title={<Heading level={1}>{event.title}</Heading>} head={<Text color="secondary">{whenText(event)}</Text>} sections={[{title:'일정',items:<><PropertyPill label="시작일" icon={icon('calendar')} isEmpty={false} isDisabled text={dayText(event.start)}/><PropertyPill label="종료일" icon={icon('calendar')} isEmpty={false} isDisabled text={dayText(event.end)}/><PropertyPill label="시각" icon={icon('clock')} isEmpty={false} isDisabled text={event.time??'종일'}/></>}]}><Text>{event.place||'정한 장소가 없습니다.'}</Text></DetailLayout>}
 </Page>;
}
