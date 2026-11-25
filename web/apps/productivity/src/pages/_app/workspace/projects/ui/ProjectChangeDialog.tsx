import { useState } from 'react';
import type { Project, ProjectChange } from '@/entities/project';
import { Field, FieldLabel } from '@goraebap/ui-react/components/field';
import { FormDialog } from '@/shared/ui/kit/form-dialog';
import { Input } from '@goraebap/ui-react/compact/input';

/** What each change asks before it is made (client/'s words). */
const ASKS: Record<ProjectChange, { title: string; description: string; confirm: string }> = {
  archive: { title: '프로젝트를 보관할까요?', description: '보관한 프로젝트는 읽기만 되고 설정을 고칠 수 없습니다. 보관함 탭에서 되돌릴 수 있습니다.', confirm: '보관' },
  unarchive: { title: '보관을 풀까요?', description: '진행 중 목록과 메뉴로 돌아오고 설정을 다시 고칠 수 있습니다.', confirm: '보관 해제' },
  delete: {
    title: '프로젝트를 삭제할까요?', confirm: '프로젝트 삭제',
    description: '목록과 메뉴에서 사라집니다. 이 프로젝트를 가리키던 일정 · 회의록 · 연장근무에는 이름이 그대로 보이고, 삭제됨 탭에서 되살릴 수 있습니다.',
  },
  restore: { title: '프로젝트를 되살릴까요?', description: '삭제하기 전의 자리로 돌아옵니다.', confirm: '되살리기' },
};

/**
 * Asks before a project is archived, brought back, deleted (its key typed to be sure) or restored. A short form rather than
 * ConfirmDialog, because deleting asks for the key: Enter in the box confirms as the button does.
 */
export function ProjectChangeDialog({ project, change, isPending, error, onConfirm, onClose }: {
  project: Project; change: ProjectChange; isPending: boolean; error: Error | null; onConfirm: () => void; onClose: () => void;
}) {
  const [word, setWord] = useState('');
  const ask = ASKS[change];
  const isDelete = change === 'delete';
  const isReady = !isDelete || word.trim().toUpperCase() === project.key;
  return (
    <FormDialog open onOpenChange={open => { if (!open) onClose(); }} title={ask.title} description={project.name} submitLabel={ask.confirm}
      isDestructive={isDelete} isPending={isPending} isSubmitDisabled={!isReady} onSubmit={onConfirm}>
      <p className="text-sm text-muted-foreground">{ask.description}</p>
      {isDelete ? (
        <Field>
          <FieldLabel htmlFor="project-change-key">{`확인을 위해 키 ${project.key}를 적어 주세요`}</FieldLabel>
          <Input id="project-change-key" placeholder={project.key} value={word} autoFocus autoComplete="off" disabled={isPending}
            onChange={event => setWord(event.target.value)} />
        </Field>
      ) : null}
      {error ? <p role="alert" className="text-sm text-destructive">{error.message}</p> : null}
    </FormDialog>
  );
}
