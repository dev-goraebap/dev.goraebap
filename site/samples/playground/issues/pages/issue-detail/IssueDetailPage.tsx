import { RichBody } from '@/shared/ui/composites/editor/RichBody';
import {AlertDialog} from '@/shared/ui/composites/dialog/AlertDialog';
import {RichDraft} from '@/shared/ui/composites/editor/RichDraft';
import {TextInput} from '@astryxdesign/core/TextInput';
import {useNavigate} from '@tanstack/react-router';
import { ActivityFeed, type ActivityItem } from '@/shared/ui/composites/activity/ActivityFeed';
import { PersonAvatar as Avatar } from '@/shared/ui/foundations/avatar/PersonAvatar';
import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Link } from '@astryxdesign/core/Link';
import { List, ListItem } from '@astryxdesign/core/List';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { useToast } from '@astryxdesign/core/Toast';
import { VStack } from '@astryxdesign/core/VStack';
import type { JSONContent } from '@tiptap/react';
import { RowMenu } from '@/shared/ui/composites/popup/RowMenu';
import { DatePill, OptionPill, PropertyPill } from '@/shared/ui/composites/property/PropertyPill';
import { PageState } from '@/shared/ui/composites/state/PageState';
import { icon } from '@/shared/ui/foundations/icons/solar-icon';
import { DetailLayout } from '@/shared/ui/layouts/detail/DetailLayout';
import { Page } from '@/shared/ui/layouts/page/Page';
import { PageBanner } from '@/shared/ui/layouts/page/PageParts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { me, dateText, issueKeys, issueQueries, NONE, timeText, today, useIssueApi, type Issue, type IssuePatch } from '../../entities/issue';
import { assigneeOptions, Person, priorityOptions, StatusMark, statusOptions } from '../../entities/issue/ui';
import styles from './detail.module.css';

/**
 * 이슈 상세: 직접 진입할 수 있는 자기 주소의 페이지. 속성은 알약 하나씩 바로 바꾸고(저장 뒤 다시 읽는다) 실패는 머리 아래 줄에
 * 알린다. 본문 수정은 같은 작성 양식을 페이지로 연다. 하위 이슈를 더하면 상위 이슈를 채운 같은 양식으로 간다.
 */
