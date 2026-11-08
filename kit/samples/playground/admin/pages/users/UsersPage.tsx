import { Avatar } from '@astryxdesign/core/Avatar';
import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { HStack } from '@astryxdesign/core/HStack';
import { ListItem } from '@astryxdesign/core/List';
import { Spinner } from '@astryxdesign/core/Spinner';
import { pixel, proportional, useTableSelection, useTableSortable, type TableSortState } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { useToast } from '@astryxdesign/core/Toast';
import { Token } from '@astryxdesign/core/Token';
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden';
import { AlertDialog } from '@kit/composites/dialog/AlertDialog';
import { DisplayMenu } from '@kit/composites/filter/DisplayMenu';
import { useFilters } from '@kit/composites/filter/use-filters';
import { RowMenu } from '@kit/composites/popup/RowMenu';
import type { MenuAction } from '@kit/composites/popup/ActionMenu';
import { SearchTool } from '@kit/composites/search/SearchTool';
import { PageState } from '@kit/composites/state/PageState';
import { icon } from '@kit/foundations/icons/solar-icon';
import { useIsPhone } from '@kit/foundations/media';
import { Page } from '@kit/layouts/page/Page';
import { PageBanner, PageList, PageTable } from '@kit/layouts/page/PageParts';
import { useAddressDisplay, useAddressFilters, useAddressWords } from '@kit/patterns/list/list-address';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { useState, type ReactNode } from 'react';
import { usePreset } from '../../app/preset';
import { adminKeys, adminQueries, roleLabel, statusOf, useAdminApi, type User, type UserStatus } from '../../entities/admin';
import { filters, initialDisplay, lastSeenText, sorts, visibleUsers } from './model';
import { InviteDialog, RoleDialog } from './UserDialogs';
import styles from './users.module.css';

type Pending = { kind: 'role' | 'deactivate'; ids: string[] };

/**
 * 사용자 관리: 표가 주인공인 화면. 검색·필터·표시(정렬)는 모두 주소가 가지고, 표 머리를 눌러도 같은 정렬 값이 바뀐다.
 * 행을 고르면 본문 위에 일괄 동작 줄이 붙는다. 고른 것은 지금 보이는 행만 센다(필터로 가려진 행에는 동작이 닿지 않는다).
 * 휴대폰은 표 대신 행 목록이고 고르기·메뉴·일괄 동작은 같다. 초대 대화상자의 열림은 주소(`invite`)가 가진다.
 * 상태 순서: 대기 → 실패 → 조건이 있는 0건 → 0건.
 */
