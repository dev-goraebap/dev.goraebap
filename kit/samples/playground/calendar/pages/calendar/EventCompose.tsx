import { Center } from '@astryxdesign/core/Center';
import { Spinner } from '@astryxdesign/core/Spinner';
import { TextInput } from '@astryxdesign/core/TextInput';
import { ComposeForm } from '@kit/patterns/compose/ComposeForm';
import { ComposeSurface } from '@kit/patterns/compose/ComposeSurface';
import { useDraft } from '@kit/patterns/compose/draft-store';
import { DatePill, OptionPill } from '@kit/composites/property/PropertyPill';
import { focusFirstInvalid } from '@kit/patterns/compose/validation';
import { PageState } from '@kit/composites/state/PageState';
import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { colors,eventKeys,eventQueries,TODAY,useEventApi,type CalendarEvent,type NewEvent,type DateKey,type EventColor } from '../../entities/event';
const times=[{value:'all-day',label:'종일'},...Array.from({length:48},(_,i)=>{const t=`${String(Math.floor(i/2)).padStart(2,'0')}:${i%2?'30':'00'}`;return {value:t,label:t}})];
export function EventCompose({id,date=TODAY,surface,onClose,onExpand,onDone}:{id?:string;date?:DateKey;surface:'page'|'dialog';onClose:()=>void;onExpand?:()=>void;onDone:(id:string)=>void}) {
 const api=useEventApi(); const query=useQuery(eventQueries.all(api));
 if(id && query.isPending)return <Center><Spinner label="일정을 불러오는 중"/></Center>;
 const event=query.data?.find(e=>e.id===id);
 if(id && !event)return <PageState kind={query.isError?'error':'not-found'} title="일정을 열 수 없습니다"/>;
 return <EventFields key={id??date} {...{event,date,surface,onClose,onExpand,onDone}}/>;
}
function EventFields({event,date,surface,onClose,onExpand,onDone}:{event?:CalendarEvent;date:DateKey;surface:'page'|'dialog';onClose:()=>void;onExpand?:()=>void;onDone:(id:string)=>void}) {
 const api=useEventApi();const client=useQueryClient();const initial:NewEvent={title:event?.title??'',place:event?.place??'',start:event?.start??date,end:event?.end??date,color:event?.color??'blue',time:event?.time};
 const [draft,set,clear]=useDraft<NewEvent>(`calendar:${event?.id??'new'}`,initial);const [tried,trySubmit]=useState(false);
 const save=useMutation({mutationFn:()=>event?api.update(event.id,draft):api.create(draft),onSuccess:async saved=>{await client.invalidateQueries({queryKey:eventKeys.all});clear();onDone(saved.id)}});
 const invalid=!draft.start || !draft.end || draft.end<draft.start;
 const submit=()=>{trySubmit(true);if(!draft.title.trim()||invalid){focusFirstInvalid();return;}save.mutate()};
 return <ComposeSurface surface={surface} crumbs={[{label:'일정',href:'/calendar',icon:'calendar'},{label:event?'일정 수정':'일정 만들기'}]} isDirty={JSON.stringify(draft)!==JSON.stringify(initial)} onClose={onClose} onExpand={onExpand}
   submit={{label:event?'저장':'추가',onSubmit:submit,isPending:save.isPending}} error={save.isError?'저장하지 못했습니다. 입력은 그대로 남아 있습니다.':undefined}>
  <ComposeForm title={draft.title} onTitle={title=>set({...draft,title})} titlePlaceholder="일정 제목" titleError={tried&&!draft.title.trim()?'제목을 입력해 주세요.':undefined} isPage={surface==='page'}
   body={<TextInput label="장소 (선택)" value={draft.place??''} onChange={place=>set({...draft,place})}/>}
   pills={<><DatePill label="시작일" value={draft.start} today={TODAY} dateStyle="absolute" isRequired isInvalid={tried&&invalid} onChange={start=>set({...draft,start:start as DateKey,end:!draft.end||start&&draft.end<start?start as DateKey:draft.end})}/>
   <DatePill label="종료일" value={draft.end} today={TODAY} dateStyle="absolute" isRequired isInvalid={tried&&invalid} onChange={end=>set({...draft,end:end as DateKey})}/>
   <OptionPill label="시작 시각" icon="clock" value={draft.time??'all-day'} options={times} onChange={time=>set({...draft,time:time==='all-day'?undefined:time})}/>
   <OptionPill label="색" icon="tag" value={draft.color} options={colors.map(c=>({value:c.id,label:c.label}))} onChange={color=>set({...draft,color:color as EventColor})}/></>}
   pillsError={tried&&invalid?'종료일은 시작일과 같거나 뒤여야 합니다.':undefined}/>
 </ComposeSurface>;
}
