import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { HStack } from '@astryxdesign/core/HStack';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import type { JSONContent } from '@tiptap/react';
import { RichDraft } from '@kit/composites/editor/RichDraft';
import { OptionPill, PropertyPill } from '@kit/composites/property/PropertyPill';
import { PageState } from '@kit/composites/state/PageState';
import { FileDropzone } from '@kit/composites/upload/FileDropzone';
import { icon } from '@kit/foundations/icons/solar-icon';
import { Page } from '@kit/layouts/page/Page';
import { ComposeForm } from '@kit/patterns/compose/ComposeForm';
import { ComposeSurface } from '@kit/patterns/compose/ComposeSurface';
import { useDraft } from '@kit/patterns/compose/draft-store';
import { focusFirstInvalid } from '@kit/patterns/compose/validation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { collections, kinds, resourceKeys, resourceQueries, useResourceApi, type NewResource, type Resource } from '../../entities/resource';

type Draft = { title: string; body?: JSONContent; kind?: Resource['kind']; collection?: string; url: string; files: string[] };
const empty: Draft = { title: '', kind: 'document', url: '', files: [] };

/** 새 자료와 수정을 같은 양식으로 쓴다. 수정은 저장한 값을 읽은 뒤 연다. */
export function ResourceCompose({ id, surface, onClose, onExpand, onDone }: {
  id?: string; surface: 'dialog' | 'page'; onClose: () => void; onExpand?: () => void; onDone: (id: string) => void;
}) {
  const api = useResourceApi();
  const query = useQuery({ ...resourceQueries.detail(api, id ?? ''), enabled: !!id });
  const crumbs = [{ label: '서가', href: '/resources', icon: 'library' as const }, { label: id ? '자료 수정' : '새 자료' }];
  if (id && query.isPending) return surface === 'page'
    ? <Page crumbs={crumbs} isDetail><Center height="100%"><Spinner label="자료를 불러오는 중" /></Center></Page> : null;
  if (id && query.isError) return <Page crumbs={crumbs} isDetail>
    <PageState kind="error" title="자료를 불러오지 못했습니다" action={<Button label="다시 시도" variant="secondary" onClick={() => void query.refetch()} />} />
  </Page>;
  const initial: Draft = query.data ? { title: query.data.title, body: query.data.body, kind: query.data.kind, collection: query.data.collection, url: query.data.url ?? '', files: query.data.files } : empty;
  return <ComposeBody key={id ?? 'new'} id={id} initial={initial} crumbs={crumbs} surface={surface} onClose={onClose} onExpand={onExpand} onDone={onDone} />;
}

function ComposeBody({ id, initial, crumbs, surface, onClose, onExpand, onDone }: {
  id?: string; initial: Draft; crumbs: { label: string; href?: string; icon?: 'library' }[]; surface: 'dialog' | 'page';
  onClose: () => void; onExpand?: () => void; onDone: (id: string) => void;
}) {
  const api = useResourceApi();
  const client = useQueryClient();
  const [draft, setDraft, clearDraft] = useDraft<Draft>(`resource:${id ?? 'new'}`, initial);
  const [isContinuing, setContinuing] = useState(false);
  const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });
  const save = useMutation({
    mutationFn: (input: NewResource) => id ? api.update(id, input) : api.create(input),
    onSuccess: saved => {
      void client.invalidateQueries({ queryKey: resourceKeys.all });
      if (isContinuing && !id) { setDraft({ ...empty, kind: draft.kind, collection: draft.collection }); return; }
      clearDraft();
      onDone(saved.id);
    },
  });
  const isDirty = JSON.stringify(draft) !== JSON.stringify(initial);
  // 제출 버튼은 막지 않는다. 처음 누른 뒤부터 빠진 값을 곁에 알리고 첫 번째로 초점을 옮긴다.
  const [isTried, setTried] = useState(false);
  const lacks = { title: !draft.title.trim(), collection: !draft.collection, url: draft.kind === 'link' && !draft.url.trim() };
  const lackedPills = [lacks.collection && '컬렉션', lacks.url && '주소'].filter(Boolean);
  const submit = () => {
    if (lacks.title || lacks.collection || lacks.url || !draft.kind || !draft.collection) { setTried(true); focusFirstInvalid(); return; }
    save.mutate({ title: draft.title.trim(), body: draft.body ?? { type: 'doc' }, kind: draft.kind,
      collection: draft.collection, url: draft.kind === 'link' ? draft.url.trim() : undefined, files: draft.files });
  };
  return <ComposeSurface surface={surface} crumbs={crumbs} isDirty={isDirty}
    isContinuing={id ? undefined : isContinuing} onContinuing={id ? undefined : setContinuing}
    onClose={() => { clearDraft(); onClose(); }} onExpand={onExpand}
    error={save.isError ? '저장하지 못했습니다. 입력한 내용은 그대로 있습니다.' : undefined}
    submit={{ label: id ? '저장' : '추가하기', isPending: save.isPending, onSubmit: submit }}>
    <ComposeForm isPage={surface === 'page'} title={draft.title} onTitle={title => set({ title })} titlePlaceholder="자료 제목"
      titleError={isTried && lacks.title ? '제목을 입력해 주세요.' : undefined}
      pillsError={isTried && lackedPills.length ? `필수 속성을 정해 주세요: ${lackedPills.join(', ')}` : undefined}
      body={<RichDraft value={draft.body} onChange={body => set({ body })} isPage={surface === 'page'} placeholder="무엇을 남길지 적어 보세요" />}
      pills={<>
        <OptionPill label="종류" icon="document" value={draft.kind} options={kinds.map(kind => ({ value: kind.id, label: kind.label, icon: icon(kind.icon) }))}
          onChange={kind => set({ kind: kind as Resource['kind'] })} />
        <OptionPill label="컬렉션" icon="folder" isRequired isInvalid={isTried && lacks.collection} value={draft.collection} options={collections.map(each => ({ value: each.id, label: each.name }))}
          onChange={collection => set({ collection })} />
        {draft.kind === 'link' ? <PropertyPill label="주소" icon={icon('link', !!draft.url)} isEmpty={!draft.url} isRequired isInvalid={isTried && lacks.url} text={draft.url} width="20rem"
          content={close => <VStack gap={2}>
            <TextInput label="주소" placeholder="https://" value={draft.url} hasAutoFocus onChange={url => set({ url })}
              onKeyDown={event => { if (event.key === 'Enter') close(); }} />
          </VStack>} /> : null}
        <PropertyPill label="첨부" icon={icon('attachment', draft.files.length > 0)} isEmpty={!draft.files.length} text={`첨부 ${draft.files.length}개`} width="20rem"
          content={() => <VStack gap={2}>
            <FileDropzone label="파일 올리기" multiple maxBytes={10 * 1024 ** 2} onPick={files => set({ files: [...draft.files, ...files.map(file => file.name)] })} />
            {draft.files.map(name => <HStack key={name} gap={2} vAlign="center" hAlign="between">
              <Text maxLines={1}>{name}</Text>
              <IconButton label={`${name} 빼기`} variant="ghost" size="sm" icon={icon('close')} onClick={() => set({ files: draft.files.filter(each => each !== name) })} />
            </HStack>)}
          </VStack>} />
      </>} />
  </ComposeSurface>;
}
