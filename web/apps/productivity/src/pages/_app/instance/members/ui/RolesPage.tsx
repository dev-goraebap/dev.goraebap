import { useQuery } from '@tanstack/react-query';
import { useBlocker } from '@tanstack/react-router';
import { useState } from 'react';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import { Alert, AlertDescription, AlertTitle } from '@goraebap/ui-react/compact/alert';
import { Button } from '@goraebap/ui-react/compact/button';
import { Card } from '@goraebap/ui-react/compact/card';
import { ConfirmDialog } from '@/shared/ui/kit/confirm-dialog';
import { Field, FieldDescription, FieldLabel } from '@goraebap/ui-react/components/field';
import { FormDialog } from '@/shared/ui/kit/form-dialog';
import { Input } from '@goraebap/ui-react/compact/input';
import { toast } from '@goraebap/ui-react/compact/toast';
import { PlusIcon, TriangleAlertIcon } from '@/shared/ui/kit/icon';
import { Page } from '@/shared/ui/kit/layout/page';
import { PageState } from '@/shared/ui/kit/page-state';
import { PersonAvatar } from '@/shared/ui/person';
import { SearchTool } from '@/shared/ui/kit/search-tool';
import { SegmentedControl } from '@/shared/ui/kit/segmented-control';
import { Spinner } from '@goraebap/ui-react/components/spinner';
import { Switch } from '@goraebap/ui-react/components/switch';
import { ROLE_LABEL, ROLES, rolesOptions, useAddMember, useSetRoles, type Role, type RoleHolder } from '../api/roles';

type Crumb = { label: string; href?: string; icon?: string };

/** 역할마다 맡는 일. 두 권한은 서로를 포함하지 않는다. */
const ROLE_DUTY: Record<Role, string> = {
  INSTANCE_ADMIN: '이 권한 화면과 시스템 화면(상태·알림 발송 등)을 맡습니다.',
  WORKSPACE_ADMIN: '워크스페이스 관리(프로젝트·라벨·업무 유형·문서 전체)를 맡습니다.',
};
/** 역할 고르기 칸의 이름: 둘 다 관리자라 '관리자'를 뺀다. */
const ROLE_TAB: Record<Role, string> = { INSTANCE_ADMIN: '인스턴스', WORKSPACE_ADMIN: '워크스페이스' };
const key = (id: string, role: Role) => `${id}:${role}`;

/**
 * 권한 (Webapp 권한 설정 패턴): 위에서 역할 하나를 고르고, 그 역할을 줄 구성원을 카드 안의 스위치 목록으로
 * 바꾼다. 바꾼 칸은 저장 전까지 모아 두고(서버 값과 다른 칸만), 바닥 고정 줄의 되돌리기·저장으로 한꺼번에 반영한다. 저장은
 * 누구의 어느 권한을 켜고 끄는지 보이고 한 번 더 확인을 받는다. 바꾼 것이
 * 있으면 다른 화면으로 떠나기 전에 묻는다. 인스턴스 관리자는 늘 한 명 이상 남아야 해서, 마지막 사람의 권한을 빼면 서버가
 * 거절하고 그 이유를 위에 알린다. 구성원은 이름이나 이메일로 찾는다.
 */