export function UsersPage() {
  const api = useAdminApi();
  const client = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isPhone = useIsPhone();
  const preset = usePreset();
  const search = location.search as Record<string, unknown>;
  const [words, setWords] = useAddressWords('q');
  const [state, setState] = useAddressFilters(filters);
  const [display, setDisplay] = useAddressDisplay(initialDisplay, { sorts: sorts.map(each => each.id) });
  const list = useFilters(filters, { state, onStateChange: setState });
  const query = useQuery(adminQueries.users(api));
  const [picked, setPicked] = useState<ReadonlySet<string>>(() => new Set(preset.selectedUsers));
  const [pending, setPending] = useState<Pending | null>(null);
  const isInviting = search.invite === true;
  const setInvite = (open: boolean) => void navigate({ to: location.pathname, search: { ...search, invite: open || undefined } as never });
  const items = visibleUsers(query.data ?? [], words, state, display);
  const chosen = items.filter(user => picked.has(user.id));
  const hasConditions = !!words.trim() || list.count > 0;
  const clearConditions = () => { setWords(''); list.clear(); };
  const change = useMutation({
    mutationFn: ({ ids, patch }: { ids: string[]; patch: { status: UserStatus } }) => api.users.update(ids, patch),
    onSuccess: (_, { ids }) => { setPending(null); setPicked(current => new Set([...current].filter(id => !ids.includes(id)))); },
    onSettled: () => client.invalidateQueries({ queryKey: adminKeys.users }),
  });
  const resend = useMutation({ mutationFn: (user: User) => api.users.resend(user.id), onSuccess: (_, user) => toast({ body: `${user.email}로 초대를 다시 보냈습니다` }) });
  const toggle = (id: string, isOn: boolean) => setPicked(current => { const next = new Set(current); if (isOn) next.add(id); else next.delete(id); return next; });
  const selectAll = (isOn: boolean) => setPicked(current => { const next = new Set(current); for (const user of items) { if (isOn) next.add(user.id); else next.delete(user.id); } return next; });
  const menuOf = (user: User): MenuAction[] => [
    { id: 'role', label: '역할 바꾸기', icon: 'shield', onSelect: () => setPending({ kind: 'role', ids: [user.id] }) },
    ...(user.status === 'invited' ? [{ id: 'resend', label: '다시 초대', icon: 'retry' as const, onSelect: () => resend.mutate(user) }] : []),
    user.status === 'inactive'
      ? { id: 'activate', label: '활성화', icon: 'restore', onSelect: () => change.mutate({ ids: [user.id], patch: { status: 'active' } }) }
      : { id: 'deactivate', label: '비활성화', icon: 'lock', onSelect: () => setPending({ kind: 'deactivate', ids: [user.id] }) },
  ];
  const sort: TableSortState = [{ sortKey: display.sort, direction: display.direction === 'asc' ? 'ascending' : 'descending' }];
  const selection = useTableSelection<User>({
    getIsItemSelected: user => picked.has(user.id), onSelectItem: ({ item, isSelected }) => toggle(item.id, isSelected),
    onSelectAll: ({ isAllSelected }) => selectAll(isAllSelected), getIsAllSelected: () => items.length > 0 && chosen.length === items.length,
    getIsIndeterminate: () => chosen.length > 0 && chosen.length < items.length, getRowLabel: user => user.name,
  });
  const sortable = useTableSortable<User>({
    sort, allowUnsortedState: false,
    onSortChange: next => { const first = next[0]; if (first) setDisplay({ ...display, sort: first.sortKey, direction: first.direction === 'ascending' ? 'asc' : 'desc' }); },
  });
  const subject = (ids: string[]) => (ids.length === 1 ? `${query.data?.find(user => user.id === ids[0])?.name ?? ''}님` : `${ids.length}명`);
  const content = (): ReactNode => {
    if (query.isPending) return <Center height="100%"><Spinner label="사용자를 불러오는 중" /></Center>;
    if (query.isError && !query.data) return <PageState kind="error" title="사용자를 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
      action={<Button label="다시 시도" variant="secondary" onClick={() => void query.refetch()} />} />;
    if (items.length === 0 && hasConditions) return <PageState kind="search" title="조건에 맞는 사용자가 없습니다" description="검색어나 필터를 바꿔 보세요."
      action={<Button label="조건 지우기" variant="secondary" onClick={clearConditions} />} />;
    if (items.length === 0) return <PageState kind="empty" title="아직 사용자가 없습니다" description="팀원을 초대해 문서와 이슈를 함께 다뤄 보세요."
      action={<Button label="사용자 초대" variant="secondary" icon={icon('plus')} onClick={() => setInvite(true)} />} />;
    return <>
      {chosen.length > 0 ? <BulkBar count={chosen.length} onRole={() => setPending({ kind: 'role', ids: chosen.map(user => user.id) })}
        onDeactivate={() => setPending({ kind: 'deactivate', ids: chosen.map(user => user.id) })} onClear={() => setPicked(new Set())} /> : null}
      {isPhone
        ? <PageList hasDividers aria-label="사용자">{items.map(user => <UserRow key={user.id} user={user} isPicked={picked.has(user.id)} onPick={isOn => toggle(user.id, isOn)}
          actions={menuOf(user)} />)}</PageList>
        : <PageTable<User> data={items} idKey="id" hasHover textOverflow="truncate" plugins={{ selection, sort: sortable }} columns={[
          { key: 'name', header: '이름', width: proportional(1), sortable: true, renderCell: user => <HStack gap={2} vAlign="center">
            <Avatar name={user.name} size="xsm" shape="circle" /><Text weight="medium" maxLines={1}>{user.name}</Text></HStack> },
          { key: 'email', header: '이메일', width: proportional(1.4), renderCell: user => <Text color="secondary" maxLines={1}>{user.email}</Text> },
          { key: 'role', header: '역할', width: pixel(112), renderCell: user => <Text>{roleLabel(user.role)}</Text> },
          { key: 'status', header: '상태', width: pixel(112), renderCell: user => <StatusToken status={user.status} /> },
          { key: 'lastSeen', header: '마지막 접속', width: pixel(168), align: 'end', sortable: true,
            renderCell: user => <Text type="supporting" color="secondary" hasTabularNumbers textWrap="nowrap">{lastSeenText(user.lastSeen)}</Text> },
          { key: 'menu', header: <VisuallyHidden>동작</VisuallyHidden>, width: pixel(56), align: 'end', renderCell: user => <RowMenu label={`${user.name} 메뉴`} actions={menuOf(user)} /> },
        ]} />}
    </>;
  };
  return <Page crumbs={[{ label: '관리', href: '/tags', icon: 'settings' }, { label: '사용자' }]}
    tools={<>
      <SearchTool label="사용자 검색" placeholder="이름과 이메일에서 찾기" value={words} onChange={setWords} />
      {list.tools}
      <DisplayMenu sorts={sorts} value={display} initial={initialDisplay} onChange={setDisplay} />
    </>}
    applied={list.applied}
    create={{ label: '사용자 초대', onClick: () => setInvite(true) }}>
    {change.isError ? <PageBanner status="error" title="사용자를 바꾸지 못했습니다" description="잠시 후 다시 시도해 주세요." /> : null}
    {content()}
    {isInviting ? <InviteDialog onClose={() => setInvite(false)} /> : null}
    {pending?.kind === 'role' ? <RoleDialog ids={pending.ids} subtitle={subject(pending.ids)} onClose={() => setPending(null)}
      initial={pending.ids.length === 1 ? query.data?.find(user => user.id === pending.ids[0])?.role ?? 'viewer' : 'viewer'} /> : null}
    <AlertDialog isOpen={pending?.kind === 'deactivate'} onOpenChange={open => { if (!open) setPending(null); }}
      title={`${subject(pending?.ids ?? [])}을 비활성화할까요?`}
      description="비활성화하면 바로 로그인할 수 없습니다. 언제든 다시 활성화할 수 있습니다." actionLabel="비활성화" isActionLoading={change.isPending}
      onAction={() => pending && change.mutate({ ids: pending.ids, patch: { status: 'inactive' } })} />
  </Page>;
}

