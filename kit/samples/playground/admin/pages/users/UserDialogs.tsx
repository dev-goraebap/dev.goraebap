import { Selector } from '@astryxdesign/core/Selector';
import { TextArea } from '@astryxdesign/core/TextArea';
import { FormDialog } from '@kit/composites/dialog/FormDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { adminKeys, isRejection, roles, useAdminApi, type Role } from '../../entities/admin';
import { parseEmails } from './model';

const roleOptions = roles.map(role => ({ value: role.id, label: role.label }));

/** 이메일 여러 개와 역할 하나. 검사는 제출에서 하고 어느 주소가 문제인지 칸 곁에 밝힌다. 이미 있는 주소는 서버가 거절한다. */
export function InviteDialog({ onClose }: { onClose: () => void }) {
  const api = useAdminApi();
  const client = useQueryClient();
  const [text, setText] = useState('');
  const [role, setRole] = useState<Role>('viewer');
  const [problem, setProblem] = useState<string>();
  const invite = useMutation({
    mutationFn: (emails: string[]) => api.users.invite({ emails, role }),
    onSuccess: () => { void client.invalidateQueries({ queryKey: adminKeys.users }); onClose(); },
    onError: error => { if (isRejection(error)) setProblem(`이미 있는 사용자입니다: ${error.value}`); },
  });
  const submit = () => {
    const { emails, invalid } = parseEmails(text);
    if (emails.length === 0) { setProblem('초대할 이메일을 입력해 주세요.'); return; }
    if (invalid) { setProblem(`올바르지 않은 이메일입니다: ${invalid}`); return; }
    setProblem(undefined);
    invite.mutate(emails);
  };
  return <FormDialog title="사용자 초대" submitLabel="초대 보내기" isPending={invite.isPending}
    error={invite.isError && !isRejection(invite.error) ? '초대를 보내지 못했습니다. 잠시 후 다시 시도해 주세요.' : undefined}
    onSubmit={submit} onClose={onClose}>
    <TextArea label="이메일" description="쉼표나 줄바꿈으로 여러 개를 나눠 적습니다." rows={4} value={text} hasAutoFocus
      placeholder="jiwoo@example.com" onChange={value => { setText(value); setProblem(undefined); }}
      status={problem ? { type: 'error', message: problem } : undefined} />
    <Selector label="역할" options={roleOptions} value={role} onChange={value => setRole(value as Role)} />
  </FormDialog>;
}

/** 한 명 또는 고른 여러 명의 역할을 같은 값으로 바꾼다. */
export function RoleDialog({ ids, subtitle, initial, onClose }: { ids: string[]; subtitle: string; initial: Role; onClose: () => void }) {
  const api = useAdminApi();
  const client = useQueryClient();
  const [role, setRole] = useState<Role>(initial);
  const change = useMutation({
    mutationFn: () => api.users.update(ids, { role }),
    onSuccess: () => { void client.invalidateQueries({ queryKey: adminKeys.users }); onClose(); },
  });
  return <FormDialog title="역할 바꾸기" subtitle={subtitle} submitLabel="바꾸기" isPending={change.isPending} width="26rem"
    error={change.isError ? '역할을 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.' : undefined} onSubmit={() => change.mutate()} onClose={onClose}>
    <Selector label="새 역할" options={roleOptions} value={role} onChange={value => setRole(value as Role)} />
  </FormDialog>;
}
