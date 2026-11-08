import { TextInput } from '@astryxdesign/core/TextInput';
import { FormDialog } from '@kit/composites/dialog/FormDialog';
import { focusFirstInvalid } from '@kit/patterns/compose/validation';
import { useState } from 'react';
import { useWorkspaceActions } from '../../entities/workspace';

/** 프로젝트 이름 한 칸. 첫 화면의 선택지와 체크리스트의 첫 단계가 같은 대화상자를 쓴다. */
export function ProjectDialog({ onClose }: { onClose: () => void }) {
  const { createProject } = useWorkspaceActions();
  const [name, setName] = useState('');
  const [isTried, setTried] = useState(false);
  const submit = () => {
    if (!name.trim()) { setTried(true); focusFirstInvalid(); return; }
    createProject.mutate(name.trim(), { onSuccess: onClose });
  };
  return <FormDialog title="프로젝트 만들기" submitLabel="만들기" isPending={createProject.isPending} onClose={onClose} onSubmit={submit}
    error={createProject.isError ? '만들지 못했습니다. 잠시 후 다시 시도해 주세요.' : undefined}>
    <TextInput label="이름" value={name} onChange={setName} hasAutoFocus
      status={isTried && !name.trim() ? { type: 'error', message: '프로젝트 이름을 입력해 주세요.' } : undefined} />
  </FormDialog>;
}

/** 초대할 이메일 한 칸. 형식이 맞지 않으면 칸 곁에 알린다. */
export function InviteDialog({ onClose }: { onClose: () => void }) {
  const { invite } = useWorkspaceActions();
  const [email, setEmail] = useState('');
  const [isTried, setTried] = useState(false);
  const isValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const submit = () => {
    if (!isValid) { setTried(true); focusFirstInvalid(); return; }
    invite.mutate(email.trim(), { onSuccess: onClose });
  };
  return <FormDialog title="팀원 초대하기" submitLabel="초대하기" isPending={invite.isPending} onClose={onClose} onSubmit={submit}
    error={invite.isError ? '초대하지 못했습니다. 잠시 후 다시 시도해 주세요.' : undefined}>
    <TextInput label="이메일" type="email" placeholder="name@example.com" value={email} onChange={setEmail} hasAutoFocus
      status={isTried && !isValid ? { type: 'error', message: '이메일 형식으로 입력해 주세요.' } : undefined} />
  </FormDialog>;
}
