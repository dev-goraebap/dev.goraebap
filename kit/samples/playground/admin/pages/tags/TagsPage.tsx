import { Card } from '@astryxdesign/core/Card';
import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { HStack } from '@astryxdesign/core/HStack';
import { ListItem } from '@astryxdesign/core/List';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { AlertDialog } from '@kit/composites/dialog/AlertDialog';
import { FormDialog } from '@kit/composites/dialog/FormDialog';
import { RowMenu } from '@kit/composites/popup/RowMenu';
import { SearchTool } from '@kit/composites/search/SearchTool';
import { PageState } from '@kit/composites/state/PageState';
import { icon } from '@kit/foundations/icons/solar-icon';
import { useIsPhone } from '@kit/foundations/media';
import { Page } from '@kit/layouts/page/Page';
import { PageBanner, PageList } from '@kit/layouts/page/PageParts';
import { useAddressWords } from '@kit/patterns/list/list-address';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { useRef, useState } from 'react';
import { adminKeys, adminQueries, isRejection, tagColors, useAdminApi, type Tag, type TagColor } from '../../entities/admin';
import styles from './tags.module.css';

/** 태그 한 개의 색 점. 색 이름은 옆의 태그 이름이 전한다. */
export function TagDot({ color }: { color: TagColor }) {
  return <span className={styles.dot} data-color={color} aria-hidden="true" />;
}

/**
 * 태그 관리: 짧은 목록과 짧은 양식. 추가·이름 바꾸기는 목록 위 대화상자이고 열림은 주소(`edit`)가 가진다.
 * 지우기는 쓰인 곳이 없으면 바로, 있으면 그 수를 밝히는 확인 창을 거친다. 중복 이름은 서버가 거절하고 칸 곁에 알린다.
 * 상태 순서: 대기 → 실패 → 검색 결과 없음 → 빈 목록.
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
    if (query.isPending) return <Center height="100%"><Spinner label="태그를 불러오는 중" /></Center>;
    if (query.isError && !query.data) return <PageState kind="error" title="태그를 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
      action={<Button label="다시 시도" variant="secondary" onClick={() => void query.refetch()} />} />;
    if (tags.length === 0 && needle) return <PageState kind="search" title="조건에 맞는 태그가 없습니다" description="다른 이름으로 찾아 보세요."
      action={<Button label="검색어 지우기" variant="secondary" onClick={() => setWords('')} />} />;
    if (tags.length === 0) return <PageState kind="empty" title="아직 태그가 없습니다" description="문서와 이슈를 나눌 태그를 만들어 보세요."
      action={<Button label="태그 추가" variant="secondary" icon={icon('plus')} onClick={() => setEdit('new')} />} />;
    return <PageList hasDividers aria-label="태그">
      {tags.map(tag => <TagRow key={tag.id} tag={tag} onEdit={() => setEdit(tag.id)} onRemove={() => ask(tag)} />)}
    </PageList>;
  };
  return <Page crumbs={[{label:'태그',icon:'settings'}]}
    tools={<SearchTool label="태그 검색" placeholder="이름으로 찾기" value={words} onChange={setWords} />}
    create={{ label: '태그 추가', onClick: () => setEdit('new') }}>
    {remove.isError ? <PageBanner status="error" title="태그를 지우지 못했습니다" description="잠시 후 다시 시도해 주세요." /> : null}
    <div className={styles.column}><Card padding={0}>{content()}</Card></div>
    {edit === 'new' || editing ? <TagDialog key={edit} tag={editing} onClose={() => setEdit(undefined)} /> : null}
    <AlertDialog isOpen={!!removing} onOpenChange={open => { if (!open) setRemoving(null); }} title={`'${removing?.name ?? ''}' 태그를 지울까요?`}
      description={`이 태그가 쓰인 ${removing?.count ?? 0}개 항목에서 태그가 빠집니다. 지운 태그는 되돌릴 수 없습니다.`}
      actionLabel="지우기" isActionLoading={remove.isPending} onAction={() => removing && remove.mutate(removing)} />
  </Page>;
}

/** 색 점, 이름, 끝에 쓰인 수와 행 메뉴. 쓰인 수는 숫자 자리를 맞추고 단위를 붙인다. */
function TagRow({ tag, onEdit, onRemove }: { tag: Tag; onEdit: () => void; onRemove: () => void }) {
  const isPhone = useIsPhone();
  return <ListItem label={<Text weight="medium" maxLines={1}>{tag.name}</Text>} startContent={<TagDot color={tag.color} />}
    endContent={<HStack className={styles.rowEnd} gap={2} vAlign="center">
      <Text type="supporting" color="secondary" hasTabularNumbers textWrap="nowrap">{isPhone ? tag.count : `${tag.count}개 항목`}</Text>
      <RowMenu label={`${tag.name} 메뉴`} actions={[
        { id: 'rename', label: '이름 바꾸기', icon: 'edit', onSelect: onEdit },
        { id: 'delete', label: '지우기', icon: 'delete', onSelect: onRemove },
      ]} />
    </HStack>} />;
}

function ColorPicker({ value, onChange }: { value: TagColor; onChange: (color: TagColor) => void }) {
  return <VStack gap={2}>
    <Text weight="medium">색</Text>
    <fieldset className={styles.colors} aria-label="색">
      {tagColors.map(color => <button key={color.id} type="button" className={styles.swatch} data-color={color.id} aria-pressed={value === color.id}
        aria-label={color.label} title={color.label} onClick={() => onChange(color.id)}>
        <span className={styles.dot} data-color={color.id}>{value === color.id ? icon('check') : null}</span>
      </button>)}
    </fieldset>
  </VStack>;
}

/** 이름과 색 두 칸. 빈 이름은 제출에서 검사하고, 중복은 서버의 거절을 이름 칸 곁에 알린다. 저장 실패는 칸 아래에 둔다. */
function TagDialog({ tag, onClose }: { tag?: Tag; onClose: () => void }) {
  const api = useAdminApi();
  const client = useQueryClient();
  const [name, setName] = useState(tag?.name ?? '');
  const [color, setColor] = useState<TagColor>(tag?.color ?? 'blue');
  const [problem, setProblem] = useState<string>();
  const input = useRef<HTMLInputElement>(null);
  const save = useMutation({
    mutationFn: () => (tag ? api.tags.update(tag.id, { name: name.trim(), color }) : api.tags.create({ name: name.trim(), color })),
    onSuccess: () => { void client.invalidateQueries({ queryKey: adminKeys.tags }); onClose(); },
    onError: error => { if (isRejection(error)) { setProblem(`'${error.value}' 태그가 이미 있습니다.`); input.current?.focus(); } },
  });
  const submit = () => {
    if (!name.trim()) { setProblem('태그 이름을 입력해 주세요.'); input.current?.focus(); return; }
    if (name.trim().length > 20) { setProblem('이름은 20자까지 쓸 수 있습니다.'); input.current?.focus(); return; }
    setProblem(undefined);
    save.mutate();
  };
  return <FormDialog title={tag ? '태그 이름 바꾸기' : '새 태그'} submitLabel={tag ? '저장' : '추가하기'} isPending={save.isPending}
    error={save.isError && !isRejection(save.error) ? '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.' : undefined}
    width="26rem" onSubmit={submit} onClose={onClose}>
    <TextInput ref={input} label="이름" value={name} hasAutoFocus onChange={value => { setName(value); setProblem(undefined); }}
      status={problem ? { type: 'error', message: problem } : undefined} />
    <ColorPicker value={color} onChange={setColor} />
  </FormDialog>;
}
