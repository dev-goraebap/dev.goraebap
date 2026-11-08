import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Center } from '@astryxdesign/core/Center';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { HStack } from '@astryxdesign/core/HStack';
import { List, ListItem } from '@astryxdesign/core/List';
import { Selector } from '@astryxdesign/core/Selector';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Switch } from '@astryxdesign/core/Switch';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Token } from '@astryxdesign/core/Token';
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden';
import { AlertDialog } from '@kit/composites/dialog/AlertDialog';
import { PageState } from '@kit/composites/state/PageState';
import { icon } from '@kit/foundations/icons/solar-icon';
import { useIsPhone } from '@kit/foundations/media';
import { Page } from '@kit/layouts/page/Page';
import { PageBanner } from '@kit/layouts/page/PageParts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useBlocker } from '@tanstack/react-router';
import { useState } from 'react';
import { usePreset } from '../../app/preset';
import { adminKeys, adminQueries, cellKey, featureGroups, roles, useAdminApi, type Matrix, type Role } from '../../entities/admin';
import styles from './permissions.module.css';

const lockedReason = '관리자는 모든 기능을 가지며 바꿀 수 없습니다.';

/**
 * 권한 설정: 역할 × 기능 체크 격자. 칸을 바꾸면 저장 전까지는 바뀐 칸으로만 모아 두고(서버 값과 다른 칸만 표시),
 * 바닥 고정 줄의 저장·되돌리기로 한꺼번에 반영한다. 바꾼 것이 있으면 다른 화면으로 떠나기 전에 묻는다.
 * 관리자 열은 켠 채로 잠그고 이유를 칸 곁 툴팁으로 알린다. 휴대폰은 격자 대신 역할 하나를 골라 그 역할의 기능 스위치 목록으로 본다.
 */
export function PermissionsPage() {
  const api = useAdminApi();
  const client = useQueryClient();
  const isPhone = useIsPhone();
  const preset = usePreset();
  const query = useQuery(adminQueries.permissions(api));
  const [changed, setChanged] = useState<ReadonlySet<string>>(() => new Set(preset.changedCells));
  const [role, setRole] = useState<Role>((preset.permissionRole as Role | undefined) ?? 'editor');
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
    if (query.isPending) return <Center height="100%"><Spinner label="권한을 불러오는 중" /></Center>;
    if (query.isError && !query.data) return <PageState kind="error" title="권한을 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
      action={<Button label="다시 시도" variant="secondary" onClick={() => void query.refetch()} />} />;
    return isPhone
      ? <RoleList role={role} onRole={setRole} valueOf={valueOf} isChanged={(target, feature) => changed.has(cellKey(target, feature))} onToggle={toggle} />
      : <Grid valueOf={valueOf} isChanged={(target, feature) => changed.has(cellKey(target, feature))} onToggle={toggle} />;
  };
  return <Page crumbs={[{ label: '관리', href: '/tags', icon: 'settings' }, { label: '권한' }]}
    footer={changed.size > 0 ? <HStack className={styles.foot} role="region" aria-label="변경 사항 저장" gap={2} vAlign="center">
      <Button label="되돌리기" variant="ghost" isDisabled={save.isPending} onClick={() => setChanged(new Set())} />
      <Button label={`변경 ${changed.size}개 저장`} variant="primary" isLoading={save.isPending} onClick={submit} />
    </HStack> : undefined}>
    {save.isError ? <PageBanner status="error" title="권한을 저장하지 못했습니다" description="바꾼 칸은 그대로 남아 있습니다. 다시 저장해 주세요." /> : null}
    {content()}
    <AlertDialog isOpen={blocker.status === 'blocked'} onOpenChange={open => { if (!open) blocker.reset?.(); }} title="저장하지 않고 나갈까요?"
      description={`바꾼 권한 ${changed.size}개가 저장되지 않고 사라집니다.`} cancelLabel="계속 편집" actionLabel="나가기"
      onAction={() => blocker.proceed?.()} />
  </Page>;
}

type CellProps = { valueOf: (role: Role, feature: string) => boolean; isChanged: (role: Role, feature: string) => boolean; onToggle: (role: Role, feature: string) => void };

/** 데스크톱 격자: 기능 묶음마다 머리 행, 역할마다 열. 바뀐 칸은 바탕과 모서리 점으로 보이고 이름에도 적힌다. */
function Grid({ valueOf, isChanged, onToggle }: CellProps) {
  return <div className={styles.sheet}>
    <table className={styles.grid}>
      <VisuallyHidden as="caption">역할별 기능 권한</VisuallyHidden>
      <thead><tr>
        <th scope="col">기능</th>
        {roles.map(each => <th key={each.id} scope="col"><span className={styles.roleHead}>{each.label}{each.id === 'admin' ? icon('lock') : null}</span></th>)}
      </tr></thead>
      {featureGroups.map(group => <tbody key={group.id}>
        <tr className={styles.group}><th scope="rowgroup" colSpan={roles.length + 1}>{group.label}</th></tr>
        {group.features.map(feature => <tr key={feature.id}>
          <th scope="row"><Text>{feature.label}</Text></th>
          {roles.map(each => {
            const isLocked = each.id === 'admin';
            const marked = isChanged(each.id, feature.id);
            return <td key={each.id} className={styles.cell} data-changed={marked || undefined}>
              <span className={styles.center}><CheckboxInput label={`${each.label} ${feature.label}${marked ? ', 바뀜' : ''}`} isLabelHidden value={valueOf(each.id, feature.id)}
                isDisabled={isLocked} disabledMessage={isLocked ? lockedReason : undefined} onChange={() => onToggle(each.id, feature.id)} /></span>
              {marked ? <span className={styles.mark} aria-hidden="true" /> : null}
            </td>;
          })}
        </tr>)}
      </tbody>)}
    </table>
  </div>;
}

/** 휴대폰: 역할 하나를 고르고 그 역할의 기능을 묶음별 스위치 목록으로 바꾼다. */
function RoleList({ role, onRole, valueOf, isChanged, onToggle }: CellProps & { role: Role; onRole: (role: Role) => void }) {
  const isLocked = role === 'admin';
  return <div className={styles.column}>
    <Selector label="역할" options={roles.map(each => ({ value: each.id, label: each.label }))} value={role} onChange={value => onRole(value as Role)} />
    {isLocked ? <Text className={styles.notice} color="secondary">{lockedReason}</Text> : null}
    {featureGroups.map(group => <VStack as="section" key={group.id} gap={2} aria-label={group.label}>
      <Text type="supporting" weight="medium" color="secondary">{group.label}</Text>
      <Card padding={0}><List hasDividers density="spacious">
        {group.features.map(feature => <ListItem key={feature.id}
          label={<HStack gap={2} vAlign="center"><Text>{feature.label}</Text>{isChanged(role, feature.id) ? <Token label="바뀜" size="sm" /> : null}</HStack>}
          endContent={<Switch label={feature.label} isLabelHidden value={valueOf(role, feature.id)} isDisabled={isLocked}
            disabledMessage={isLocked ? lockedReason : undefined} onChange={() => onToggle(role, feature.id)} />} />)}
      </List></Card>
    </VStack>)}
  </div>;
}
