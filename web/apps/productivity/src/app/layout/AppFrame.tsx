import { Link, useNavigate } from '@tanstack/react-router';
import { type ReactNode } from 'react';
import { cn } from 'cn';
import { AgentBar, AppShell, MeButton, type NavEntry as ShellEntry, type NavSpace as ShellSpace, type ShellMe } from '@/shared/ui/kit/layout/app-shell';
import { Barcode } from './Barcode';
import { BrandMark } from '@/shared/ui/brand';
import { Button } from '@/shared/ui/kit/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/ui/kit/dropdown-menu';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, InboxIcon, LinkIcon, LogoutIcon, MonitorIcon, PlusIcon, SettingsIcon, SparklesIcon, UserIcon, type Icon } from '@/shared/ui/kit/icon';
import { toast } from '@/shared/ui/kit/toast';
import { markTone, MarkIcon } from '@/shared/ui/mark-picker';
import { GLOBAL_TITLE, INSTANCE, projectKeyOf, projectPlaces, spaceOf, TOP_SPACES, topSpaceOf, visibleSections, WORKSPACE, type AdminRole, type NavEntry, type NavSection, type NavSpace } from '@/shared/config';
import { navIcon } from '@/shared/ui/nav-icon';

export type ShellLayout = 'inset' | 'split';

/** 받은 알림's name for a screen reader, with what waits in it. */
const activityLabel = (unread: number, awaitingApprovals: number) =>
  ['알림함', unread > 0 && `읽지 않은 알림 ${unread}건`, awaitingApprovals > 0 && `결재 대기 ${awaitingApprovals}건`].filter(Boolean).join(', ');

/** A menu entry's picture: its icon by meaning name, or a mark (a picked `s:` icon or a colour) drawn as data. */
function entryIcon(entry: NavEntry): Pick<ShellEntry, 'icon' | 'media'> {
  if (!entry.color && !entry.icon.startsWith('s:')) return { icon: navIcon(entry.icon) };
  // check-ui: allow-style 표식의 색은 사용자가 고른 데이터다.
  return { media: <span style={markTone(entry.color)} className="flex text-(--mark,currentColor) [&_svg]:size-4"><MarkIcon name={entry.icon} /></span> };
}

/** The administrations one's roles open, in one's menu (관리 left the side menu for the header's tabs, 2026-11-13). */
/**
 * 공간마다 그 공간의 관리 화면(2026-11-14): 권한이 있으면 그 공간 사이드바 맨 아래에 둔다. 인스턴스 전체의 설정(인스턴스
 * 설정)은 어느 공간에도 속하지 않아 공간 전환 메뉴 아래의 톱니바퀴로 연다.
 */
const SPACE_ADMINISTRATIONS: Record<string, { path: string; label: string; icon: string; role: AdminRole }> = {
  workspace: { path: '/workspace/settings', label: '워크스페이스 관리', icon: 'settings', role: 'WORKSPACE_ADMIN' },
};
const INSTANCE_SETTINGS = { path: '/instance', label: '인스턴스 관리', role: 'INSTANCE_ADMIN' as AdminRole };

/** 받은 알림's icon: yellow and gently pulsing while something waits (unread notices or approvals for me). */
const activityIcon = (needsAttention: boolean): Icon => {
  const Activity: Icon = ({ className, chosen, ...props }) => (
    <InboxIcon {...props} chosen={chosen && !needsAttention}
      className={cn(className, needsAttention && 'text-mark-medium motion-safe:animate-pulse')} />
  );
  return Activity;
};

/**
 * The application frame on the kit's AppShell (the inset layout: a raised, rounded page on the menu's ground; split divides
 * them with rules). A desktop's header runs the full width: the logo over the side menu, the top spaces' tabs (오피스 ·
 * 업무) from the page's left edge, 검색 in the middle, 알림함 and one's picture (one's menu, with the administrations one's
 * roles open) at the end. The side menu is the one the address belongs to (오피스, 업무, a project, 내 계정, an
 * administration; spaceOf), entries one's roles do not open left out; one opened from a space leads back from its top. The
 * release sits at its foot. A phone has no header nor side menu: its bottom tabs and 더보기, with 검색 · 받은 알림 · one's
 * picture on the page's app bar.
 */