export function IssueDetailPage({ id, onEdit, onAddSub }: { id: string; onEdit: () => void; onAddSub: () => void }) {
  const api = useIssueApi();
  const client = useQueryClient();
  const toast = useToast();
  const navigate=useNavigate();const [deleting,setDeleting]=useState(false);const [editing,setEditing]=useState(false);
  const remove=useMutation({mutationFn:()=>api.remove(id),onSuccess:async()=>{await client.invalidateQueries({queryKey:issueKeys.all});void navigate({href:'/issues'})}});
  const query = useQuery(issueQueries.detail(api, id));
  const change = useMutation({
    mutationFn: (patch: IssuePatch) => api.update(id, patch),
    onSettled: () => client.invalidateQueries({ queryKey: issueKeys.all }),
  });
  const crumbs = [{ label: '이슈', href: '/issues', icon: 'tag' as const }];
  if (query.isPending) return <Page crumbs={[...crumbs, { label: id }]} isDetail><Center height="100%"><Spinner label="이슈를 불러오는 중" /></Center></Page>;
  if (query.isError && !query.data) {
    const isMissing = (query.error as { status?: number }).status === 404;
    return <Page crumbs={[...crumbs, { label: isMissing ? '없는 이슈' : id }]} isDetail>
      <PageState kind={isMissing ? 'not-found' : 'error'} title={isMissing ? '이슈를 찾을 수 없습니다' : '이슈를 불러오지 못했습니다'}
        description={isMissing ? '지워졌거나 주소가 바뀌었을 수 있습니다.' : '잠시 후 다시 시도해 주세요.'}
        action={isMissing ? <Button label="이슈 목록으로" variant="secondary" href="/issues" /> : <Button label="다시 시도" variant="secondary" onClick={() => void query.refetch()} />} />
    </Page>;
  }
  const issue = query.data;
  const copy = async () => {
    try { await navigator.clipboard.writeText(`${location.origin}/issues/${issue.id}`); toast({ body: '주소를 복사했습니다' }); }
    catch { toast({ body: '주소를 복사하지 못했습니다' }); }
  };
  return <Page crumbs={[...crumbs, ...(issue.parent ? [{ label: issue.parent, href: `/issues/${issue.parent}` }] : []), { label: issue.id }]}
    isDetail hasHeading={false}
    pageActions={<><Button label={editing?'편집 취소':'편집'} variant="subtle" size="sm" icon={icon('edit')} onClick={()=>setEditing(!editing)}/><RowMenu label="이슈 메뉴" actions={[
      { id: 'edit', label: '수정', icon: 'edit', onSelect: onEdit },
      { id: 'copy', label: '링크 복사', icon: 'link', onSelect: () => void copy() },
      ...(issue.author===me?[{id:'delete',label:'삭제',icon:'delete' as const,onSelect:()=>setDeleting(true)}]:[]),
    ]} /></>}>
    {change.isError ? <PageBanner status="error" title="속성을 바꾸지 못했습니다" description="화면의 값은 저장된 값입니다. 다시 골라 주세요." /> : null}
    <IssueView issue={issue} onChange={patch => change.mutate(patch)} onAddSub={onAddSub} isEditing={editing} onSaveBody={async patch=>{await change.mutateAsync(patch);setEditing(false)}} />
    <AlertDialog isOpen={deleting} onOpenChange={setDeleting} title="이슈를 삭제할까요?" description="하위 이슈는 남고 상위 연결만 해제됩니다." actionLabel="삭제" isActionLoading={remove.isPending} onAction={()=>remove.mutate()} />
    {remove.isError?<PageBanner status="error" title="삭제하지 못했습니다"/>:null}
  </Page>;
}

/**
 * 이슈의 본문과 속성, 하위 이슈, 댓글. 상세 페이지와 미리보기 패널이 같은 부품을 쓴다(조회도 같은 queryOptions).
 * 폭은 DetailLayout이 컨테이너로 판단하므로 좁은 패널에서는 속성이 제목 아래 알약 줄로 온다.
 */
export function IssueView({ issue, onChange, onAddSub, headingLevel = 1, isEditing=false,onSaveBody }: {
  issue: Issue; onChange: (patch: IssuePatch) => void; onAddSub?: () => void; headingLevel?: 1 | 2;isEditing?:boolean;onSaveBody?:(patch:IssuePatch)=>Promise<unknown>;
}) {
  const api=useIssueApi();const all=useQuery(issueQueries.all(api));
  const parents=(all.data??[]).filter(other=>{let parent:string|undefined=other.id;const seen=new Set<string>();while(parent&&!seen.has(parent)){if(parent===issue.id)return false;seen.add(parent);parent=all.data?.find(e=>e.id===parent)?.parent}return true});
  const sectionLevel = headingLevel === 1 ? 2 : 3;
  return <DetailLayout label={issue.title}
    head={<HStack gap={2} vAlign="center">
      <Text color="secondary" type="supporting" hasTabularNumbers>{issue.id}</Text>
      {issue.parent ? <Text color="secondary" type="supporting">· <Link href={`/issues/${issue.parent}`}>{issue.parent}</Link>의 하위 이슈</Text> : null}
    </HStack>}
    title={isEditing ? null : <Heading level={headingLevel}>{issue.title}</Heading>}
    sections={[
      { title: '속성', items: <>
        <OptionPill label="상태" icon="clock" value={issue.status} options={statusOptions} onChange={status => onChange({ status: status as Issue['status'] })} />
        <OptionPill label="우선순위" icon="alert" value={issue.priority} options={priorityOptions} onChange={priority => onChange({ priority: priority as Issue['priority'] })} />
        <OptionPill label="담당자" icon="user" emptyText="담당자 지정" value={issue.assignee} options={assigneeOptions}
          onChange={name => onChange({ assignee: name === NONE ? undefined : name })} />
        <OptionPill label="유형" icon="document" value={issue.type??'task'} options={[{value:'task',label:'작업'},{value:'bug',label:'버그'},{value:'improvement',label:'개선'}]} onChange={type=>onChange({type:type as Issue['type']})}/>
        <DatePill label="시작일" value={issue.start} dateStyle="absolute" today={today} onChange={start=>onChange({start})}/>
        <DatePill label="마감일" value={issue.due} today={today} onChange={due => onChange({ due })} />
      </> },
      {title:'라벨',items:<OptionPill label="라벨" icon="tag" emptyText="라벨 더하기" isMultiple value={issue.labels??[]} options={['성능','디자인','접근성','고객 요청'].map(label=>({value:label,label}))} onChange={labels=>onChange({labels})}/>},
      {title:'상위 이슈',items:<OptionPill label="상위 이슈" icon="link" value={issue.parent??NONE} options={[{value:NONE,label:'상위 이슈 없음'},...parents.map(other=>({value:other.id,label:`${other.id} ${other.title}`}))]} onChange={parent=>onChange({parent:parent===NONE?undefined:parent})}/>},
      { title: '정보', items: <>

        <PropertyPill label="수정일" icon={icon('calendar')} isEmpty={false} isDisabled text={dateText(issue.updatedAt)} />
      </> },
    ]}>
    {isEditing&&onSaveBody?<BodyEditor key={issue.id} issue={issue} onSave={onSaveBody}/>:<Body node={issue.body} />}
    <SubIssues parent={issue.id} level={sectionLevel} onAdd={onAddSub} />
    <Comments issue={issue} level={sectionLevel} />
  </DetailLayout>;
}

