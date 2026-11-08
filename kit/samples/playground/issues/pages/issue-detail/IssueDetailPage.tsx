import { Avatar } from '@astryxdesign/core/Avatar';
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
import { RowMenu } from '@kit/composites/popup/RowMenu';
import { DatePill, OptionPill, PropertyPill } from '@kit/composites/property/PropertyPill';
import { PageState } from '@kit/composites/state/PageState';
import { icon } from '@kit/foundations/icons/solar-icon';
import { DetailLayout } from '@kit/layouts/detail/DetailLayout';
import { Page } from '@kit/layouts/page/Page';
import { PageBanner } from '@kit/layouts/page/PageParts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { dateText, issueKeys, issueQueries, NONE, timeText, today, useIssueApi, type Issue, type IssuePatch } from '../../entities/issue';
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
    pageActions={<RowMenu label="이슈 메뉴" actions={[
      { id: 'edit', label: '수정', icon: 'edit', onSelect: onEdit },
      { id: 'copy', label: '링크 복사', icon: 'link', onSelect: () => void copy() },
    ]} />}>
    {change.isError ? <PageBanner status="error" title="속성을 바꾸지 못했습니다" description="화면의 값은 저장된 값입니다. 다시 골라 주세요." /> : null}
    <IssueView issue={issue} onChange={patch => change.mutate(patch)} onAddSub={onAddSub} />
  </Page>;
}

/**
 * 이슈의 본문과 속성, 하위 이슈, 댓글. 상세 페이지와 미리보기 패널이 같은 부품을 쓴다(조회도 같은 queryOptions).
 * 폭은 DetailLayout이 컨테이너로 판단하므로 좁은 패널에서는 속성이 제목 아래 알약 줄로 온다.
 */
export function IssueView({ issue, onChange, onAddSub, headingLevel = 1 }: {
  issue: Issue; onChange: (patch: IssuePatch) => void; onAddSub?: () => void; headingLevel?: 1 | 2;
}) {
  const sectionLevel = headingLevel === 1 ? 2 : 3;
  return <DetailLayout label={issue.title}
    head={<HStack gap={2} vAlign="center">
      <Text color="secondary" type="supporting" hasTabularNumbers>{issue.id}</Text>
      {issue.parent ? <Text color="secondary" type="supporting">· <Link href={`/issues/${issue.parent}`}>{issue.parent}</Link>의 하위 이슈</Text> : null}
    </HStack>}
    title={<Heading level={headingLevel}>{issue.title}</Heading>}
    sections={[
      { title: '속성', items: <>
        <OptionPill label="상태" icon="clock" value={issue.status} options={statusOptions} onChange={status => onChange({ status: status as Issue['status'] })} />
        <OptionPill label="우선순위" icon="alert" value={issue.priority} options={priorityOptions} onChange={priority => onChange({ priority: priority as Issue['priority'] })} />
        <OptionPill label="담당자" icon="user" emptyText="담당자 지정" value={issue.assignee} options={assigneeOptions}
          onChange={name => onChange({ assignee: name === NONE ? undefined : name })} />
        <DatePill label="마감일" value={issue.due} today={today} onChange={due => onChange({ due })} />
      </> },
      { title: '정보', items: <>
        <PropertyPill label="만든 사람" icon={null} isEmpty={false} isDisabled text={<Person name={issue.author} />} />
        <PropertyPill label="수정일" icon={null} isEmpty={false} isDisabled text={dateText(issue.updatedAt)} />
      </> },
    ]}>
    <Body node={issue.body} />
    <SubIssues parent={issue.id} level={sectionLevel} onAdd={onAddSub} />
    <Comments issue={issue} level={sectionLevel} />
  </DetailLayout>;
}

/** 하위 이슈: 상위 이슈 아래에 이어지는 작업. 없으면 추가 동작만 둔다. */
function SubIssues({ parent, level, onAdd }: { parent: string; level: 2 | 3; onAdd?: () => void }) {
  const api = useIssueApi();
  const query = useQuery(issueQueries.all(api));
  const children = (query.data ?? []).filter(each => each.parent === parent).sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
  const done = children.filter(each => each.status === 'done').length;
  return <VStack as="section" gap={2} aria-label="하위 이슈">
    <HStack gap={2} vAlign="center" hAlign="between">
      <Heading level={level}>하위 이슈{children.length ? ` ${done}/${children.length}` : ''}</Heading>
      {onAdd ? <Button label="하위 이슈 추가" variant="subtle" size="sm" icon={icon('plus')} onClick={onAdd} /> : null}
    </HStack>
    {query.isPending ? <Spinner label="하위 이슈를 불러오는 중" /> : null}
    {children.length ? <List density="compact" hasDividers aria-label="하위 이슈 목록">
      {children.map(child => <ListItem key={child.id} href={`/issues/${child.id}`}
        label={<Text maxLines={1}>{child.title}</Text>}
        startContent={<HStack gap={2} vAlign="center"><StatusMark status={child.status} isCompact /><Text type="supporting" color="secondary" hasTabularNumbers>{child.id}</Text></HStack>}
        endContent={<Person name={child.assignee} isCompact />} />)}
    </List> : query.isSuccess ? <Text color="secondary">하위 이슈가 없습니다.</Text> : null}
  </VStack>;
}

/** 댓글: 시간순 목록과 입력. 빈 댓글은 누르면 칸 곁에 알리고 초점을 옮긴다(버튼은 막지 않는다). */
function Comments({ issue, level }: { issue: Issue; level: 2 | 3 }) {
  const api = useIssueApi();
  const client = useQueryClient();
  const [text, setText] = useState('');
  const [isTried, setTried] = useState(false);
  const send = useMutation({
    mutationFn: (value: string) => api.comment(issue.id, value),
    onSuccess: () => { setText(''); setTried(false); void client.invalidateQueries({ queryKey: issueKeys.all }); },
  });
  const submit = () => {
    if (!text.trim()) { setTried(true); requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); return; }
    send.mutate(text.trim());
  };
  return <VStack as="section" gap={3} aria-label="댓글">
    <Heading level={level}>댓글{issue.comments.length ? ` ${issue.comments.length}` : ''}</Heading>
    {issue.comments.map(comment => <HStack key={comment.id} gap={3} vAlign="start">
      <Avatar name={comment.author} size="sm" shape="circle" />
      <VStack gap={0.5} className={styles.comment}>
        <HStack gap={2} vAlign="center"><Text weight="medium">{comment.author}</Text><Text type="supporting" color="secondary" hasTabularNumbers>{timeText(comment.at)}</Text></HStack>
        <Text>{comment.text}</Text>
      </VStack>
    </HStack>)}
    <VStack gap={2}>
      <TextArea label="댓글" isLabelHidden placeholder="댓글을 남겨 보세요" rows={3} value={text} onChange={setText}
        status={isTried && !text.trim() ? { type: 'error', message: '댓글 내용을 입력해 주세요.' } : undefined} />
      {send.isError ? <Text role="alert" className={styles.failed}>댓글을 남기지 못했습니다. 입력한 내용은 그대로 있습니다.</Text> : null}
      <HStack hAlign="end"><Button label="댓글 남기기" variant="secondary" size="sm" isLoading={send.isPending} onClick={submit} /></HStack>
    </VStack>
  </VStack>;
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
  return <article className={styles.body}>{node.content?.map((child, index) => {
    const text = child.content?.map(part => part.text).join('') ?? '';
    return child.type === 'heading' ? <h2 key={index}>{text}</h2> : <p key={index}>{text}</p>;
  })}</article>;
}
