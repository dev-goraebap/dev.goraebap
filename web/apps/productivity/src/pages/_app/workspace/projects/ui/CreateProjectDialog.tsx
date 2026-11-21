import { useMutation } from '@tanstack/react-query';
import { Suspense, useState } from 'react';
import { createProject, isProjectError, keyFrom, PROJECT_KEY, PROJECT_NAME_MAX, type ProjectDraft } from '@/entities/project';
import type { JSONNode } from '@/shared/lib/rich-document';
import { ComposeSurface } from '@/shared/ui/kit/compose';
import { Field, FieldDescription, FieldLabel } from '@/shared/ui/kit/field';
import { HashtagIcon, ProjectsIcon } from '@/shared/ui/kit/icon';
import { Input } from '@/shared/ui/kit/input';
import { MarkPicker } from '@/shared/ui/mark-picker';
import { PropertyPill } from '@/shared/ui/kit/property-pill';
import { RichDraft } from '@/shared/ui/rich-body';
import { writeMarkdownDraft } from '@/shared/ui/rich-body/markdown-draft';
import { Spinner } from '@/shared/ui/kit/spinner';

/**
 * 새 프로젝트 (client/'s CreateProjectDialog) on the paper of every new thing: the name in the title's place, the
 * description as the body, and the key as a pill, offered from the name until it is typed. A problem is said at the
 * foot once the member tries to make it, a key another project has or had among them; the maker joins the new project.
 * Its mark (an icon and colour) is picked over the name, as a new document's is; the projects' icon until one is.
 */
export function CreateProjectDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (key: string) => void }) {
  const [draft, setDraft] = useState<ProjectDraft>({ key: '', name: '', description: '' });
  const [body, setBody] = useState<JSONNode>();
  const [isKeyTyped, setKeyTyped] = useState(false);
  const [isChecked, setChecked] = useState(false);
  const [takenKey, setTakenKey] = useState('');
  const create = useMutation({ mutationFn: async (project: ProjectDraft) =>
    createProject({ ...project, description: await writeMarkdownDraft(body, '', 20_000, '프로젝트 설명') }), onSuccess: onCreated });
  const shown = isKeyTyped ? draft : { ...draft, key: keyFrom(draft.name) };
  const keyError = !PROJECT_KEY.test(shown.key) ? '키는 영문 대문자 · 숫자 2~10자로 적어 주세요.'
    : shown.key === takenKey ? '다른 프로젝트가 쓰거나 썼던 키입니다. 다른 키를 적어 주세요.' : undefined;
  const submit = () => {
    setChecked(true);
    if (!shown.name.trim() || keyError) return;
    create.mutate(shown, { onError: error => { if (isProjectError(error, 'PROJECT_KEY_CONFLICT')) setTakenKey(shown.key); } });
  };
  const change = (patch: Partial<ProjectDraft>) => setDraft({ ...shown, key: isKeyTyped ? shown.key : draft.key, ...patch });
  // The key's conflict is said with the key's own problem; anything else as it comes.
  const error = isChecked && keyError ? keyError
    : create.error && !isProjectError(create.error, 'PROJECT_KEY_CONFLICT') ? create.error.message : undefined;
  return (
    <ComposeSurface surface="dialog" crumbs={[{ label: '새 프로젝트', icon: ProjectsIcon }]}
      onClose={() => { if (!create.isPending) onClose(); }} error={error}
      submit={{ label: '프로젝트 만들기', isDisabled: !shown.name.trim(), isPending: create.isPending, onSubmit: submit }}
      pills={
        <PropertyPill label="키" icon={<HashtagIcon />} text={shown.key ? `키 ${shown.key}` : undefined} isRequired isInvalid={isChecked && !!keyError} width="w-72">
          {() => (
            <Field className="p-1.5">
              <FieldLabel htmlFor="new-project-key">키</FieldLabel>
              <Input id="new-project-key" value={shown.key} placeholder="APP" autoFocus autoComplete="off"
                onChange={event => { setKeyTyped(true); setDraft({ ...shown, key: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) }); }} />
              <FieldDescription>영문 대문자 · 숫자 2~10자입니다. 업무 번호가 {shown.key || 'APP'}-1처럼 붙습니다.</FieldDescription>
            </Field>
          )}
        </PropertyPill>
      }>
      <div className="flex">
        <MarkPicker label="프로젝트 표식" value={{ icon: shown.icon ?? 'projects', color: shown.color ?? null }}
          onChange={mark => change({ icon: mark.icon, color: mark.color })} />
      </div>
      <input aria-label="제목" placeholder="프로젝트 이름" autoFocus autoComplete="off" value={shown.name}
        onChange={event => change({ name: event.target.value.slice(0, PROJECT_NAME_MAX) })}
        className="w-full bg-transparent text-lg leading-snug font-semibold outline-none placeholder:text-muted-foreground/70 group-data-page/compose:text-2xl" />
      <div className="min-h-14 group-data-page/compose:min-h-48">
        <Suspense fallback={<Spinner aria-label="편집기를 불러오는 중" />}>
          <RichDraft id="new-project-description" isMarkdownDraft value={body} onChange={setBody} placeholder="프로젝트가 하는 일과 목표" />
        </Suspense>
      </div>
    </ComposeSurface>
  );
}
