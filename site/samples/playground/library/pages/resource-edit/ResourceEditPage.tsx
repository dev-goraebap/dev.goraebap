import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { Spinner } from '@astryxdesign/core/Spinner';
import { PageState } from '@/shared/ui/composites/state/PageState';
import { Page } from '@/shared/ui/layouts/page/Page';
import { BodyEditPage } from '@/shared/ui/patterns/compose/BodyEditPage';
import { fakePreview, fakeUpload } from '@samples/composites/editor-fixtures';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { resourceKeys, resourceQueries, useResourceApi } from '../../entities/resource';

/**
 * 자료 수정 화면(/resources/{id}/edit): 상세의 편집 단추가 연다. 제목과 본문만 두고(종류·컬렉션 같은 속성은 상세에서 바꾼다),
 * 저장은 머리 줄의 저장 · Ctrl/⌘+S, 완료는 저장하고 상세로, 취소는 저장하지 않고 상세로 돌아간다(고친 것이 있으면 먼저 묻는다).
 * 링크 입력 칸에서는 서가의 다른 자료를 이름으로 찾아 건다.
 */
export function ResourceEditPage({ id, onLeave }: { id: string; onLeave: () => void }) {
  const api = useResourceApi();
  const client = useQueryClient();
  const query = useQuery(resourceQueries.detail(api, id));
  const all = useQuery(resourceQueries.all(api));
  const links = useMemo(() => (all.data ?? []).filter(each => each.id !== id)
    .map(each => ({ title: each.title, href: `/resources/${each.id}`, hint: '자료' })), [all.data, id]);
  const crumbs = [{ label: '서가', href: '/resources', icon: 'library' as const }, { label: query.data?.title ?? '자료', href: `/resources/${id}` }, { label: '수정' }];
  if (query.isPending) return <Page crumbs={crumbs} isDetail><Center height="100%"><Spinner label="자료를 불러오는 중" /></Center></Page>;
  if (query.isError && !query.data) return <Page crumbs={crumbs} isDetail>
    <PageState kind="error" title="자료를 불러오지 못했습니다" action={<Button label="다시 시도" variant="secondary" onClick={() => void query.refetch()} />} />
  </Page>;
  return <BodyEditPage key={id} crumbs={crumbs} value={{ title: query.data.title, body: query.data.body }} titlePlaceholder="자료 제목"
    upload={fakeUpload} readPreview={fakePreview} links={links} onLeave={onLeave}
    onSave={async next => { await api.update(id, next); await client.invalidateQueries({ queryKey: resourceKeys.all }); }} />;
}