export function RolesPage({ crumbs }: { crumbs: Crumb[] }) {
  const holders = useQuery(rolesOptions());
  const set = useSetRoles();
  const [role, setRole] = useState<Role>('INSTANCE_ADMIN');
  const [words, setWords] = useState('');
  const [changed, setChanged] = useState<ReadonlySet<string>>(new Set());
  const [failure, setFailure] = useState<string>();
  const [isSaving, setSaving] = useState(false);
  // 저장 전에 한 번 더 묻는다(2026-11-15): 누구의 어느 권한을 켜고 끄는지 보이고 확인을 받는다.
  const [isAsking, setAsking] = useState(false);
  const [isAdding, setAdding] = useState(false);
  const blocker = useBlocker({ shouldBlockFn: () => changed.size > 0, withResolver: true, enableBeforeUnload: () => changed.size > 0 });
  const needle = words.trim().toLowerCase();
  const all = holders.data ?? [];
  const shown = all.filter(each => !needle || each.name.toLowerCase().includes(needle) || each.email.toLowerCase().includes(needle));
  const valueOf = (holder: RoleHolder, target: Role) => holder.roles.includes(target) !== changed.has(key(holder.id, target));
  const toggle = (holder: RoleHolder, target: Role) => setChanged(current => {
    const next = new Set(current);
    const cell = key(holder.id, target);
    if (next.has(cell)) next.delete(cell); else next.add(cell);
    return next;
  });
  // 바뀐 구성원마다 역할 전체를 한 번씩 보낸다. 하나가 거절되면 거기서 멈추고, 남은 칸은 그대로 둔다.
  const save = async () => {
    setSaving(true); setFailure(undefined);
    try {
      for (const holder of all.filter(each => ROLES.some(target => changed.has(key(each.id, target))))) {
        await set.mutateAsync({ id: holder.id, roles: ROLES.filter(target => valueOf(holder, target)) });
        setChanged(current => new Set([...current].filter(cell => !cell.startsWith(`${holder.id}:`))));
      }
    } catch (error) {
      setFailure(error instanceof Error ? error.message : '권한을 저장하지 못했습니다.');
    } finally { setSaving(false); }
  };
  const body = () => {
    if (holders.isPending) return null;
    if (holders.isError) return <PageState kind="error" title="권한을 불러오지 못했습니다" description={holders.error.message}
      action={<Button variant="secondary" onClick={() => void holders.refetch()}>다시 시도</Button>} />;
    return <div className="flex justify-center p-4">
      <div className="flex w-full max-w-180 min-w-0 flex-col gap-4">
        {failure ? <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>{failure}</AlertTitle>
          <AlertDescription>바꾼 칸은 그대로 남아 있습니다. 고친 뒤 다시 저장해 주세요.</AlertDescription>
        </Alert> : null}
        <div className="flex flex-col gap-2">
          <SegmentedControl label="역할" className="self-start max-md:self-stretch" value={role} onChange={setRole}
            options={ROLES.map(each => ({ value: each, label: ROLE_TAB[each] }))} />
          <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">{ROLE_LABEL[role]}</span>: {ROLE_DUTY[role]} 두 권한은 서로를 포함하지 않습니다.</p>
        </div>
        {shown.length === 0
          ? <PageState kind="search" isCompact title="찾는 구성원이 없습니다"
            action={<Button variant="secondary" onClick={() => setWords('')}>검색어 지우기</Button>} />
          : <Card className="py-0">
            <ul aria-label={`${ROLE_LABEL[role]} 구성원`} className="flex flex-col divide-y divide-border">
              {shown.map(holder => {
                const label = `${holder.name} ${ROLE_LABEL[role]}`;
                return <li key={holder.id} className="flex min-h-15 items-center gap-3 px-4 py-2.5">
                  <PersonAvatar id={holder.id} name={holder.name} size={32} isStatic />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{holder.name}</span>
                    <span className="truncate text-sm text-muted-foreground">{holder.email}</span>
                  </div>
                  {changed.has(key(holder.id, role)) ? <span className="text-xs whitespace-nowrap text-muted-foreground">바뀜</span> : null}
                  <Switch appearance="compact" aria-label={label} checked={valueOf(holder, role)} disabled={isSaving} onCheckedChange={() => toggle(holder, role)} />
                </li>;
              })}
            </ul>
          </Card>}
      </div>
    </div>;
  };
  return <Page crumbs={pageCrumbs(crumbs)} tools={<>
    <SearchTool label="구성원 검색" placeholder="이름이나 이메일" value={words} onChange={setWords} />
    <Button size="sm" onClick={() => setAdding(true)}><PlusIcon data-icon="inline-start" />구성원 추가</Button>
  </>}
    footerLabel="변경 사항 저장"
    footer={changed.size > 0 ? <>
      <Button variant="ghost" disabled={isSaving} onClick={() => { setChanged(new Set()); setFailure(undefined); }}>되돌리기</Button>
      <Button disabled={isSaving} onClick={() => setAsking(true)}>
        {isSaving && <Spinner data-icon="inline-start" />}
        {`변경 ${changed.size}개 저장`}
      </Button>
    </> : undefined}>
    {body()}
    <AddMemberDialog open={isAdding} onOpenChange={setAdding} />
    <ConfirmDialog open={isAsking} onOpenChange={open => { if (!open) setAsking(false); }} title={`권한 ${changed.size}개를 바꿀까요?`}
      description={all.flatMap(holder => ROLES.filter(target => changed.has(key(holder.id, target)))
        .map(target => `${holder.name}: ${ROLE_LABEL[target]} ${valueOf(holder, target) ? '켜기' : '끄기'}`)).join(' · ')}
      action={{ label: '바꾸기', onAction: () => { setAsking(false); void save(); } }} />
    <ConfirmDialog open={blocker.status === 'blocked'} onOpenChange={open => { if (!open) blocker.reset?.(); }} title="저장하지 않고 나갈까요?"
      description={`바꾼 권한 ${changed.size}개가 저장되지 않고 사라집니다.`} cancelLabel="계속 편집"
      action={{ label: '나가기', onAction: () => blocker.proceed?.() }} />
  </Page>;
}

/**
 * 구성원 추가: 이름과 이메일만 받는다. 더한 사람은 곧바로 그 이메일로 인증 코드를 받아 로그인할 수 있고, 처음 로그인하면 환영
 * 화면을 거친다. 권한은 이 화면의 스위치로 따로 준다. 초대 메일은 보내지 않으므로 주소를 직접 알려 준다.
 */
function AddMemberDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const add = useAddMember();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) { setName(''); setEmail(''); add.reset(); }
  };
  return <FormDialog open={open} onOpenChange={close} title="구성원 추가" submitLabel="추가"
    description="더한 사람은 이 이메일로 인증 코드를 받아 바로 로그인할 수 있습니다."
    isSubmitDisabled={!name.trim() || !email.trim()} isPending={add.isPending}
    onSubmit={() => add.mutate({ name: name.trim(), email: email.trim() }, {
      onSuccess: member => { toast.add({ title: `${member.name}님을 더했습니다.` }); close(false); },
    })}>
    <Field>
      <FieldLabel htmlFor="member-name">이름</FieldLabel>
      <Input id="member-name" autoComplete="off" maxLength={64} placeholder="예: 김고래" value={name} onChange={event => setName(event.target.value)} />
    </Field>
    <Field>
      <FieldLabel htmlFor="member-email">이메일</FieldLabel>
      <Input id="member-email" type="email" autoComplete="off" placeholder="예: name@example.com" value={email} onChange={event => setEmail(event.target.value)} />
      <FieldDescription>{add.error ? add.error.message : '로그인할 때 이 주소로 인증 코드를 보냅니다.'}</FieldDescription>
    </Field>
  </FormDialog>;
}
