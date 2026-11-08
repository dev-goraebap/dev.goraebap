import { RichBody } from '@kit/composites/editor/RichBody';
import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Link } from '@astryxdesign/core/Link';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { useToast } from '@astryxdesign/core/Toast';
import type { JSONContent } from '@tiptap/react';
import { AlertDialog } from '@kit/composites/dialog/AlertDialog';
import { RowMenu } from '@kit/composites/popup/RowMenu';
import { OptionPill, PropertyPill } from '@kit/composites/property/PropertyPill';
import { PageState } from '@kit/composites/state/PageState';
import { icon } from '@kit/foundations/icons/solar-icon';
import { DetailLayout } from '@kit/layouts/detail/DetailLayout';
import { Page } from '@kit/layouts/page/Page';
import { PageBanner } from '@kit/layouts/page/PageParts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { collectionName, collections, kinds, resourceKeys, resourceQueries, useResourceApi, type Resource } from '../../entities/resource';
import { Person, RowDate } from '../../entities/resource/ui';
import styles from './detail.module.css';

/**
 * 자료 상세: 직접 진입할 수 있는 자기 주소의 페이지. 속성은 알약 하나씩 바로 바꾸고(낙관적 갱신 없이 저장 뒤 다시 읽는다),
 * 실패는 머리 아래 줄에 알린다. 본문 수정은 같은 작성 양식을 목록 위 대화상자 또는 페이지로 연다.
 */
export function ResourceDetailPage({ id, onEdit, onDeleted }: { id: string; onEdit: () => void; onDeleted: () => void }) {
  const api = useResourceApi();
  const client = useQueryClient();
  const toast = useToast();
  const query = useQuery(resourceQueries.detail(api, id));
  const [isDeleting, setDeleting] = useState(false);
  const change = useMutation({
    mutationFn: (patch: Partial<Resource>) => api.update(id, patch),
    onSettled: () => client.invalidateQueries({ queryKey: resourceKeys.all }),
  });
  const remove = useMutation({ mutationFn: () => api.remove(id), onSuccess: () => { void client.invalidateQueries({ queryKey: resourceKeys.all }); onDeleted(); } });
  const crumbs = [{ label: '서가', href: '/resources', icon: 'library' as const }];
  if (query.isPending) return <Page crumbs={[...crumbs, { label: '자료' }]} isDetail><Center height="100%"><Spinner label="자료를 불러오는 중" /></Center></Page>;
  if (query.isError && !query.data) {
    const isMissing = (query.error as { status?: number }).status === 404;
    return <Page crumbs={[...crumbs, { label: isMissing ? '없는 자료' : '자료' }]} isDetail>
      <PageState kind={isMissing ? 'not-found' : 'error'} title={isMissing ? '자료를 찾을 수 없습니다' : '자료를 불러오지 못했습니다'}
        description={isMissing ? '지워졌거나 주소가 바뀌었을 수 있습니다.' : '잠시 후 다시 시도해 주세요.'}
        action={isMissing ? <Button label="서가로" variant="secondary" href="/resources" /> : <Button label="다시 시도" variant="secondary" onClick={() => void query.refetch()} />} />
    </Page>;
  }
  const resource = query.data;
  const copy = async () => {
    try { await navigator.clipboard.writeText(`${location.origin}/resources/${resource.id}`); toast({ body: '주소를 복사했습니다' }); }
    catch { toast({ body: '주소를 복사하지 못했습니다' }); }
  };
  return <Page crumbs={[...crumbs, { label: collectionName(resource.collection), href: `/resources?collection=${resource.collection}` }, { label: resource.title }]}
    isDetail hasHeading={false}
    pageActions={<HStack gap={1}>
      <Button label={resource.starred ? '즐겨찾기 해제' : '즐겨찾기'} tooltip={resource.starred ? '즐겨찾기 해제' : '즐겨찾기'} variant="ghost" size="sm" isIconOnly
        aria-pressed={resource.starred} icon={icon('star', resource.starred)} onClick={() => change.mutate({ starred: !resource.starred })} />
      <RowMenu label="자료 메뉴" actions={[
        { id: 'edit', label: '수정', icon: 'edit', onSelect: onEdit },
        { id: 'copy', label: '링크 복사', icon: 'link', onSelect: () => void copy() },
        { id: 'delete', label: '삭제', icon: 'delete', onSelect: () => setDeleting(true) },
      ]} />
    </HStack>}>
    {change.isError ? <PageBanner status="error" title="속성을 바꾸지 못했습니다" description="화면의 값은 저장된 값입니다. 다시 골라 주세요." /> : null}
    <ResourceView resource={resource} onChange={patch => change.mutate(patch)} />
    <AlertDialog isOpen={isDeleting} onOpenChange={setDeleting} title="자료를 삭제할까요?" description="삭제한 자료는 되돌릴 수 없습니다."
      actionLabel="삭제" isActionLoading={remove.isPending} onAction={() => remove.mutate()} />
  </Page>;
}