/** 하위 이슈: 상위 이슈 아래에 이어지는 작업. 없으면 추가 동작만 둔다. */
function SubIssues({ parent, level, onAdd }: { parent: string; level: 2 | 3; onAdd?: () => void }) {
  const api = useIssueApi();
  const client=useQueryClient();const [title,setTitle]=useState('');
  const create=useMutation({mutationFn:()=>api.create({title:title.trim(),body:{type:'doc'},status:'todo',priority:'medium',parent}),onSuccess:async()=>{setTitle('');await client.invalidateQueries({queryKey:issueKeys.all})}});
  const query = useQuery(issueQueries.all(api));
  const children = (query.data ?? []).filter(each => each.parent === parent).sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
  const done = children.filter(each => each.status === 'done').length;
  return <VStack as="section" gap={2} aria-label="하위 이슈">
    <HStack gap={2} vAlign="center" hAlign="between">
      <Text type="supporting" color="secondary" weight="medium">하위 이슈{children.length ? ` ${done}/${children.length}` : ''}</Text>
      {onAdd ? <Button label="하위 이슈 추가" variant="subtle" size="sm" icon={icon('plus')} onClick={onAdd} /> : null}
    </HStack>
    {query.isPending ? <Spinner label="하위 이슈를 불러오는 중" /> : null}
    {children.length ? <List density="compact" hasDividers aria-label="하위 이슈 목록">
      {children.map(child => <ListItem key={child.id} href={`/issues/${child.id}`}
        label={<Text maxLines={1}>{child.title}</Text>}
        startContent={<HStack gap={2} vAlign="center"><StatusMark status={child.status} isCompact /><Text type="supporting" color="secondary" hasTabularNumbers>{child.id}</Text></HStack>}
        endContent={<Person name={child.assignee} isCompact />} />)}
    </List> : null}
    {onAdd?<TextInput label="하위 이슈 추가" isLabelHidden placeholder="하위 이슈 제목을 적고 Enter" value={title} onChange={setTitle} onEnter={()=>{if(title.trim()&&!create.isPending)create.mutate()}} isLoading={create.isPending} statusVariant="detached" status={create.isError?{type:'error',message:'추가하지 못했습니다.'}:undefined}/>:null}
  </VStack>;
}

