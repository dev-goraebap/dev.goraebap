import {ComposeSurface} from '@kit/patterns/compose/ComposeSurface';
import {PaperForm} from '@kit/patterns/compose/ComposeForm';
import {useDraft} from '@kit/patterns/compose/draft-store';
import {OptionPill} from '@kit/composites/property/PropertyPill';
import {focusFirstInvalid} from '@kit/patterns/compose/validation';
import { Selector } from '@astryxdesign/core/Selector';
import { TextArea } from '@astryxdesign/core/TextArea';
import { FormDialog } from '@kit/composites/dialog/FormDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { adminKeys, isRejection, roles, useAdminApi, type Role } from '../../entities/admin';
import { parseEmails } from './model';

const roleOptions = roles.map(role => ({ value: role.id, label: role.label }));

/** 이메일 여러 개와 역할 하나. 검사는 제출에서 하고 어느 주소가 문제인지 칸 곁에 밝힌다. 이미 있는 주소는 서버가 거절한다. */
export function InviteDialog({ onClose,surface='dialog',onExpand }: { onClose: () => void;surface?:'page'|'dialog';onExpand?:()=>void }) {
  const api = useAdminApi();
  const client = useQueryClient();
  const [draft,setDraft,clear]=useDraft<{text:string;role:Role}>('admin:invite',{text:'',role:'viewer'});
  const {text,role}=draft;const setText=(text:string)=>setDraft({...draft,text});const setRole=(role:Role)=>setDraft({...draft,role});
  const [problem, setProblem] = useState<string>();
  const invite = useMutation({
    mutationFn: (emails: string[]) => api.users.invite({ emails, role }),
    onSuccess: () => { clear();void client.invalidateQueries({ queryKey: adminKeys.users }); onClose(); },
    onError: error => { if (isRejection(error)) setProblem(`이미 있는 사용자입니다: ${error.value}`); },
  });
  const submit = () => {
    const { emails, invalid } = parseEmails(text);
    if (emails.length === 0) { setProblem('초대할 이메일을 입력해 주세요.'); focusFirstInvalid();return; }
    if (invalid) { setProblem(`올바르지 않은 이메일입니다: ${invalid}`); return; }
    setProblem(undefined);
    invite.mutate(emails);
  };
  return <ComposeSurface surface={surface} crumbs={[{label:'사용자',href:'/users',icon:'people'},{label:'사용자 초대'}]} onClose={()=>{clear();onClose()}} onExpand={onExpand} isDirty={!!text.trim()}
   submit={{label:'초대 보내기',isPending:invite.isPending,onSubmit:submit}}
   error={invite.isError&&!isRejection(invite.error)?'초대를 보내지 못했습니다. 입력은 그대로 남아 있습니다.':undefined}>
   <PaperForm hasHeading={surface==='page'} heading="사용자 초대" isPage={surface==='page'} parts={[{label:'이메일',content:<TextArea label="이메일" isLabelHidden description="쉼표나 줄바꿈으로 여러 개를 나눠 적습니다." rows={4} value={text} hasAutoFocus placeholder="jiwoo@example.com" onChange={value=>{setText(value);setProblem(undefined)}} statusVariant="detached" status={problem?{type:'error',message:problem}:undefined}/>}]} pills={<OptionPill label="역할" icon="shield" value={role} options={roleOptions} onChange={value=>setRole(value as Role)}/>}/>
  </ComposeSurface>;
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
