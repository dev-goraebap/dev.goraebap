import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { JSONContent } from '@tiptap/react';
import { useState } from 'react';
import { focusFirstInvalid } from '@/shared/lib/focus-invalid';
import { carryDraft, useCarriedDraft } from '@/shared/lib/panel';
import { ComposeSurface, FileDropzone, FileList, MB } from '@/shared/ui/compose';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { RichDraft } from '@/shared/ui/editor';
import { FileTextIcon, FolderIcon, LibraryIcon, LinkIcon, PaperclipIcon } from '@/shared/ui/icon';
import { Input } from '@/shared/ui/input';
import { OptionPill, PropertyPill } from '@/shared/ui/property-pill';
import { collections, kinds, plainText, resourceKeys, useResourceApi, type Resource } from '../../entities/resource';

type Draft = { title: string; body?: JSONContent; kind: Resource['kind']; collection?: string; url: string; files: File[] };
const empty: Draft = { title: '', kind: 'document', url: '', files: [] };
const CARRY = 'resource:new';
const crumbs = [{ label: '서가', href: '/resources', icon: LibraryIcon }, { label: '새 자료' }];

/**
 * 새 자료 양식(키트 ComposeSurface): 데스크톱에서 목록의 버튼으로 열면 목록 위 대화상자, 작성 페이지 · 크게 보기 · 휴대폰은 자기 페이지.
 * 크게 보기는 쓰던 내용(고른 파일까지)을 페이지로 넘긴다(키트 carryDraft). 고친 것이 있는데 닫으면 버릴지 먼저 묻는다
 * (키트 양식은 묻지 않고 닫으므로 이 앱이 확인을 덧붙인다). 제출 버튼은 막지 않고, 처음 누른 뒤부터 빠진 값을 칸 곁에 알린다.
 */
export function ResourceCompose({ surface, onClose, onExpand, onDone }: {
  surface: 'dialog' | 'page'; onClose: () => void; onExpand?: () => void; onDone: (id: string) => void;
}) {
  const api = useResourceApi();
  const client = useQueryClient();
  const carried = useCarriedDraft<Draft>(CARRY);
  const [draft, setDraft] = useState<Draft>(() => carried ?? empty);
  const set = (patch: Partial<Draft>) => setDraft(current => ({ ...current, ...patch }));
  const [isTried, setTried] = useState(false);
  const [isLeaving, setLeaving] = useState(false);
  const save = useMutation({
    mutationFn: () => api.create({ title: draft.title.trim(), body: draft.body ?? { type: 'doc' }, kind: draft.kind, collection: draft.collection!,
      url: draft.kind === 'link' ? draft.url.trim() : undefined, files: draft.files.map(file => file.name) }),
    onSuccess: saved => {
      void client.invalidateQueries({ queryKey: resourceKeys.all });
      onDone(saved.id);
    },
  });
  // 본문 칸은 처음 그릴 때 빈 문서를 알려 오므로 본문은 글자로 비교한다.
  const isDirty = !!(draft.title.trim() || plainText(draft.body).trim() || draft.collection || draft.url.trim() || draft.files.length || draft.kind !== empty.kind);
  const lacks = { title: !draft.title.trim(), collection: !draft.collection, url: draft.kind === 'link' && !draft.url.trim() };
  const lackedPills = [lacks.collection && '컬렉션', lacks.url && '주소'].filter(Boolean);
  const submit = () => {
    if (lacks.title || lacks.collection || lacks.url) { setTried(true); focusFirstInvalid(); return; }
    save.mutate();
  };
  const leave = onClose;
  return <>
    <ComposeSurface surface={surface} crumbs={crumbs} onClose={() => (isDirty ? setLeaving(true) : leave())} onExpand={onExpand && (() => { carryDraft(CARRY, draft); onExpand(); })}
      error={save.isError ? '저장하지 못했습니다. 입력한 내용은 그대로 있습니다.' : undefined}
      submit={{ label: '추가하기', isPending: save.isPending, onSubmit: submit }}
      pills={<>
        <OptionPill label="종류" icon={FileTextIcon} value={draft.kind} options={kinds.map(kind => ({ value: kind.id, label: kind.label, icon: <kind.icon /> }))}
          onChange={kind => set({ kind })} />
        <OptionPill label="컬렉션" icon={FolderIcon} value={draft.collection} options={collections.map(each => ({ value: each.id, label: each.name }))}
          onChange={collection => set({ collection })} />
        {draft.kind === 'link' ? <PropertyPill label="주소" icon={<LinkIcon />} text={draft.url || undefined} width="w-80">
          {close => <div className="p-1.5">
            <Input aria-label="주소" placeholder="https://" value={draft.url} autoFocus onChange={event => set({ url: event.target.value })}
              onKeyDown={event => { if (event.key === 'Enter') close(); }} />
          </div>}
        </PropertyPill> : null}
        <PropertyPill label="첨부" icon={<PaperclipIcon />} text={draft.files.length ? `첨부 ${draft.files.length}개` : undefined} width="w-88">
          {() => <div className="flex flex-col gap-2 p-1">
            <FileDropzone label="파일 올리기" isMultiple maxBytes={10 * MB} onPick={files => set({ files: [...draft.files, ...files] })} />
            <FileList label="첨부" files={draft.files} onRemove={file => set({ files: draft.files.filter(each => each !== file) })} />
          </div>}
        </PropertyPill>
        {/* 빠진 속성의 안내는 알약 곁(다음 줄)에 둔다. 바닥 줄에는 동작만 있다. */}
        {isTried && lackedPills.length ? <p role="alert" className="basis-full text-sm text-destructive">필수 속성을 정해 주세요: {lackedPills.join(', ')}</p> : null}
      </>}>
      <input aria-label="제목" placeholder="자료 제목" autoFocus autoComplete="off" value={draft.title} onChange={event => set({ title: event.target.value })}
        aria-invalid={isTried && lacks.title ? true : undefined} aria-describedby={isTried && lacks.title ? 'resource-title-error' : undefined}
        className="w-full bg-transparent text-lg leading-snug font-semibold outline-none placeholder:text-muted-foreground/70 group-data-page/compose:text-2xl" />
      {isTried && lacks.title ? <p id="resource-title-error" className="-mt-2 text-sm text-destructive">제목을 입력해 주세요.</p> : null}
      <RichDraft value={draft.body} onChange={body => set({ body })} isPage={surface === 'page'} placeholder="무엇을 남길지 적어 보세요" />
    </ComposeSurface>
    <ConfirmDialog open={isLeaving} onOpenChange={setLeaving} title="작성 중인 내용을 버릴까요?"
      description="지금 닫으면 쓰던 제목과 본문, 고른 속성이 사라집니다."
      action={{ label: '버리기', onAction: () => { setLeaving(false); leave(); } }} />
  </>;
}
