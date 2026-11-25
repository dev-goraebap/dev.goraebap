import { useState } from 'react';
import { ProjectRoleSelect, type Project, type ProjectRole } from '@/entities/project';
import { Button } from '@goraebap/ui-react/compact/button';
import { ConfirmDialog } from '@/shared/ui/kit/confirm-dialog';
import { Dialog, DialogBar, DialogBody, DialogContent, DialogDescription } from '@goraebap/ui-react/compact/dialog';
import { Input } from '@goraebap/ui-react/compact/input';
import { Mark } from '@/shared/ui/mark-picker';

/** 새로 참여시킬 때의 역할: 쓰는 사람이 대부분이라 에디터에서 시작한다(추가한 뒤 줄에서 바꾼다). */
const JOIN_AS: ProjectRole = 'EDITOR';

/**
 * 한 사람의 프로젝트 참여 관리(2026-11-15): 내가 관리자인 프로젝트를 모두 늘어놓고 이름 · 키로 찾는다. 참여 중인 프로젝트가
 * 앞에 서고, 줄마다 추가(에디터로) · 역할 바꾸기 · 빼기를 한다. 추가와 역할 바꾸기는 바로 저장되고, 빼기는 한 번 더 묻는다. 워크스페이스 관리자는 모든 프로젝트,
 * 프로젝트 관리자는 자기가 관리자인 프로젝트만 보인다. 빠진 사람은 그 프로젝트를 더 볼 수 없다.
 */
export function ParticipationDialog({ name, projects, roles, isPending, onChange, onClose }: {
  /** 누구의 참여인가. */
  name: string;
  /** 내가 관리자인 프로젝트(목록의 순서대로). */
  projects: Project[];
  /** 이 사람의 지금 역할, 프로젝트 id로. */
  roles: ReadonlyMap<string, ProjectRole>;
  isPending: boolean;
  onChange: (project: Project, role: ProjectRole | null, isIn: boolean) => void;
  onClose: () => void;
}) {
  const [words, setWords] = useState('');
  const [removing, setRemoving] = useState<Project | null>(null);
  const needle = words.trim().toLowerCase();
  const shown = projects
    .filter(project => !needle || `${project.name} ${project.key}`.toLowerCase().includes(needle))
    // 참여 중인 프로젝트를 앞에(같은 쪽 안에서는 목록의 순서 그대로).
    .sort((one, other) => Number(roles.has(other.id)) - Number(roles.has(one.id)));
  const joined = projects.filter(project => roles.has(project.id)).length;
  return (
    <Dialog open onOpenChange={isOpen => { if (!isOpen) onClose(); }}>
      <DialogContent showCloseButton={false}>
        <DialogBar title={`${name}의 프로젝트 참여`} />
        <DialogDescription>{`프로젝트 ${projects.length}개 중 ${joined}개에 참여 중입니다. 빼면 그 프로젝트와 그 안의 업무 · 문서를 더 볼 수 없습니다.`}</DialogDescription>
        <Input type="search" aria-label="프로젝트 검색" placeholder="프로젝트 이름 · 키로 찾기" value={words} autoFocus
          onChange={event => setWords(event.target.value)} className="max-md:h-11" />
        <DialogBody>
          {shown.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">찾는 프로젝트가 없습니다.</p> : (
            <ul aria-label="프로젝트" className="flex flex-col divide-y">
              {shown.map(project => {
                const role = roles.get(project.id);
                return (
                  <li key={project.id} className="flex min-h-14 items-center gap-3 py-2">
                    <Mark icon={project.icon} color={project.color} letter={project.key} size="sm" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">{project.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{project.key}</span>
                    </span>
                    {role ? <>
                      <ProjectRoleSelect label={`${project.name}에서 ${name}의 역할`} value={role} isDisabled={isPending}
                        onChange={next => { if (next && next !== role) onChange(project, next, true); }} />
                      <Button variant="ghost" size="sm" disabled={isPending} className="max-md:h-11" onClick={() => setRemoving(project)}>빼기</Button>
                    </> : (
                      <Button variant="secondary" size="sm" disabled={isPending} className="max-md:h-11" onClick={() => onChange(project, JOIN_AS, false)}>추가</Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </DialogBody>
      </DialogContent>
      <ConfirmDialog open={!!removing} onOpenChange={isOpen => { if (!isOpen) setRemoving(null); }}
        title={`${name}님을 ${removing?.name ?? ''}에서 뺄까요?`}
        description="빠지면 이 프로젝트와 그 안의 업무 · 문서를 더 볼 수 없습니다."
        action={{ label: '빼기', onAction: () => { if (removing) onChange(removing, null, true); setRemoving(null); } }} />
    </Dialog>
  );
}
