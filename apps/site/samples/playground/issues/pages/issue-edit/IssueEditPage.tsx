import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { JSONContent } from '@tiptap/react';
import { useMemo } from 'react';
import { BodyEditPage } from '@/shared/ui/body-edit';
import { Button } from '@/shared/ui/button';
import { RichDraft } from '@/shared/ui/editor';
import { TagIcon } from '@/shared/ui/icon';
import { Page } from '@/shared/ui/page';
import { PageState } from '@/shared/ui/page-state';
import { Spinner } from '@/shared/ui/spinner';
import { fakePreview, fakeUpload } from '@samples/composites/editor-fixtures';
import { issueKeys, issueQueries, useIssueApi } from '../../entities/issue';

/**
 * 이슈 수정 화면(/issues/{id}/edit): 상세의 편집 단추가 연다. 제목과 본문만 두고(속성 · 하위 이슈 · 활동 없음), 저장은 머리 줄의
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
  const crumbs = [{ label: '이슈', href: '/issues', icon: TagIcon }, { label: id, href: `/issues/${id}` }, { label: '수정' }];
  if (query.isPending) return <Page crumbs={crumbs} isFullScreen>
    <div className="flex flex-1 items-center justify-center"><Spinner aria-label="이슈를 불러오는 중" className="size-6" /></div>
  </Page>;
  if (query.isError && !query.data) return <Page crumbs={crumbs} isFullScreen>
    <PageState kind="error" title="이슈를 불러오지 못했습니다" action={<Button variant="secondary" onClick={() => void query.refetch()}>다시 시도</Button>} />
  </Page>;
  return <BodyEditPage<JSONContent> key={id} crumbs={crumbs} value={{ title: query.data.title, body: query.data.body }} titlePlaceholder="이슈 제목" onLeave={onLeave}
    renderBody={body => <RichDraft value={body.value} onChange={body.onChange} isPage upload={fakeUpload} readPreview={fakePreview} links={links} />}
    onSave={async next => { await api.update(id, next); await client.invalidateQueries({ queryKey: issueKeys.all }); }} />;
}
