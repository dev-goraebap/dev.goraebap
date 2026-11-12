import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { focusFirstInvalid } from '@/shared/lib/focus-invalid';
import { carryDraft, useCarriedDraft } from '@/shared/lib/panel';
import { ComposeSurface } from '@/shared/ui/compose';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { Field, FieldDescription, FieldError, FieldLabel, FieldTitle } from '@/shared/ui/field';
import { FormDialog } from '@/shared/ui/form-dialog';
import { ShieldCheckIcon, UsersIcon } from '@/shared/ui/icon';
import { OptionPill } from '@/shared/ui/property-pill';
import { SegmentedControl } from '@/shared/ui/segmented-control';
import { Textarea } from '@/shared/ui/textarea';
import { adminKeys, isRejection, roles, useAdminApi, type Role } from '../../entities/admin';
import { parseEmails } from './model';

const roleOptions = roles.map(role => ({ value: role.id, label: role.label }));
type Draft = { text: string; role: Role };
const CARRY = 'admin:invite';

/**
 * 사용자 초대(키트 ComposeSurface): 데스크톱에서 목록의 버튼으로 열면 목록 위 대화상자, 초대 페이지 · 크게 보기 · 휴대폰은 자기 페이지.
 * 이메일 여러 개와 역할 하나. 검사는 제출에서 하고 어느 주소가 문제인지 칸 곁에 밝힌다. 이미 있는 주소는 서버가 거절한다.
 * 크게 보기는 쓰던 내용을 페이지로 넘기고(carryDraft), 쓴 것이 있는데 닫으면 버릴지 먼저 묻는다.
 */
export function InviteDialog({ onClose, surface = 'dialog', onExpand }: { onClose: () => void; surface?: 'page' | 'dialog'; onExpand?: () => void }) {
  const api = useAdminApi();
  const client = useQueryClient();
  const carried = useCarriedDraft<Draft>(CARRY);
  const [draft, setDraft] = useState<Draft>(() => carried ?? { text: '', role: 'viewer' });
  const [problem, setProblem] = useState<string>();
  const [isLeaving, setLeaving] = useState(false);
  const invite = useMutation({
    mutationFn: (emails: string[]) => api.users.invite({ emails, role: draft.role }),
    onSuccess: () => { void client.invalidateQueries({ queryKey: adminKeys.users }); onClose(); },
    onError: error => { if (isRejection(error)) setProblem(`이미 있는 사용자입니다: ${error.value}`); },
  });
  const submit = () => {
    const { emails, invalid } = parseEmails(draft.text);
    if (emails.length === 0) { setProblem('초대할 이메일을 입력해 주세요.'); focusFirstInvalid(); return; }
    if (invalid) { setProblem(`올바르지 않은 이메일입니다: ${invalid}`); focusFirstInvalid(); return; }
    setProblem(undefined);
    invite.mutate(emails);
  };
  return <>
    <ComposeSurface surface={surface} crumbs={[{ label: '사용자', href: '/users', icon: UsersIcon }, { label: '사용자 초대' }]}
      onClose={() => (draft.text.trim() ? setLeaving(true) : onClose())}
      onExpand={onExpand && (() => { carryDraft(CARRY, draft); onExpand(); })}
      submit={{ label: '초대 보내기', isPending: invite.isPending, onSubmit: submit }}
      error={invite.isError && !isRejection(invite.error) ? '초대를 보내지 못했습니다. 입력은 그대로 남아 있습니다.' : undefined}
      pills={<OptionPill label="역할" icon={ShieldCheckIcon} value={draft.role} options={roleOptions} onChange={role => setDraft({ ...draft, role })} />}>
      <Field data-invalid={problem ? true : undefined}>
        <FieldLabel htmlFor="invite-emails">이메일</FieldLabel>
        <Textarea id="invite-emails" rows={4} value={draft.text} autoFocus placeholder="jiwoo@example.com" aria-invalid={problem ? true : undefined}
          onChange={event => { setDraft({ ...draft, text: event.target.value }); setProblem(undefined); }} />
        {problem ? <FieldError>{problem}</FieldError> : <FieldDescription>쉼표나 줄바꿈으로 여러 개를 나눠 적습니다.</FieldDescription>}
      </Field>
    </ComposeSurface>
    <ConfirmDialog open={isLeaving} onOpenChange={setLeaving} title="작성 중인 초대를 버릴까요?" description="지금 닫으면 적은 이메일이 사라집니다."
      action={{ label: '버리기', onAction: () => { setLeaving(false); onClose(); } }} />
  </>;
}

/** 한 명 또는 고른 여러 명의 역할을 같은 값으로 바꾼다(키트 FormDialog: 데스크톱 대화상자, 휴대폰 바텀시트). */
export function RoleDialog({ ids, subtitle, initial, onClose }: { ids: string[]; subtitle: string; initial: Role; onClose: () => void }) {
  const api = useAdminApi();
  const client = useQueryClient();
  const [role, setRole] = useState<Role>(initial);
  const change = useMutation({
    mutationFn: () => api.users.update(ids, { role }),
    onSuccess: () => { void client.invalidateQueries({ queryKey: adminKeys.users }); onClose(); },
  });
  return <FormDialog open onOpenChange={open => { if (!open) onClose(); }} title="역할 바꾸기" description={subtitle} submitLabel="바꾸기"
    isPending={change.isPending} onSubmit={() => change.mutate()}>
    <Field>
      <FieldTitle>새 역할</FieldTitle>
      <SegmentedControl<Role> label="새 역할" value={role} options={roleOptions} onChange={setRole} className="w-full" />
    </Field>
    {change.isError ? <p role="alert" className="text-sm text-destructive">역할을 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.</p> : null}
  </FormDialog>;
}
