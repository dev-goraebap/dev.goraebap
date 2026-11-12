import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { Spinner } from '@astryxdesign/core/Spinner';
import { PageState } from '@/shared/ui/composites/state/PageState';
import { Page } from '@/shared/ui/layouts/page/Page';
import { BodyEditPage } from '@/shared/ui/patterns/compose/BodyEditPage';
import { fakePreview, fakeUpload } from '@samples/composites/editor-fixtures';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { issueKeys, issueQueries, useIssueApi } from '../../entities/issue';

/**
 * 이슈 수정 화면(/issues/{id}/edit): 상세의 편집 단추가 연다. 제목과 본문만 두고(속성·하위 이슈·활동 없음), 저장은 머리 줄의
 * 저장 · Ctrl/⌘+S, 완료는 저장하고 상세로, 취소는 저장하지 않고 상세로 돌아간다(고친 것이 있으면 먼저 묻는다).
 * 링크 입력 칸에서는 다른 이슈를 이름으로 찾아 건다.
 */
export function IssueEditPage({ id, onLeave }: { id: string; onLeave: () => void }) {
  const api = useIssueApi();
  const client = useQueryClient();
  const query = useQuery(issueQueries.detail(api, id));
  const all = useQuery(issueQueries.all(api));
  const links = useMemo(() => (all.data ?? []).filter(each => each.id !== id)
    .map(each => ({ title: `${each.id} ${each.title}`, href: `/issues/${each.id}`, hint: '이슈' })), [all.data, id]);
  const crumbs = [{ label: '이슈', href: '/issues', icon: 'tag' as const }, { label: id, href: `/issues/${id}` }, { label: '수정' }];
  if (query.isPending) return <Page crumbs={crumbs} isDetail><Center height="100%"><Spinner label="이슈를 불러오는 중" /></Center></Page>;
  if (query.isError && !query.data) return <Page crumbs={crumbs} isDetail>
    <PageState kind="error" title="이슈를 불러오지 못했습니다" action={<Button label="다시 시도" variant="secondary" onClick={() => void query.refetch()} />} />
  </Page>;
  return <BodyEditPage key={id} crumbs={crumbs} value={{ title: query.data.title, body: query.data.body }} titlePlaceholder="이슈 제목"
    upload={fakeUpload} readPreview={fakePreview} links={links} onLeave={onLeave}
    onSave={async next => { await api.update(id, next); await client.invalidateQueries({ queryKey: issueKeys.all }); }} />;
}
