import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useId, useState } from 'react';
import { changeProject, refreshProjects, type Project, type ProjectChange } from '@/entities/project';
import { Button } from '@goraebap/ui-react/compact/button';
import { ConfirmDialog } from '@/shared/ui/kit/confirm-dialog';
import { Field, FieldLabel } from '@goraebap/ui-react/components/field';
import { FormDialog } from '@/shared/ui/kit/form-dialog';
import { Input } from '@goraebap/ui-react/compact/input';
import { SettingsRow, SettingsSection } from '@/shared/ui/kit/settings';

const ASK: Record<ProjectChange, { title: string; label: string; description: string }> = {
  archive: { title: '프로젝트를 보관할까요?', label: '보관', description: '진행 중 목록과 메뉴에서 빠지고 읽기만 됩니다. 보관함에서 되돌릴 수 있습니다.' },
  unarchive: { title: '보관을 풀까요?', label: '보관 해제', description: '진행 중 목록과 메뉴로 돌아오고 설정을 다시 고칠 수 있습니다.' },
  delete: { title: '프로젝트를 삭제할까요?', label: '프로젝트 삭제', description: '삭제한 프로젝트는 프로젝트 목록의 삭제됨 탭에서 되살릴 수 있습니다.' },
  restore: { title: '프로젝트를 되살릴까요?', label: '되살리기', description: '삭제하기 전의 자리로 돌아오고 목록과 메뉴에 다시 보입니다.' },
};

/**
 * The danger zone (client/'s DangerZone): 보관 or 보관 해제, and 삭제 with the project's key typed, each asked first; a
 * deleted project offers 되살리기 alone. Deleting leaves for the projects' list, where the project is gone.
 */
export function ProjectDangerZone({ project }: { project: Project }) {
  const client = useQueryClient();
  const navigate = useNavigate();
  const keyId = useId();
  const [asking, setAsking] = useState<ProjectChange | null>(null);
  const [typed, setTyped] = useState('');
  const run = useMutation({
    mutationFn: (change: ProjectChange) => changeProject(project, change),
    onSuccess: (_, change) => { setAsking(null); if (change === 'delete') void navigate({ href: '/workspace/projects' }); },
    onSettled: () => refreshProjects(client),
  });
  const ask = (change: ProjectChange) => { run.reset(); setTyped(''); setAsking(change); };
  const close = (open: boolean) => { if (!open && !run.isPending) setAsking(null); };
  const row = (title: string, description: string, change: ProjectChange, isDestructive = false) =>
    <SettingsRow key={change} label={title} description={description}>
      <Button variant={isDestructive ? 'destructive' : 'secondary'} size="sm" className="max-md:h-11" onClick={() => ask(change)}>{ASK[change].label}</Button>
    </SettingsRow>;
  return <>
    <SettingsSection title="위험 구역">
      {project.deletedAt
        ? row('프로젝트 되살리기', ASK.restore.description, 'restore')
        : [
          project.archivedAt ? row('보관 해제', ASK.unarchive.description, 'unarchive') : row('프로젝트 보관', ASK.archive.description, 'archive'),
          row('프로젝트 삭제', '목록과 메뉴에서 사라집니다. 이 프로젝트를 가리키던 일정 · 회의록 · 연장근무에는 이름이 그대로 보입니다.', 'delete', true),
        ]}
    </SettingsSection>
    {asking === 'delete'
      ? <FormDialog open onOpenChange={close} title={ASK.delete.title} description={ASK.delete.description} submitLabel={ASK.delete.label} isDestructive
        isSubmitDisabled={typed !== project.key} isPending={run.isPending} onSubmit={() => run.mutate('delete')}>
        <Field>
          <FieldLabel htmlFor={keyId}>확인을 위해 키 {project.key}를 입력해 주세요</FieldLabel>
          <Input id={keyId} value={typed} placeholder={project.key} autoFocus className="font-mono max-md:h-11"
            onChange={event => setTyped(event.target.value.toUpperCase())} />
        </Field>
        {run.error ? <p role="alert" className="text-sm text-destructive">{run.error.message}</p> : null}
      </FormDialog>
      // 보관 · 보관 해제 · 되살리기는 되돌릴 수 있어 파괴하지 않는 확인(기본 색 단추)으로 묻는다.
      : <ConfirmDialog open={!!asking} onOpenChange={close} title={asking ? ASK[asking].title : ''}
        description={run.error?.message}
        action={asking ? { label: ASK[asking].label, variant: 'default', isPending: run.isPending, onAction: () => run.mutate(asking) } : undefined} />}
  </>;
}