/** 댓글: 시간순 목록과 입력. 빈 댓글은 누르면 칸 곁에 알리고 초점을 옮긴다(버튼은 막지 않는다). */
function Comments({ issue }: { issue: Issue; level: 2 | 3 }) {
 const api = useIssueApi(); const client = useQueryClient(); const [error,setError]=useState<string>();
 const run = (work: Promise<unknown>) => work.then(async result=>{setError(undefined);await client.invalidateQueries({queryKey:issueKeys.all});return result},failure=>{setError('저장하지 못했습니다. 입력은 그대로 남아 있습니다.');throw failure});
 const items: ActivityItem[] = [
  {id:'created',kind:'event' as const,at:issue.createdAt,actorId:issue.author,actorName:issue.author,text:'이슈를 만들었습니다.',icon:'plus'},
  ...issue.comments.map(each=>({id:each.id,kind:'comment' as const,at:each.at,actorId:each.author,actorName:each.author,body:each.text,quote:each.quote,parentId:each.parentId,editedAt:each.editedAt})),
  ...(issue.events??[]).map(event=>({id:event.id,kind:'event' as const,at:event.at,actorId:event.actor,actorName:event.actor,text:event.text,icon:'edit'})),
 ].sort((a,b)=>a.at.localeCompare(b.at));
 return <ActivityFeed items={items} meId={me} canWrite error={error}
  onComment={(text,parentId)=>run(api.comment(issue.id,text,parentId))}
  onEdit={(commentId,text)=>run(api.editComment(issue.id,commentId,text))}
  onDelete={commentId=>run(api.editComment(issue.id,commentId))} />;
}

/** 미리보기 패널의 내용: 같은 조회, 같은 본문. 대기·없음·실패는 패널 안의 작은 상태로 보이고 목록은 그대로 둔다. */
export function IssuePeek({ id }: { id: string }) {
  const api = useIssueApi();
  const client = useQueryClient();
  const query = useQuery(issueQueries.detail(api, id));
  const change = useMutation({
    mutationFn: (patch: IssuePatch) => api.update(id, patch),
    onSettled: () => client.invalidateQueries({ queryKey: issueKeys.all }),
  });
  if (query.isPending) return <Center height="100%"><Spinner label="이슈를 불러오는 중" /></Center>;
  if (query.isError && !query.data) {
    const isMissing = (query.error as { status?: number }).status === 404;
    return <PageState isCompact kind={isMissing ? 'not-found' : 'error'} title={isMissing ? '이슈를 찾을 수 없습니다' : '이슈를 불러오지 못했습니다'}
      action={isMissing ? undefined : <Button label="다시 시도" variant="secondary" onClick={() => void query.refetch()} />} />;
  }
  return <>
    {change.isError ? <PageBanner status="error" title="속성을 바꾸지 못했습니다" /> : null}
    <IssueView issue={query.data} onChange={patch => change.mutate(patch)} headingLevel={2} />
  </>;
}

/** 읽기 본문: 저장한 문서를 그대로 읽는다. 긴 단어·주소는 줄을 넘긴다. */
function Body({ node }: { node: JSONContent }): ReactNode {
  return <RichBody value={node} />;
}

function BodyEditor({issue,onSave}:{issue:Issue;onSave:(patch:IssuePatch)=>Promise<unknown>}){const [title,setTitle]=useState(issue.title);const [body,setBody]=useState(issue.body);const [busy,setBusy]=useState(false);const [error,setError]=useState<string>();return <VStack gap={3}><TextInput label="이슈 제목" value={title} onChange={setTitle} hasAutoFocus/><RichDraft value={body} onChange={setBody} isPage/><HStack hAlign="end"><Button label="변경 저장" variant="primary" isLoading={busy} onClick={()=>{if(!title.trim()){setError('제목을 입력해 주세요.');return;}setBusy(true);onSave({title:title.trim(),body}).catch(()=>setError('저장하지 못했습니다. 입력은 그대로 남아 있습니다.')).finally(()=>setBusy(false))}}/></HStack>{error?<Text role="alert" color="secondary">{error}</Text>:null}</VStack>;}