/** 상태는 색과 이름을 함께 보인다. */
function StatusToken({ status }: { status: UserStatus }) {
  const each = statusOf(status);
  return <Token label={each.label} color={each.color} size="sm" />;
}

/** 고른 행의 일괄 동작: 몇 명인지, 동작 둘, 선택 해제. 동작 이름은 대상이 여럿임을 이름에 싣지 않고 앞의 수가 전한다. */
function BulkBar({ count, onRole, onDeactivate, onClear }: { count: number; onRole: () => void; onDeactivate: () => void; onClear: () => void }) {
  return <HStack className={styles.bulk} role="region" aria-label="선택한 사용자 동작" gap={3} vAlign="center" wrap="wrap">
    <Text weight="medium" hasTabularNumbers role="status">{count}명 선택</Text>
    <HStack gap={2} vAlign="center" wrap="wrap">
      <Button label="역할 바꾸기" variant="secondary" size="sm" icon={icon('shield')} onClick={onRole} />
      <Button label="비활성화" variant="secondary" size="sm" icon={icon('lock')} onClick={onDeactivate} />
      <Button label="선택 해제" variant="ghost" size="sm" onClick={onClear} />
    </HStack>
  </HStack>;
}

/** 휴대폰의 행: 앞에 고르기 상자, 이름과 이메일, 끝에 늘 있는 값(역할)과 메뉴. 초대됨·비활성만 상태를 덧붙인다. */
function UserRow({ user, isPicked, onPick, actions }: { user: User; isPicked: boolean; onPick: (isOn: boolean) => void; actions: MenuAction[] }) {
  return <ListItem isSelected={isPicked}
    startContent={<CheckboxInput label={`${user.name} 선택`} isLabelHidden value={isPicked} onChange={onPick} />}
    label={<HStack gap={2} vAlign="center"><Text weight="medium" maxLines={1}>{user.name}</Text>{user.status === 'active' ? null : <StatusToken status={user.status} />}</HStack>}
    description={<Text color="secondary" maxLines={1} className={styles.mail}>{user.email}</Text>}
    endContent={<HStack className={styles.rowEnd} gap={1} vAlign="center">
      <Text type="supporting" color="secondary" textWrap="nowrap">{roleLabel(user.role)}</Text>
      <RowMenu label={`${user.name} 메뉴`} actions={actions} />
    </HStack>} />;
}
