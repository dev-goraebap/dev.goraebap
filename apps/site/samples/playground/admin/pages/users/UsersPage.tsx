import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { useState, type ReactNode } from 'react';
import { useAddressChoices, useAddressFilters, useAddressWords } from '@/shared/lib/list-address';
import { usePanel, useOpenPanel } from '@/shared/lib/panel';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { cn } from 'cn';
import { ActionMenu, type MenuAction } from '@/shared/ui/action-menu';
import { Alert, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DisplayChoice, DisplayMenu } from '@/shared/ui/display-menu';
import { FilterBar, FilterChips, FilterMenu, useFilters } from '@/shared/ui/filter';
import { ArrowDownIcon, ArrowUpIcon, LockIcon, RefreshCwIcon, RotateCcwIcon, ShieldCheckIcon, UsersIcon, TriangleAlertIcon } from '@/shared/ui/icon';
import { Page } from '@/shared/ui/page';
import { PageState } from '@/shared/ui/page-state';
import { PersonAvatar } from '@/shared/ui/person-avatar';
import { SearchTool } from '@/shared/ui/search-tool';
import { Spinner } from '@/shared/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { toast } from '@/shared/ui/toast';
import { usePreset } from '../../app/preset';
import { adminKeys, adminQueries, roleLabel, statusOf, useAdminApi, type User, type UserStatus } from '../../entities/admin';
import { allowedDisplay, directions, filterKeys, filters as filterDefs, initialDisplay, lastSeenText, sorts, visibleUsers, type Display } from './model';
import { InviteDialog, RoleDialog } from './UserDialogs';

type Pending = { kind: 'role' | 'deactivate'; ids: string[] };

/**
 * 사용자 관리: 표가 주인공인 화면. 검색 · 필터 · 표시(정렬)는 모두 주소가 가지고, 표 머리를 눌러도 같은 정렬 값이 바뀐다.
 * 행을 고르면 본문 위에 일괄 동작 줄이 붙는다. 고른 것은 지금 보이는 행만 센다(필터로 가려진 행에는 동작이 닿지 않는다).
 * 휴대폰은 표 대신 행 목록이고 고르기 · 메뉴 · 일괄 동작은 같다. 초대 양식의 열림은 주소(?panel=/users/invite, 옛 ?invite)가 가진다.
 * 상태 순서: 대기 → 실패 → 조건이 있는 0건 → 0건.
 */
