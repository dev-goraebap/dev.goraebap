import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { JSONContent } from '@tiptap/react';
import { useMemo } from 'react';
import { fakePreview, fakeUpload } from '@samples/composites/editor-fixtures';
import { BodyEditPage } from '@/shared/ui/body-edit';
import { Button } from '@/shared/ui/button';
import { RichDraft } from '@/shared/ui/editor';
import { LibraryIcon } from '@/shared/ui/icon';
import { Page } from '@/shared/ui/page';
import { PageState } from '@/shared/ui/page-state';
import { Spinner } from '@/shared/ui/spinner';
import { resourceKeys, resourceQueries, useResourceApi } from '../../entities/resource';

/**
 * 자료 수정 화면(/resources/{id}/edit, 키트 BodyEditPage): 상세의 편집 단추가 연다. 제목과 본문만 두고(종류 · 컬렉션 같은 속성은
 * 상세에서 바꾼다), 저장은 머리 줄의 저장 · Ctrl/⌘+S, 완료는 저장하고 상세로, 취소는 저장하지 않고 상세로 돌아간다(고친 것이 있으면
 * 먼저 묻는다). 링크 입력 칸에서는 서가의 다른 자료를 이름으로 찾아 건다.
 */
export function ResourceEditPage({ id, onLeave }: { id: string; onLeave: () => void }) {
  const api = useResourceApi();
  const client = useQueryClient();
  const query = useQuery(resourceQueries.detail(api, id));
  const all = useQuery(resourceQueries.all(api));
  const links = useMemo(() => (all.data ?? []).filter(each => each.id !== id)
    .map(each => ({ title: each.title, href: `/resources/${each.id}`, hint: '자료' })), [all.data, id]);
  const crumbs = [{ label: '서가', href: '/resources', icon: LibraryIcon }, { label: query.data?.title ?? '자료', href: `/resources/${id}` }, { label: '수정' }];
  if (query.isPending) return <Page crumbs={crumbs} isFullScreen>
    <div className="flex flex-1 items-center justify-center"><Spinner aria-label="자료를 불러오는 중" className="size-6 text-muted-foreground" /></div>
  </Page>;
  if (query.isError && !query.data) return <Page crumbs={crumbs} isFullScreen>
    <PageState kind="error" title="자료를 불러오지 못했습니다" action={<Button variant="secondary" onClick={() => void query.refetch()}>다시 시도</Button>} />
  </Page>;
  return <BodyEditPage<JSONContent> key={id} crumbs={crumbs} value={{ title: query.data.title, body: query.data.body }} titlePlaceholder="자료 제목" onLeave={onLeave}
    renderBody={({ value, onChange }) => <RichDraft value={value} onChange={onChange} isPage upload={fakeUpload} readPreview={fakePreview} links={links} />}
    onSave={async next => { await api.update(id, next); await client.invalidateQueries({ queryKey: resourceKeys.all }); }} />;
}
