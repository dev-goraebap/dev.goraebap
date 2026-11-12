import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import type { JSONContent } from '@tiptap/react';
import { useState } from 'react';
import { fakePreview } from '@samples/composites/editor-fixtures';
import { ActionMenu } from '@/shared/ui/action-menu';
import { Alert, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { RichBody } from '@/shared/ui/editor';
import { CalendarIcon, FileTextIcon, FolderIcon, LibraryIcon, LinkIcon, PaperclipIcon, PencilIcon, StarIcon, Trash2Icon, TriangleAlertIcon,
  UserIcon } from '@/shared/ui/icon';
import { InfoPill } from '@/shared/ui/info-pill';
import { Page } from '@/shared/ui/page';
import { PageState } from '@/shared/ui/page-state';
import { OptionPill } from '@/shared/ui/property-pill';
import { DetailLayout } from '@/shared/ui/reading';
import { Spinner } from '@/shared/ui/spinner';
import { toast } from '@/shared/ui/toast';
import { collectionName, collections, dateText, kinds, resourceKeys, resourceQueries, useResourceApi, type Resource } from '../../entities/resource';

const listCrumb = { label: '서가', href: '/resources', icon: LibraryIcon };

/**
 * 자료 상세: 직접 진입할 수 있는 자기 주소의 페이지(휴대폰은 전체 화면). 속성은 알약 하나씩 바로 바꾸고(낙관적 갱신 없이 저장 뒤
 * 다시 읽는다), 실패는 머리 아래 줄에 알린다. 편집은 늘 수정 화면(…/edit)을 연다(제목과 본문만).
 */
export function ResourceDetailPage({ id, onEdit, onDeleted }: { id: string; onEdit: () => void; onDeleted: () => void }) {
  const api = useResourceApi();
  const client = useQueryClient();
  const query = useQuery(resourceQueries.detail(api, id));
  const [isDeleting, setDeleting] = useState(false);
  const change = useMutation({
    mutationFn: (patch: Partial<Resource>) => api.update(id, patch),
    onSettled: () => client.invalidateQueries({ queryKey: resourceKeys.all }),
  });
  const remove = useMutation({ mutationFn: () => api.remove(id), onSuccess: () => { void client.invalidateQueries({ queryKey: resourceKeys.all }); onDeleted(); } });
  if (query.isPending) return <Page crumbs={[listCrumb, { label: '자료' }]} isFullScreen>
    <div className="flex flex-1 items-center justify-center"><Spinner aria-label="자료를 불러오는 중" className="size-6 text-muted-foreground" /></div>
  </Page>;
  if (query.isError && !query.data) {
    const isMissing = (query.error as { status?: number }).status === 404;
    return <Page crumbs={[listCrumb, { label: isMissing ? '없는 자료' : '자료' }]} isFullScreen>
      <PageState kind={isMissing ? 'not-found' : 'error'} title={isMissing ? '자료를 찾을 수 없습니다' : '자료를 불러오지 못했습니다'}
        description={isMissing ? '지워졌거나 주소가 바뀌었을 수 있습니다.' : '잠시 후 다시 시도해 주세요.'}
        action={isMissing
          ? <Button variant="secondary" nativeButton={false} render={<Link to={"/resources" as string} />}>서가로</Button>
          : <Button variant="secondary" onClick={() => void query.refetch()}>다시 시도</Button>} />
    </Page>;
  }
  const resource = query.data;
  const copy = async () => {
    try { await navigator.clipboard.writeText(`${location.origin}/resources/${resource.id}`); toast.add({ type: 'success', title: '주소를 복사했습니다' }); }
    catch { toast.add({ type: 'error', title: '주소를 복사하지 못했습니다' }); }
  };
  return <Page isFullScreen
    crumbs={[listCrumb, { label: collectionName(resource.collection), href: `/resources?collection=${resource.collection}` }, { label: resource.title }]}
    actions={<div className="flex shrink-0 items-center gap-1 max-md:ml-auto">
      <Button variant="ghost" size="icon" aria-label={resource.starred ? '즐겨찾기 해제' : '즐겨찾기'} title={resource.starred ? '즐겨찾기 해제' : '즐겨찾기'}
        aria-pressed={resource.starred} className="max-md:size-11" onClick={() => change.mutate({ starred: !resource.starred })}>
        <StarIcon chosen={resource.starred} />
      </Button>
      <Button variant="secondary" className="max-md:h-11" onClick={onEdit}><PencilIcon data-icon="inline-start" />편집</Button>
      <ActionMenu label="자료 메뉴" actions={[
        { label: '수정', icon: PencilIcon, onSelect: onEdit },
        { label: '링크 복사', icon: LinkIcon, onSelect: () => void copy() },
        { label: '삭제', icon: Trash2Icon, onSelect: () => setDeleting(true) },
      ]} />
    </div>}
    below={change.isError ? <Alert variant="destructive" className="shrink-0 rounded-none border-x-0 border-t-0">
      <TriangleAlertIcon /><AlertTitle>속성을 바꾸지 못했습니다. 화면의 값은 저장된 값입니다. 다시 골라 주세요.</AlertTitle>
    </Alert> : undefined}>
    <ResourceView resource={resource} onChange={patch => change.mutate(patch)} />
    <ConfirmDialog open={isDeleting} onOpenChange={setDeleting} title="자료를 삭제할까요?" description="삭제한 자료는 되돌릴 수 없습니다."
      action={{ label: '삭제', isPending: remove.isPending, onAction: () => remove.mutate() }} />
  </Page>;
}

/**
 * 자료의 본문과 속성(키트 DetailLayout). 폭은 틀이 자기 폭으로 판단하므로 좁으면 속성이 제목 아래 알약 줄로, 넓으면 오른쪽 칸으로 온다.
 * 바꿀 수 있는 값은 OptionPill, 읽기만 하는 값(작성자 · 수정일 · 첨부)은 InfoPill이다.
 */
function ResourceView({ resource, onChange }: { resource: Resource; onChange: (patch: Partial<Resource>) => void }) {
  return <DetailLayout label={resource.title} title={resource.title}
    head={<span className="text-sm text-muted-foreground">{collectionName(resource.collection)}</span>}
    sections={[
      { title: '속성', items: <>
        <OptionPill label="종류" icon={FileTextIcon} value={resource.kind} options={kinds.map(kind => ({ value: kind.id, label: kind.label, icon: <kind.icon /> }))}
          onChange={kind => onChange({ kind })} />
        <OptionPill label="컬렉션" icon={FolderIcon} value={resource.collection} options={collections.map(each => ({ value: each.id, label: each.name }))}
          onChange={collection => onChange({ collection })} />
      </> },
      { title: '정보', items: <>
        <InfoPill label="작성자" icon={<UserIcon />}>{resource.author}</InfoPill>
        <InfoPill label="수정일" icon={<CalendarIcon />}>{dateText(resource.updatedAt)}</InfoPill>
        {resource.files.length ? <InfoPill label="첨부" icon={<PaperclipIcon />}>{resource.files.length}개</InfoPill> : null}
      </> },
    ]}>
    {resource.url ? <a href={resource.url} target="_blank" rel="noreferrer" className="break-all text-sm underline underline-offset-4">{resource.url}</a> : null}
    <Body node={resource.body} />
  </DetailLayout>;
}

/** 읽기 본문: 저장한 문서를 그대로 읽는다. 본문의 앱 안 링크(다른 자료)는 새 탭 대신 그 화면으로 간다. */
function Body({ node }: { node: JSONContent }) {
  const navigate = useNavigate();
  return <RichBody value={node} readPreview={fakePreview} onNavigate={href => void navigate({ href })} />;
}