export function UsersPage() {
  const openPanel = useOpenPanel();
  const panel = usePanel();
  const api = useAdminApi();
  const client = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const preset = usePreset();
  const search = location.search as Record<string, unknown>;
  const [words, setWords] = useAddressWords('q');
  const [state, setState] = useAddressFilters(filterKeys);
  const [display, setDisplay] = useAddressChoices<Display>(initialDisplay, allowedDisplay);
  const filters = useFilters(filterDefs, { state, onStateChange: setState });
  const query = useQuery(adminQueries.users(api));
  const [picked, setPicked] = useState<ReadonlySet<string>>(() => new Set(preset.selectedUsers));
  const [pending, setPending] = useState<Pending | null>(null);
  const isInviting = search.invite === true || panel.href === '/users/invite';
  const setInvite = (value: boolean) => {
    if (value) return openPanel('/users/invite');
    if (search.invite) return void navigate({ href: '/users', replace: true });
    panel.close();
  };
  const items = visibleUsers(query.data ?? [], words, state, display);
  const chosen = items.filter(user => picked.has(user.id));
  const hasConditions = !!words.trim() || filters.active.length > 0;
  const clearConditions = () => { setWords(''); filters.clear(); };
  const change = useMutation({
    mutationFn: ({ ids, patch }: { ids: string[]; patch: { status: UserStatus } }) => api.users.update(ids, patch),
    onSuccess: (_, { ids }) => { setPending(null); setPicked(current => new Set([...current].filter(id => !ids.includes(id)))); },
    onSettled: () => client.invalidateQueries({ queryKey: adminKeys.users }),
  });
  const resend = useMutation({ mutationFn: (user: User) => api.users.resend(user.id), onSuccess: (_, user) => toast.add({ type: 'success', title: `${user.email}로 초대를 다시 보냈습니다` }) });
  const toggle = (id: string, isOn: boolean) => setPicked(current => { const next = new Set(current); if (isOn) next.add(id); else next.delete(id); return next; });
  const selectAll = (isOn: boolean) => setPicked(current => { const next = new Set(current); for (const user of items) { if (isOn) next.add(user.id); else next.delete(user.id); } return next; });
  const menuOf = (user: User): MenuAction[] => [
    { label: '역할 바꾸기', icon: ShieldCheckIcon, onSelect: () => setPending({ kind: 'role', ids: [user.id] }) },
    ...(user.status === 'invited' ? [{ label: '다시 초대', icon: RefreshCwIcon, onSelect: () => resend.mutate(user) }] : []),
    user.status === 'inactive'
      ? { label: '활성화', icon: RotateCcwIcon, onSelect: () => change.mutate({ ids: [user.id], patch: { status: 'active' } }) }
      : { label: '비활성화', icon: LockIcon, onSelect: () => setPending({ kind: 'deactivate', ids: [user.id] }) },
  ];
  /** 표 머리를 누르면: 같은 열이면 방향을 바꾸고, 다른 열이면 그 열의 오름차순. 표시 메뉴와 같은 주소 값이다. */
  const sortBy = (sort: Display['sort']) => setDisplay(display.sort === sort
    ? { ...display, direction: display.direction === 'asc' ? 'desc' : 'asc' } : { sort, direction: 'asc' });
  const isTweaked = display.sort !== initialDisplay.sort || display.direction !== initialDisplay.direction;
  const subject = (ids: string[]) => (ids.length === 1 ? `${query.data?.find(user => user.id === ids[0])?.name ?? ''}님` : `${ids.length}명`);
  const content = (): ReactNode => {
    if (query.isPending) return <div className="flex flex-1 items-center justify-center"><Spinner aria-label="사용자를 불러오는 중" className="size-6 text-muted-foreground" /></div>;
    if (query.isError && !query.data) return <PageState kind="error" title="사용자를 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
      action={<Button variant="secondary" onClick={() => void query.refetch()}>다시 시도</Button>} />;
    if (items.length === 0 && hasConditions) return <PageState kind="search" title="조건에 맞는 사용자가 없습니다" description="검색어나 필터를 바꿔 보세요."
      action={<Button variant="secondary" onClick={clearConditions}>조건 지우기</Button>} />;
    if (items.length === 0) return <PageState kind="empty" title="아직 사용자가 없습니다" description="팀원을 초대해 문서와 이슈를 함께 다뤄 보세요."
      action={<Button variant="secondary" onClick={() => setInvite(true)}>사용자 초대</Button>} />;
    const allState = chosen.length === 0 ? false : chosen.length === items.length ? true : 'mixed';
    return <>
      {chosen.length > 0 ? <BulkBar count={chosen.length} onRole={() => setPending({ kind: 'role', ids: chosen.map(user => user.id) })}
        onDeactivate={() => setPending({ kind: 'deactivate', ids: chosen.map(user => user.id) })} onClear={() => setPicked(new Set())} /> : null}
      {isMobile
        ? <ul aria-label="사용자" className="flex flex-col">{items.map(user => <UserRow key={user.id} user={user} isPicked={picked.has(user.id)}
          onPick={isOn => toggle(user.id, isOn)} actions={menuOf(user)} />)}</ul>
        : <Table aria-label="사용자" className="table-fixed bg-background">
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-11 w-12 pl-4">
                <Checkbox aria-label="보이는 사용자 모두 선택" checked={allState === true} indeterminate={allState === 'mixed'} onCheckedChange={isOn => selectAll(isOn)} />
              </TableHead>
              <SortHead label="이름" sort="name" display={display} onSort={sortBy} />
              <TableHead className="text-muted-foreground">이메일</TableHead>
              <TableHead className="w-28 text-muted-foreground">역할</TableHead>
              <TableHead className="w-28 text-muted-foreground">상태</TableHead>
              <SortHead label="마지막 접속" sort="lastSeen" display={display} onSort={sortBy} className="w-44 text-right" />
              <TableHead className="w-14 pr-4"><span className="sr-only">동작</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(user => <TableRow key={user.id} data-state={picked.has(user.id) ? 'selected' : undefined} className="bg-background hover:bg-row-hover data-[state=selected]:bg-unread">
              <TableCell className="h-12 pl-4 compact:h-10">
                <Checkbox aria-label={`${user.name} 선택`} checked={picked.has(user.id)} onCheckedChange={isOn => toggle(user.id, isOn)} />
              </TableCell>
              <TableCell><span className="flex min-w-0 items-center gap-2"><PersonAvatar name={user.name} className="size-6" /><span className="truncate font-medium">{user.name}</span></span></TableCell>
              <TableCell className="truncate text-muted-foreground">{user.email}</TableCell>
              <TableCell>{roleLabel(user.role)}</TableCell>
              <TableCell><StatusBadge status={user.status} /></TableCell>
              <TableCell className="text-right text-xs whitespace-nowrap text-muted-foreground tabular-nums">{lastSeenText(user.lastSeen)}</TableCell>
              <TableCell className="pr-4 text-right"><ActionMenu size="row" label={`${user.name} 메뉴`} title={user.name} actions={menuOf(user)} /></TableCell>
            </TableRow>)}
          </TableBody>
        </Table>}
    </>;
  };
  return <Page crumbs={[{ label: '사용자', icon: UsersIcon }]}
    tools={<>
      <SearchTool label="사용자 검색" placeholder="이름과 이메일에서 찾기" value={words} onChange={setWords} />
      <FilterMenu filters={filters} />
      <DisplayMenu isTweaked={isTweaked} onReset={() => setDisplay(initialDisplay)}>
        <DisplayChoice title="정렬" items={sorts} value={display.sort} onChange={sort => setDisplay({ ...display, sort })} />
        <DisplayChoice title="방향" items={directions} value={display.direction} onChange={direction => setDisplay({ ...display, direction })} />
      </DisplayMenu>
    </>}
    below={<>
      {isMobile ? <FilterChips filters={filters} /> : <FilterBar filters={filters} />}
      {change.isError ? <Alert variant="destructive" className="shrink-0 rounded-none border-x-0 border-t-0">
        <TriangleAlertIcon /><AlertTitle>사용자를 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.</AlertTitle>
      </Alert> : null}
    </>}
    create={{ label: '사용자 초대', onClick: () => setInvite(true) }}>
    {content()}
    {isInviting ? <InviteDialog onExpand={panel.href ? panel.expand : undefined} onClose={() => setInvite(false)} /> : null}
    {pending?.kind === 'role' ? <RoleDialog ids={pending.ids} subtitle={subject(pending.ids)} onClose={() => setPending(null)}
      initial={pending.ids.length === 1 ? query.data?.find(user => user.id === pending.ids[0])?.role ?? 'viewer' : 'viewer'} /> : null}
    <ConfirmDialog open={pending?.kind === 'deactivate'} onOpenChange={open => { if (!open) setPending(null); }}
      title={`${subject(pending?.ids ?? [])}을 비활성화할까요?`}
      description="비활성화하면 바로 로그인할 수 없습니다. 언제든 다시 활성화할 수 있습니다."
      action={{ label: '비활성화', isPending: change.isPending, onAction: () => { if (pending) change.mutate({ ids: pending.ids, patch: { status: 'inactive' } }); } }} />
  </Page>;
}

