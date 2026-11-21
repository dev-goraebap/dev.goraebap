import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { accessOptions, useReplaceAccess, type Grant, type GrantSubject } from '@/entities/document';
import { orgChartOptions } from '@/entities/organization';
import { projectsOptions } from '@/entities/project';
import { Alert, AlertTitle } from '@/shared/ui/kit/alert';
import { Button } from '@/shared/ui/kit/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/kit/dialog';
import { LockIcon, OctagonXIcon, RestoreIcon } from '@/shared/ui/kit/icon';
import { Spinner } from '@/shared/ui/kit/spinner';
import { ACCESS_LEVEL_TEXT, AccessGrantLine } from './AccessGrantLine';
import { AccessSubjectPicker } from './AccessSubjectPicker';

const keyOf = (grant: Pick<Grant, 'subject' | 'subjectId'>) => `${grant.subject}:${grant.subjectId ?? ''}`;

/**
 * 권한 (docs/pending-records.md, 문서함 ②): a folder's or document's permissions as a panel. The closed folders above it
 * come first, read only (what it takes before its own); then its own grants, none meaning open (it takes what is above).
 * Whoever manages it closes it (the maker managing to start with), adds a member, a department (with those under it)
 * or a project's members at 보기, changes how far each goes, takes one away, or opens it again; the rest read.
 */
export function AccessDialog({ target, id, name, onClose }: { target: 'documents' | 'document-folders'; id: string; name: string; onClose: () => void }) {
  const access = useQuery(accessOptions(target, id));
  const org = useQuery(orgChartOptions());
  const projects = useQuery(projectsOptions('ACTIVE'));
  const [draft, setDraft] = useState<Grant[] | null>(null);
  const replace = useReplaceAccess(onClose);
  const canManage = !!access.data?.canManage;
  const grants = draft ?? access.data?.grants ?? [];
  const change = (next: Grant[]) => { replace.reset(); setDraft(next); };
  const taken = new Set(grants.map(keyOf));
  const choices = [
    ...(org.data?.people ?? []).map(person => ({ value: `USER:${person.id}`, label: `${person.name} · 사람`, name: person.name })),
    ...(projects.data ?? []).map(project => ({ value: `PROJECT:${project.id}`, label: `${project.name} · 프로젝트`, name: project.name })),
  ].filter(choice => !taken.has(choice.value));
  const add = (value: string) => {
    const choice = choices.find(each => each.value === value);
    if (!choice) return;
    const [subject, subjectId] = value.split(':') as [GrantSubject, string];
    change([...grants, { subject, subjectId, name: choice.name, level: 'READ' }]);
  };
  const isClosed = grants.length > 0;
  const groupTitle = 'text-xs font-medium text-muted-foreground';
  return <Dialog open onOpenChange={open => { if (!open && !replace.isPending) onClose(); }}>
    <DialogContent className="overflow-y-auto">
      <DialogHeader>
        <DialogTitle>권한</DialogTitle>
        <DialogDescription>{name}</DialogDescription>
      </DialogHeader>
      {access.isPending ? <div className="grid place-items-center p-6"><Spinner aria-label="권한을 불러오는 중" /></div>
        : access.isError ? <p role="alert" className="text-muted-foreground">{access.error.message}</p>
          : <div className="flex flex-col gap-5">
            <p className="text-xs text-muted-foreground">지금 내 권한: {ACCESS_LEVEL_TEXT[access.data.level]}</p>
            {access.data.inherited.map(above => <section key={above.folderId} aria-label={`${above.folderName}에서 내려받음`} className="flex flex-col gap-1">
              <h3 className={groupTitle}>'{above.folderName}'에서 내려받음</h3>
              {above.grants.map(grant => <AccessGrantLine key={keyOf(grant)} grant={grant} />)}
            </section>)}
            <section aria-label="이 항목의 규칙" className="flex flex-col gap-2">
              <h3 className={groupTitle}>이 항목의 규칙</h3>
              {isClosed
                ? grants.map((grant, index) => <AccessGrantLine key={keyOf(grant)} grant={grant}
                  onLevel={canManage ? level => change(grants.map((each, at) => (at === index ? { ...each, level } : each))) : undefined}
                  onRemove={canManage ? () => change(grants.filter((_, at) => at !== index)) : undefined} />)
                : <p className="text-muted-foreground">{access.data.inherited.length ? '위 규칙을 그대로 따릅니다.' : '공간의 모두가 보고 씁니다.'}</p>}
              {canManage && isClosed ? <AccessSubjectPicker choices={choices} isDisabled={org.isPending || projects.isPending} onPick={add} /> : null}
              {canManage ? <div className="flex gap-2">
                {isClosed
                  ? <Button variant="secondary" size="sm" onClick={() => change([])}><RestoreIcon data-icon="inline-start" />다시 열기 (규칙 없애기)</Button>
                  : <Button variant="secondary" size="sm" onClick={() => change([{ subject: 'OWNER', level: 'MANAGE' }])}><LockIcon data-icon="inline-start" />닫기 (대상만 보게)</Button>}
              </div> : null}
            </section>
            {replace.error ? <Alert variant="destructive"><OctagonXIcon /><AlertTitle className="whitespace-normal">{replace.error.message}</AlertTitle></Alert> : null}
          </div>}
      <DialogFooter>
        <Button variant="ghost" disabled={replace.isPending} onClick={onClose}>{canManage ? '취소' : '닫기'}</Button>
        {canManage ? <Button disabled={!draft || replace.isPending} onClick={() => replace.mutate({ target, id, grants })}>
          {replace.isPending ? <Spinner data-icon="inline-start" /> : null}저장
        </Button> : null}
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
