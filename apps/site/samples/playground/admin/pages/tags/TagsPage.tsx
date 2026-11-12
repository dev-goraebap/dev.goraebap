import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useAddressWords } from '@/shared/lib/list-address';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { cn } from '@/shared/lib/utils';
import { ActionMenu } from '@/shared/ui/action-menu';
import { Alert, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from '@/shared/ui/field';
import { FormDialog } from '@/shared/ui/form-dialog';
import { CheckIcon, PencilIcon, TagIcon, Trash2Icon, TriangleAlertIcon } from '@/shared/ui/icon';
import { Input } from '@/shared/ui/input';
import { Page } from '@/shared/ui/page';
import { PageState } from '@/shared/ui/page-state';
import { SearchTool } from '@/shared/ui/search-tool';
import { Spinner } from '@/shared/ui/spinner';
import { adminKeys, adminQueries, isRejection, tagColors, useAdminApi, type Tag, type TagColor } from '../../entities/admin';

/** 태그 색은 업무 데이터의 분류 색이다. 테마 색과 따로 두되, 키트의 분류 색 토큰(일정 분류 색, 라이트 · 다크 쌍)을 쓴다. */
const tone: Record<TagColor, string> = {
  red: 'bg-event-red ring-event-red-foreground/40', orange: 'bg-event-orange ring-event-orange-foreground/40',
  green: 'bg-event-green ring-event-green-foreground/40', blue: 'bg-event-blue ring-event-blue-foreground/40',
  purple: 'bg-event-purple ring-event-purple-foreground/40', gray: 'bg-event-gray ring-event-gray-foreground/40',
};
const ink: Record<TagColor, string> = {
  red: 'text-event-red-foreground', orange: 'text-event-orange-foreground', green: 'text-event-green-foreground',
  blue: 'text-event-blue-foreground', purple: 'text-event-purple-foreground', gray: 'text-event-gray-foreground',
};

/** 태그 한 개의 색 점. 색 이름은 옆의 태그 이름이 전한다. */
export function TagDot({ color, className }: { color: TagColor; className?: string }) {
  return <span aria-hidden="true" className={cn('grid size-3 shrink-0 place-items-center rounded-full ring-1 ring-inset', tone[color], className)} />;
}

/**
 * 태그 관리: 짧은 목록과 짧은 양식. 추가 · 이름 바꾸기는 목록 위 짧은 양식(키트 FormDialog: 데스크톱 대화상자, 휴대폰 바텀시트)이고
 * 열림은 주소(`edit`)가 가진다. 지우기는 쓰인 곳이 없으면 바로, 있으면 그 수를 밝히는 확인 창을 거친다. 중복 이름은 서버가 거절하고
 * 칸 곁에 알린다. 상태 순서: 대기 → 실패 → 검색 결과 없음 → 빈 목록.
 */
export function TagsPage() {
  const api = useAdminApi();
  const client = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const search = location.search as Record<string, unknown>;
  const [words, setWords] = useAddressWords('q');
  const query = useQuery(adminQueries.tags(api));
  const [removing, setRemoving] = useState<Tag | null>(null);
  const edit = typeof search.edit === 'string' ? search.edit : undefined;
  const setEdit = (value?: string) => void navigate({ to: location.pathname, search: { ...search, edit: value } as never });
  const remove = useMutation({
    mutationFn: (tag: Tag) => api.tags.remove(tag.id),
    onSuccess: () => setRemoving(null),
    onSettled: () => client.invalidateQueries({ queryKey: adminKeys.tags }),
  });
  const needle = words.trim().toLowerCase();
  const tags = [...(query.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'ko')).filter(tag => !needle || tag.name.toLowerCase().includes(needle));
  const editing = edit && edit !== 'new' ? query.data?.find(tag => tag.id === edit) : undefined;
  const ask = (tag: Tag) => { if (tag.count > 0) setRemoving(tag); else remove.mutate(tag); };
  const content = () => {
    if (query.isPending) return <div className="flex flex-1 items-center justify-center"><Spinner aria-label="태그를 불러오는 중" className="size-6 text-muted-foreground" /></div>;
    if (query.isError && !query.data) return <PageState kind="error" title="태그를 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
      action={<Button variant="secondary" onClick={() => void query.refetch()}>다시 시도</Button>} />;
    if (tags.length === 0 && needle) return <PageState kind="search" title="조건에 맞는 태그가 없습니다" description="다른 이름으로 찾아 보세요."
      action={<Button variant="secondary" onClick={() => setWords('')}>검색어 지우기</Button>} />;
    if (tags.length === 0) return <PageState kind="empty" title="아직 태그가 없습니다" description="문서와 이슈를 나눌 태그를 만들어 보세요."
      action={<Button variant="secondary" onClick={() => setEdit('new')}>태그 추가</Button>} />;
    return <div className="mx-auto w-full max-w-180 px-4 py-8 max-md:px-0 max-md:py-0">
      <ul aria-label="태그" className="divide-y overflow-hidden bg-background md:rounded-xl md:ring-1 md:ring-foreground/10">
        {tags.map(tag => <TagRow key={tag.id} tag={tag} onEdit={() => setEdit(tag.id)} onRemove={() => ask(tag)} />)}
      </ul>
    </div>;
  };
  return <Page crumbs={[{ label: '태그', icon: TagIcon }]}
    tools={<SearchTool label="태그 검색" placeholder="이름으로 찾기" value={words} onChange={setWords} />}
    below={remove.isError ? <Alert variant="destructive" className="shrink-0 rounded-none border-x-0 border-t-0">
      <TriangleAlertIcon /><AlertTitle>태그를 지우지 못했습니다. 잠시 후 다시 시도해 주세요.</AlertTitle>
    </Alert> : undefined}
    create={{ label: '태그 추가', onClick: () => setEdit('new') }}>
    {content()}
    {edit === 'new' || editing ? <TagDialog key={edit} tag={editing} onClose={() => setEdit(undefined)} /> : null}
    <ConfirmDialog open={!!removing} onOpenChange={open => { if (!open) setRemoving(null); }} title={`'${removing?.name ?? ''}' 태그를 지울까요?`}
      description={`이 태그가 쓰인 ${removing?.count ?? 0}개 항목에서 태그가 빠집니다. 지운 태그는 되돌릴 수 없습니다.`}
      action={{ label: '지우기', isPending: remove.isPending, onAction: () => { if (removing) remove.mutate(removing); } }} />
  </Page>;
}

/** 색 점, 이름, 끝에 쓰인 수와 줄 메뉴. 쓰인 수는 숫자 자리를 맞추고 단위를 붙인다(휴대폰은 수만). */
function TagRow({ tag, onEdit, onRemove }: { tag: Tag; onEdit: () => void; onRemove: () => void }) {
  const isMobile = useIsMobile();
  return <li className="flex min-h-12 items-center gap-3 px-4 py-1.5 max-md:min-h-14">
    <TagDot color={tag.color} />
    <span className="min-w-0 flex-1 truncate font-medium">{tag.name}</span>
    <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground tabular-nums">{isMobile ? tag.count : `${tag.count}개 항목`}</span>
    <ActionMenu size="row" label={`${tag.name} 메뉴`} title={tag.name} actions={[
      { label: '이름 바꾸기', icon: PencilIcon, onSelect: onEdit },
      { label: '지우기', icon: Trash2Icon, onSelect: onRemove },
    ]} />
  </li>;
}

/** 색 고르기: 고른 색은 안쪽 체크와 바깥 고리로 보인다. 휴대폰은 44px 자리. */
function ColorPicker({ value, onChange }: { value: TagColor; onChange: (color: TagColor) => void }) {
  return <FieldSet className="gap-2">
    <FieldLegend variant="label">색</FieldLegend>
    <div className="flex flex-wrap gap-2">
      {tagColors.map(color => <button key={color.id} type="button" aria-pressed={value === color.id} aria-label={color.label} title={color.label}
        onClick={() => onChange(color.id)}
        className="relative grid size-8 place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:ring-2 aria-pressed:ring-foreground max-md:size-11">
        <TagDot color={color.id} className={cn('size-6 max-md:size-8', ink[color.id])} />
        {value === color.id ? <CheckIcon className={cn('absolute size-4', ink[color.id])} /> : null}
      </button>)}
    </div>
  </FieldSet>;
}

/** 이름과 색 두 칸. 빈 이름은 제출에서 검사하고, 중복은 서버의 거절을 이름 칸 곁에 알린다. 저장 실패는 칸 아래에 둔다. */
function TagDialog({ tag, onClose }: { tag?: Tag; onClose: () => void }) {
  const api = useAdminApi();
  const client = useQueryClient();
  const [name, setName] = useState(tag?.name ?? '');
  const [color, setColor] = useState<TagColor>(tag?.color ?? 'blue');
  const [problem, setProblem] = useState<string>();
  const focusName = () => requestAnimationFrame(() => document.getElementById('tag-name')?.focus());
  const save = useMutation({
    mutationFn: () => (tag ? api.tags.update(tag.id, { name: name.trim(), color }) : api.tags.create({ name: name.trim(), color })),
    onSuccess: () => { void client.invalidateQueries({ queryKey: adminKeys.tags }); onClose(); },
    onError: error => { if (isRejection(error)) { setProblem(`'${error.value}' 태그가 이미 있습니다.`); focusName(); } },
  });
  const submit = () => {
    if (!name.trim()) { setProblem('태그 이름을 입력해 주세요.'); focusName(); return; }
    if (name.trim().length > 20) { setProblem('이름은 20자까지 쓸 수 있습니다.'); focusName(); return; }
    setProblem(undefined);
    save.mutate();
  };
  return <FormDialog open onOpenChange={open => { if (!open) onClose(); }} title={tag ? '태그 이름 바꾸기' : '새 태그'} submitLabel={tag ? '저장' : '추가하기'}
    isPending={save.isPending} onSubmit={submit}>
    <Field data-invalid={problem ? true : undefined}>
      <FieldLabel htmlFor="tag-name">이름</FieldLabel>
      <Input id="tag-name" value={name} autoFocus autoComplete="off" aria-invalid={problem ? true : undefined}
        onChange={event => { setName(event.target.value); setProblem(undefined); }} />
      {problem ? <FieldError>{problem}</FieldError> : null}
    </Field>
    <ColorPicker value={color} onChange={setColor} />
    {save.isError && !isRejection(save.error) ? <p role="alert" className="text-sm text-destructive">저장하지 못했습니다. 잠시 후 다시 시도해 주세요.</p> : null}
  </FormDialog>;
}