/** 정렬할 수 있는 표 머리: 누르는 버튼이고 지금 정렬이면 방향 화살표와 aria-sort를 둔다. */
function SortHead({ label, sort, display, onSort, className }: {
  label: string; sort: Display['sort']; display: Display; onSort: (sort: Display['sort']) => void; className?: string;
}) {
  const isCurrent = display.sort === sort;
  const Arrow = display.direction === 'asc' ? ArrowUpIcon : ArrowDownIcon;
  return <TableHead aria-sort={isCurrent ? (display.direction === 'asc' ? 'ascending' : 'descending') : undefined} className={cn('text-muted-foreground', className)}>
    <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={() => onSort(sort)}>
      {label}{isCurrent ? <Arrow data-icon="inline-end" /> : null}
    </Button>
  </TableHead>;
}

/** 상태는 색 점과 이름을 함께 보인다. 색은 분류 색 토큰(초록 · 노랑 · 회색). */
const statusDot: Record<'green' | 'yellow' | 'gray', string> = { green: 'bg-event-green-foreground', yellow: 'bg-event-yellow-foreground', gray: 'bg-event-gray-foreground' };
function StatusBadge({ status }: { status: UserStatus }) {
  const each = statusOf(status);
  return <Badge variant="label"><span aria-hidden="true" className={cn('size-1.5 rounded-full', statusDot[each.color])} />{each.label}</Badge>;
}

/** 고른 행의 일괄 동작: 몇 명인지, 동작 둘, 선택 해제. 본문 위에 붙어 목록을 내려도 보인다. 동작 이름은 대상이 여럿임을 싣지 않고 앞의 수가 전한다. */
function BulkBar({ count, onRole, onDeactivate, onClear }: { count: number; onRole: () => void; onDeactivate: () => void; onClear: () => void }) {
  return <div role="region" aria-label="선택한 사용자 동작"
    className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b bg-background px-4 py-2">
    <span role="status" className="font-medium tabular-nums">{count}명 선택</span>
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" size="sm" className="max-md:h-11" onClick={onRole}><ShieldCheckIcon data-icon="inline-start" />역할 바꾸기</Button>
      <Button variant="secondary" size="sm" className="max-md:h-11" onClick={onDeactivate}><LockIcon data-icon="inline-start" />비활성화</Button>
      <Button variant="ghost" size="sm" className="max-md:h-11" onClick={onClear}>선택 해제</Button>
    </div>
  </div>;
}

/** 휴대폰의 행: 앞에 고르기 상자, 이름과 이메일, 끝에 늘 있는 값(역할)과 메뉴. 초대됨 · 비활성만 상태를 덧붙인다. */
function UserRow({ user, isPicked, onPick, actions }: { user: User; isPicked: boolean; onPick: (isOn: boolean) => void; actions: MenuAction[] }) {
  return <li className={cn('flex min-h-16 items-center gap-3 border-b bg-background px-4 py-2', isPicked && 'bg-unread')}>
    <label className="grid size-11 shrink-0 place-items-center"><Checkbox aria-label={`${user.name} 선택`} checked={isPicked} onCheckedChange={onPick} /></label>
    <div className="flex min-w-0 flex-1 flex-col">
      <span className="flex min-w-0 items-center gap-2"><span className="truncate font-medium">{user.name}</span>{user.status === 'active' ? null : <StatusBadge status={user.status} />}</span>
      <span className="truncate text-muted-foreground">{user.email}</span>
    </div>
    <span className="shrink-0 text-sm whitespace-nowrap text-muted-foreground">{roleLabel(user.role)}</span>
    <ActionMenu size="row" label={`${user.name} 메뉴`} title={user.name} actions={actions} />
  </li>;
}