export function AppFrame({ pathname, search = '', myProjects = [], onCreateProject, projectName, layout = 'inset', roles = [], me, unread = 0, awaitingApprovals = 0, version, onSearch, onLogout, children }: {
  /** The address in view, which decides the menu and its chosen entry. */
  pathname: string;
  search?: string;
  /** 내가 멤버인 프로젝트(업무 메뉴의 프로젝트 묶음), 프로젝트 목록의 순서로. */
  myProjects?: readonly { key: string; name: string; icon?: string | null; color?: string | null; favorite?: boolean }[];
  /** 업무 사이드바 '내 프로젝트' 머리의 +(워크스페이스 관리자만): 새 프로젝트 대화상자를 연다. */
  onCreateProject?: () => void;
  /** The name of the project the address is in, for its menu's title. */
  projectName?: string;
  layout?: ShellLayout;
  /** The member's administrator roles: 관리 and a project's settings show by them. */
  roles?: readonly string[];
  /** One's own name, team and picture. */
  me: { name: string; team: string; picture: string; fallbackPicture?: string };
  /** 읽지 않은 알림 수와 내 결재를 기다리는 요청 수. */
  unread?: number;
  awaitingApprovals?: number;
  /** The release at the foot of the menu, as v2.6.0-rc.2. */
  version: string;
  /** Opens the search over everything (검색, and Ctrl/⌘+K where the app listens). */
  onSearch?: () => void;
  onLogout?: () => void;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const space = spaceOf(pathname, projectName);
  const sections = visibleSections(space, roles);
  const needsActivity = unread > 0 || awaitingApprovals > 0;
  const query = new URLSearchParams(search);

  // A view of a page (?view=) is current when the address is that page with that view.
  const isCurrentView = (path: string) => {
    const [base, at] = path.split('?');
    return at ? pathname === base && [...new URLSearchParams(at)].every(([key, value]) => query.get(key) === value) : undefined;
  };
  // 업무 메뉴의 프로젝트(Linear의 팀): 이름 줄은 누르면 접고 펴기만 하고, 그 아래에 업무 · 사이클 · 문서 · 멤버가 선다.
  // 프로젝트는 그 표식(아이콘 · 색)으로 보인다. 내가 멤버인 것, 그리고 멤버가 아닌 프로젝트에 들어가 있으면 그것도.
  type ProjectRow = { key: string; name: string; icon?: string | null; color?: string | null; favorite?: boolean; can?: { manage?: boolean } };
  // 프로젝트 줄 끝 … 메뉴(Linear의 팀 메뉴): 프로젝트 설정(그 프로젝트의 관리자) · 주소 복사. 즐겨찾기는 뺐다(2026-11-15).
  const projectMenu = (project: ProjectRow) => {
    const at = `/workspace/projects/${encodeURIComponent(project.key)}`;
    const copy = () => void navigator.clipboard.writeText(`${window.location.origin}${at}/work-items`)
      .then(() => toast.add({ title: '주소를 복사했습니다.' }), () => toast.add({ title: '주소를 복사하지 못했습니다.' }));
    return <>
      {project.can?.manage && <DropdownMenuItem onClick={() => go(`${at}/settings/general`)}><SettingsIcon />프로젝트 설정</DropdownMenuItem>}
      <DropdownMenuItem onClick={copy}><LinkIcon />주소 복사</DropdownMenuItem>
    </>;
  };
  const menus = new Map<string, ReactNode>();
  const projectGroup = (project: ProjectRow): NavEntry => ({
    path: `/workspace/projects/${encodeURIComponent(project.key)}/work-items`, label: project.name, icon: project.icon ?? 'projects', color: project.color,
    isGroup: true, children: projectPlaces(project.key),
  });
  const currentKey = projectKeyOf(pathname);
  // 멤버가 아닌 프로젝트는 찾을 수 없다: 그 이름을 읽었을 때만(볼 수 있을 때만) 보고 있는 프로젝트로 둔다.
  const viewing = currentKey && projectName && !myProjects.some(project => project.key === currentKey) ? { key: currentKey, name: projectName } : undefined;
  for (const project of [...myProjects, ...(viewing ? [viewing] : [])]) menus.set(`/workspace/projects/${encodeURIComponent(project.key)}/work-items`, projectMenu(project));
  // 프로젝트를 만들 수 있으면 멤버인 프로젝트가 없어도 '내 프로젝트' 머리를 두어 +가 설 자리를 둔다.
  const projectSections: NavSection[] = [
    ...(myProjects.length > 0 || onCreateProject ? [{ title: '내 프로젝트', entries: myProjects.map(projectGroup) }] : []),
    ...(viewing ? [{ title: '보고 있는 프로젝트', entries: [projectGroup(viewing)] }] : []),
  ];
  const withProjects = (each: NavSpace, list: NavSection[]) => (each.id === 'workspace' ? [...list, ...projectSections] : list);
  const childrenOf = (entry: NavEntry): NavEntry[] | undefined => entry.children;
  const toShell = (entry: NavEntry): ShellEntry => {
    const [path, at] = entry.path.split('?');
    const isActivity = entry.path === '/inbox';
    // 탐색(2026-11-15): 오피스 · 워크스페이스 메뉴 맨 위의 항목. 누르면 주소로 가지 않고 검색 창이 열린다(Ctrl/⌘+K).
    const isExplore = entry.path === '/search';
    return {
      path, search: at ? Object.fromEntries(new URLSearchParams(at)) : undefined, label: entry.label,
      ...(isExplore ? { onSelect: onSearch } : {}),
      ...(isActivity ? { icon: activityIcon(needsActivity) } : entryIcon(entry)),
      // 받은 알림 opens from the phone's app bar, not its tabs.
      isPhoneHidden: isActivity || isExplore || undefined,
      badge: isActivity && awaitingApprovals > 0 ? awaitingApprovals : undefined,
      isCurrent: isCurrentView(entry.path) ?? (entry.path === '/workspace/documents' && query.has('system') ? false : undefined),
      isGroup: entry.isGroup,
      menu: entry.isGroup ? menus.get(entry.path) : undefined,
      children: childrenOf(entry)?.map(toShell),
    };
  };
  const toShellSection = (section: NavSection) => ({ ...section, entries: section.entries.map(toShell),
    action: section.title === '내 프로젝트' && onCreateProject ? { label: '새 프로젝트', icon: PlusIcon, onClick: onCreateProject } : undefined });
  const toShellSpace = (each: NavSpace): ShellSpace => ({ id: each.id, title: each.title, back: each.back,
    sections: withProjects(each, visibleSections(each, roles)).map(toShellSection) });
  const shellSpace: ShellSpace = { ...toShellSpace(space), sections: withProjects(space, sections).map(toShellSection) };
  // 휴대폰 하단(Linear 모바일): 맨 앞은 늘 알림함, 그 뒤 두 칸은 지금 공간의 핵심 메뉴 둘이다(2026-11-15). 데스크톱 사이드바가
  // 공간마다 달라지듯 오피스는 일정 · 근태·휴가, 워크스페이스는 프로젝트 · 멤버, 관리 · 내 계정 · 설정 공간은 그 메뉴의 앞 둘.
  // 어디서나 보이는 묶음(탐색 · 알림함 · 내 업무)은 세지 않는다. 그 옆은 메뉴 시트(머리에서 오피스 ⇕ 워크스페이스).
  const core = sections.filter(section => section.title !== GLOBAL_TITLE).flatMap(section => section.entries).slice(0, 2);
  const phoneTabs: ShellEntry[] = [
    { path: '/inbox', label: activityLabel(unread, awaitingApprovals), icon: activityIcon(needsActivity), badge: awaitingApprovals > 0 ? awaitingApprovals : undefined },
    ...core.map(entry => ({ path: entry.path, label: entry.label, icon: navIcon(entry.icon) })),
  ];

  const go = (path: string) => void navigate({ href: path });
  const administration = space.id === 'workspace' ? SPACE_ADMINISTRATIONS[space.id] : undefined;
  const adminEntries: ShellEntry[] = administration && roles.includes(administration.role)
    ? [{ path: administration.path, label: administration.label, icon: navIcon(administration.icon) }] : [];
  const canSetInstance = roles.includes(INSTANCE_SETTINGS.role);
  // 휴대폰 메뉴 시트: 머리의 코워크 ⇕ 인스턴스 관리(데스크톱의 로고 옆 전환)로 둘을 바꿔 보고, 코워크 메뉴 아래 구분선 뒤에
  // 워크스페이스 관리(데스크톱의 사이드바 바닥)를 둔다. 관리 화면은 내 메뉴에 두지 않는다.
  const workspaceAdmin = SPACE_ADMINISTRATIONS.workspace!;
  const phoneSpaces = [
    ...TOP_SPACES.map(each => ({ id: each.id, label: each.label, icon: navIcon(each.icon), space: toShellSpace(WORKSPACE),
      footer: roles.includes(workspaceAdmin.role) ? [{ path: workspaceAdmin.path, label: workspaceAdmin.label, icon: navIcon(workspaceAdmin.icon) }] : undefined })),
    ...(canSetInstance ? [{ id: 'instance', label: INSTANCE_SETTINGS.label, icon: navIcon('settings'), space: toShellSpace(INSTANCE) }] : []),
  ];
  const shellMe: ShellMe = {
    name: me.name, detail: me.team, picture: me.picture || me.fallbackPicture,
    groups: [
      [
        { label: '내 정보', icon: UserIcon, onSelect: () => go('/account/profile') },
        { label: '화면 설정', icon: MonitorIcon, onSelect: () => go('/account/display') },
        { label: '내 AI 에이전트', icon: SparklesIcon, onSelect: () => go('/account/agents') },
      ],
      onLogout ? [{ label: '로그아웃', icon: LogoutIcon, onSelect: onLogout }] : [],
    ],
  };
  const headerTools = <MeButton me={shellMe} align="end" size="sm" />;
  // 로고 옆 전환: 코워크 ⇕ 인스턴스 관리. 지금 있는 곳의 아이콘 · 이름과 위아래 꺾쇠, 누르면 둘을 고르는 메뉴. 인스턴스 관리는
  // 그 권한이 있을 때만 메뉴에 선다. 접은 사이드바에서는 아이콘만.
  const top = topSpaceOf(space);
  const isInstance = space.id === 'instance';
  const shown = isInstance ? { label: INSTANCE_SETTINGS.label, icon: 'settings' } : TOP_SPACES.find(each => each.id === top) ?? TOP_SPACES[0];
  const ShownIcon = navIcon(shown.icon);
  const spaceSwitcher = (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button variant="ghost" size="sm" aria-label={`지금: ${shown.label}, 바꾸기`}
          className="h-8 gap-1.5 px-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:px-0">
          <ShownIcon chosen className="size-4 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">{shown.label}</span>
          <span aria-hidden className="flex flex-col text-icon-muted group-data-[collapsible=icon]:hidden [&_svg]:size-2.5">
            <ChevronUpIcon className="-mb-0.5" /><ChevronDownIcon className="-mt-0.5" />
          </span>
        </Button>
      } />
      <DropdownMenuContent align="start" className="min-w-40">
        {TOP_SPACES.map(each => {
          const SpaceIcon = navIcon(each.icon);
          const isHere = !isInstance && each.id === top;
          return <DropdownMenuItem key={each.id} onClick={() => go(each.path)}>
            <SpaceIcon chosen={isHere} />{each.label}{isHere && <CheckIcon className="ml-auto" />}
          </DropdownMenuItem>;
        })}
        {canSetInstance && <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => go(INSTANCE_SETTINGS.path)}>
            <SettingsIcon chosen={isInstance} />{INSTANCE_SETTINGS.label}{isInstance && <CheckIcon className="ml-auto" />}
          </DropdownMenuItem>
        </>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
  const brand = <>
    <Link to="/workspace/projects" aria-label="홈, 프로젝트" className="flex shrink-0 items-center pl-2 group-data-[collapsible=icon]:pl-0"><BrandMark /></Link>
    {spaceSwitcher}
  </>;
  return (
    <AppShell space={shellSpace} pathname={pathname} layout={layout} me={shellMe} hasMeBox={false} adminEntries={adminEntries}
      brand={brand} headerTools={headerTools}
      // 데스크톱 화면 아래 줄(2026-11-15 되살림): 왼쪽 끝에 버전, 오른쪽 끝에 에이전트(내 AI 에이전트로)와 그 왼쪽 바코드 장식. 휴대폰에는 없다.
      bottomBar={<AgentBar onOpen={() => go('/account/agents')} start={<span className="tabular-nums">{version}</span>}><Barcode /></AgentBar>}
      phoneBar={{ tabs: phoneTabs, spaces: phoneSpaces, currentSpaceId: space.id === 'instance' ? 'instance' : topSpaceOf(space), onSearch }}>
      {children}
    </AppShell>
  );
}

