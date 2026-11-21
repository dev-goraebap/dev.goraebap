import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Suspense, useId, useState } from 'react';
import {
  PROJECT_KEY, PROJECT_NAME_MAX, editProject, isProjectError, refreshProjects, type Project, type ProjectDraft,
} from '@/entities/project';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/kit/alert';
import { Button } from '@/shared/ui/kit/button';
import { Field, FieldContent, FieldLabel, FieldTitle } from '@/shared/ui/kit/field';
import { InfoIcon, TriangleAlertIcon } from '@/shared/ui/kit/icon';
import { Input } from '@/shared/ui/kit/input';
import { SettingsRow, SettingsSection } from '@/shared/ui/kit/settings';
import { Spinner } from '@/shared/ui/kit/spinner';
import { MarkNameField } from '@/shared/ui/mark-picker';
import { MarkdownRead } from '@/shared/ui/rich-body';
import { useMarkdownDraft } from '@/shared/ui/rich-body/markdown-draft';
import { ProjectDescriptionEditor } from './ProjectDescriptionEditor';

const DESCRIPTION_MAX = 20_000;

const draftOf = (project: Project): ProjectDraft => ({
  key: project.key, name: project.name, description: project.description ?? '', icon: project.icon ?? null, color: project.color ?? null,
});

/**
 * The project's details as one form, saved over the version it started from, so a change someone made meanwhile is not
 * written over (the latest is offered to start again from); a key another project has or had is said under the key. A
 * changed key moves the page to the project's new address (the old one still opens the project).
 */
export function ProjectGeneralForm({ project }: { project: Project }) {
  const client = useQueryClient();
  const navigate = useNavigate();
  const keyId = useId();
  const [base, setBase] = useState(project);
  const [draft, setDraft] = useState(() => draftOf(project));
  const [isChecked, setChecked] = useState(false);
  const [editorRevision, setEditorRevision] = useState(0);
  const description = useMarkdownDraft(base.description ?? '');
  const resetEditor = () => { description.reset(); setEditorRevision(current => current + 1); };
  const save = useMutation({ mutationFn: async (next: ProjectDraft) => {
    const prepared = { ...next, description: await description.write(DESCRIPTION_MAX, '프로젝트 설명') };
    await editProject(base, prepared);
    return prepared;
  }, onSettled: () => refreshProjects(client) });
  const isReadOnly = !!project.archivedAt || !!project.deletedAt;
  const isConflict = isProjectError(save.error, 'PROJECT_VERSION_CONFLICT');
  const isKeyTaken = isProjectError(save.error, 'PROJECT_KEY_CONFLICT');
  const nameError = isChecked && !draft.name.trim() ? '프로젝트 이름을 입력해 주세요.' : undefined;
  const keyError = isChecked && !PROJECT_KEY.test(draft.key) ? '키는 영문 대문자 · 숫자 2~10자로 적어 주세요.'
    : isKeyTaken ? '다른 프로젝트가 쓰거나 썼던 키입니다. 다른 키를 적어 주세요.' : undefined;
  const isChanged = description.isChanged || JSON.stringify(draftOf(base)) !== JSON.stringify(draft);
  const change = (patch: Partial<ProjectDraft>) => { if (save.error && !isConflict) save.reset(); setDraft({ ...draft, ...patch }); };
  const submit = () => {
    setChecked(true);
    if (isReadOnly || description.isPending || description.error || !draft.name.trim() || !PROJECT_KEY.test(draft.key)) return;
    save.mutate(draft, {
      onSuccess: saved => {
        setChecked(false);
        setDraft(saved);
        setBase({ ...base, ...saved, icon: saved.icon ?? undefined, color: saved.color ?? undefined, version: base.version + 1 });
        resetEditor();
        if (draft.key !== base.key) void navigate({ href: `/workspace/projects/${draft.key}/settings/general`, replace: true });
      },
    });
  };
  const restart = () => { setBase(project); setDraft(draftOf(project)); resetEditor(); setChecked(false); save.reset(); };
  const other = save.error && !isConflict && !isKeyTaken ? save.error.message : undefined;
  return <div className="flex flex-col gap-4">
    {isReadOnly ? <Alert role="status">
      <InfoIcon />
      <AlertTitle>{project.deletedAt ? '삭제한 프로젝트입니다' : '보관한 프로젝트입니다'}</AlertTitle>
      <AlertDescription>{project.deletedAt ? '되살리면 설정을 다시 고칠 수 있습니다.' : '보관을 풀면 설정을 다시 고칠 수 있습니다.'}</AlertDescription>
    </Alert> : null}
    {isConflict ? <Alert>
      <TriangleAlertIcon className="text-mark-high" />
      <AlertTitle>다른 사람이 먼저 고쳤습니다</AlertTitle>
      <AlertDescription>저장하지 않았습니다. 최신 내용을 불러온 뒤 다시 고쳐 주세요.</AlertDescription>
      <div className="col-start-2 mt-1.5"><Button variant="secondary" size="sm" onClick={restart}>최신 내용 불러오기</Button></div>
    </Alert> : null}
    <SettingsSection title="프로젝트 정보">
      <SettingsRow wide label="프로젝트 기본정보">
        <div className="flex flex-col gap-1 @md/field-group:w-80">
          <MarkNameField
            mark={{ label: '프로젝트 표식', value: { icon: draft.icon ?? 'projects', color: draft.color ?? null },
              isDisabled: isReadOnly, onChange: mark => change({ icon: mark.icon, color: mark.color }) }}
            input={{ label: '프로젝트 이름', placeholder: '예: 고객 포털 개편', value: draft.name, isDisabled: isReadOnly, 'aria-invalid': !!nameError,
              onChange: name => change({ name: name.slice(0, PROJECT_NAME_MAX) }) }} />
          {nameError ? <p role="alert" className="text-sm text-destructive">{nameError}</p> : null}
        </div>
      </SettingsRow>
      <SettingsRow wide label="키">
        <div className="flex flex-col gap-1 @md/field-group:w-80">
          <Input id={keyId} aria-label="키" placeholder="APP" value={draft.key} disabled={isReadOnly} aria-invalid={!!keyError || undefined}
            className="font-mono max-md:h-11" onChange={event => change({ key: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) })} />
          {keyError ? <p role="alert" className="text-sm text-destructive">{keyError}</p> : null}
        </div>
      </SettingsRow>
      <Field className="p-3">
        <FieldContent>
          <FieldLabel><FieldTitle>설명</FieldTitle></FieldLabel>
        </FieldContent>
        {isReadOnly ? (base.description?.trim() ? <MarkdownRead value={base.description} label="프로젝트 설명" /> : null) : <div className="min-h-32 rounded-lg border px-3 py-2">
          <Suspense fallback={null}>
            <ProjectDescriptionEditor draft={description} draftId={`project-description-${editorRevision}`} />
          </Suspense>
        </div>}
      </Field>
      {other ? <p role="alert" className="p-3 text-sm text-destructive">{other}</p> : null}
    </SettingsSection>
    {isReadOnly ? null : <div className="flex justify-end gap-2 max-md:*:h-11 max-md:*:flex-1">
      <Button variant="secondary" disabled={!isChanged || save.isPending} onClick={restart}>되돌리기</Button>
      <Button disabled={!isChanged || description.isPending || !!description.error || save.isPending} onClick={submit}>
        {save.isPending ? <Spinner data-icon="inline-start" /> : null}변경 저장
      </Button>
    </div>}
  </div>;
}
