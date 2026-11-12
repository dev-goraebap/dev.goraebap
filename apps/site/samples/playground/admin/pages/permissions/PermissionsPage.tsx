import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useBlocker } from '@tanstack/react-router';
import { useState } from 'react';
import { Alert, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { ShieldCheckIcon, TriangleAlertIcon } from '@/shared/ui/icon';
import { Page } from '@/shared/ui/page';
import { PageState } from '@/shared/ui/page-state';
import { SegmentedControl } from '@/shared/ui/segmented-control';
import { SettingsRow, SettingsSection } from '@/shared/ui/settings';
import { Spinner } from '@/shared/ui/spinner';
import { Switch } from '@/shared/ui/switch';
import { usePreset } from '../../app/preset';
import { adminKeys, adminQueries, cellKey, featureGroups, roles, useAdminApi, type Matrix, type Role } from '../../entities/admin';

const lockedReason = '관리자는 모든 기능을 가지며 바꿀 수 없습니다.';

/**
 * 권한 설정: 역할 하나를 고르고 그 역할의 기능을 묶음별 스위치 줄(키트 SettingsSection · SettingsRow)로 바꾼다. 칸을 바꾸면 저장 전까지는
 * 바뀐 칸으로만 모아 두고(서버 값과 다른 칸만), 본문 바닥에 붙는 저장 줄의 저장 · 되돌리기로 한꺼번에 반영한다. 바꾼 것이 있으면
 * 다른 화면으로 떠나기 전에 묻는다. 관리자는 켠 채로 잠그고 이유를 목록 위에 알린다. 데스크톱과 휴대폰이 같은 모양이다.
 */
export function PermissionsPage() {
  const api = useAdminApi();
  const client = useQueryClient();
  const preset = usePreset();
  const query = useQuery(adminQueries.permissions(api));
  const [changed, setChanged] = useState<ReadonlySet<string>>(() => new Set(preset.changedCells));
  const [role, setRole] = useState<Role>((preset.permissionRole as Role | undefined) ?? 'writer');
  const blocker = useBlocker({ shouldBlockFn: () => changed.size > 0, withResolver: true, enableBeforeUnload: false });
  const save = useMutation({
    mutationFn: (matrix: Matrix) => api.permissions.save(matrix),
    onSuccess: saved => { client.setQueryData(adminKeys.permissions, saved); setChanged(new Set()); },
  });
  const valueOf = (target: Role, feature: string) => !!query.data?.[target].includes(feature) !== changed.has(cellKey(target, feature));
  const toggle = (target: Role, feature: string) => setChanged(current => {
    const next = new Set(current);
    const key = cellKey(target, feature);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const submit = () => {
    const next = { ...query.data } as Matrix;
    for (const each of roles) next[each.id] = featureGroups.flatMap(group => group.features).filter(feature => valueOf(each.id, feature.id)).map(feature => feature.id);
    save.mutate(next);
  };
  const content = () => {
    if (query.isPending) return <div className="flex flex-1 items-center justify-center"><Spinner aria-label="권한을 불러오는 중" className="size-6 text-muted-foreground" /></div>;
    if (query.isError && !query.data) return <PageState kind="error" title="권한을 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
      action={<Button variant="secondary" onClick={() => void query.refetch()}>다시 시도</Button>} />;
    return <RoleList role={role} onRole={setRole} valueOf={valueOf} onToggle={toggle} />;
  };
  return <Page crumbs={[{ label: '권한', icon: ShieldCheckIcon }]}
    below={save.isError ? <Alert variant="destructive" className="shrink-0 rounded-none border-x-0 border-t-0">
      <TriangleAlertIcon /><AlertTitle>권한을 저장하지 못했습니다. 바꾼 칸은 그대로 남아 있습니다. 다시 저장해 주세요.</AlertTitle>
    </Alert> : undefined}>
    {content()}
    {/* 저장 줄: 본문 바닥에 붙어(sticky) 목록을 내려도 보인다. 바꾼 것이 있을 때만 나타난다. */}
    {changed.size > 0 ? <div role="region" aria-label="변경 사항 저장"
      className="sticky bottom-0 z-10 mt-auto flex shrink-0 items-center justify-end gap-2 border-t bg-background px-4 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      <Button variant="ghost" disabled={save.isPending} className="max-md:h-11" onClick={() => setChanged(new Set())}>되돌리기</Button>
      <Button disabled={save.isPending} className="max-md:h-11 max-md:flex-1" onClick={submit}>
        {save.isPending ? <Spinner data-icon="inline-start" /> : null}변경 {changed.size}개 저장
      </Button>
    </div> : null}
    <ConfirmDialog open={blocker.status === 'blocked'} onOpenChange={open => { if (!open) blocker.reset?.(); }} title="저장하지 않고 나갈까요?"
      description={`바꾼 권한 ${changed.size}개가 저장되지 않고 사라집니다.`}
      action={{ label: '나가기', onAction: () => blocker.proceed?.() }} />
  </Page>;
}

type CellProps = { valueOf: (role: Role, feature: string) => boolean; onToggle: (role: Role, feature: string) => void };

/** 역할 하나를 고르고(넷 중 하나라 펼치지 않는 SegmentedControl) 그 역할의 기능을 묶음별 스위치 줄로 바꾼다. */
function RoleList({ role, onRole, valueOf, onToggle }: CellProps & { role: Role; onRole: (role: Role) => void }) {
  const isLocked = role === 'admin';
  return <div className="mx-auto flex w-full max-w-180 flex-col gap-6 px-4 py-8 max-md:py-5">
    <div className="flex flex-col gap-2">
      <SegmentedControl<Role> label="역할" value={role} options={roles.map(each => ({ value: each.id, label: each.label }))} onChange={onRole} className="w-full" />
      {isLocked ? <p className="text-sm text-muted-foreground">{lockedReason}</p> : null}
    </div>
    {featureGroups.map(group => <SettingsSection key={group.id} title={group.label}>
      {group.features.map(feature => <SettingsRow key={feature.id} label={feature.label}>
        <Switch aria-label={feature.label} checked={valueOf(role, feature.id)} disabled={isLocked} onCheckedChange={() => onToggle(role, feature.id)}
          className="max-md:after:-inset-3" />
      </SettingsRow>)}
    </SettingsSection>)}
  </div>;
}