/**
 * 자료의 본문과 속성. 상세 페이지와 미리보기 패널이 같은 부품을 쓴다(조회도 같은 queryOptions).
 * 폭은 DetailLayout이 컨테이너로 판단하므로 좁은 패널에서는 속성이 제목 아래 알약 줄로 온다.
 */
export function ResourceView({ resource, onChange, headingLevel = 1 }: { resource: Resource; onChange: (patch: Partial<Resource>) => void; headingLevel?: 1 | 2 }) {
  return <>
    <DetailLayout label={resource.title}
      head={<Text color="secondary" type="supporting">{collectionName(resource.collection)}</Text>}
      title={<Heading level={headingLevel}>{resource.title}</Heading>}
      sections={[
        { title: '속성', items: <>
          <OptionPill label="종류" icon="document" value={resource.kind} options={kinds.map(kind => ({ value: kind.id, label: kind.label, icon: icon(kind.icon) }))}
            onChange={kind => onChange({ kind: kind as Resource['kind'] })} />
          <OptionPill label="컬렉션" icon="folder" value={resource.collection} options={collections.map(each => ({ value: each.id, label: each.name }))}
            onChange={collection => onChange({ collection })} />
        </> },
        { title: '정보', items: <>
          <PropertyPill label="작성자" icon={null} isEmpty={false} isDisabled text={<Person name={resource.author} />} />
          <PropertyPill label="수정일" icon={null} isEmpty={false} isDisabled text={<RowDate value={resource.updatedAt} />} />
          {resource.files.length ? <PropertyPill label="첨부" icon={icon('attachment')} isEmpty={false} isDisabled text={`${resource.files.length}개`} /> : null}
        </> },
      ]}>
      {resource.url ? <Link className={styles.url} href={resource.url} target="_blank" rel="noreferrer">{resource.url}</Link> : null}
      <Body node={resource.body} />
    </DetailLayout>
  </>;
}

/**
 * 미리보기 패널의 내용: 같은 조회, 같은 본문. 대기·없음·실패는 패널 안의 작은 상태로 보이고 목록은 그대로 둔다.
 */
export function ResourcePeek({ id }: { id: string }) {
  const api = useResourceApi();
  const client = useQueryClient();
  const query = useQuery(resourceQueries.detail(api, id));
  const change = useMutation({
    mutationFn: (patch: Partial<Resource>) => api.update(id, patch),
    onSettled: () => client.invalidateQueries({ queryKey: resourceKeys.all }),
  });
  if (query.isPending) return <Center height="100%"><Spinner label="자료를 불러오는 중" /></Center>;
  if (query.isError && !query.data) {
    const isMissing = (query.error as { status?: number }).status === 404;
    return <PageState isCompact kind={isMissing ? 'not-found' : 'error'} title={isMissing ? '자료를 찾을 수 없습니다' : '자료를 불러오지 못했습니다'}
      action={isMissing ? undefined : <Button label="다시 시도" variant="secondary" onClick={() => void query.refetch()} />} />;
  }
  return <>
    {change.isError ? <PageBanner status="error" title="속성을 바꾸지 못했습니다" /> : null}
    <ResourceView resource={query.data} onChange={patch => change.mutate(patch)} headingLevel={2} />
  </>;
}

/** 읽기 본문: 저장한 문서를 그대로 읽는다. 긴 단어·주소는 줄을 넘긴다. */
function Body({ node }: { node: JSONContent }): ReactNode {
  return <RichBody value={node} />;
}
