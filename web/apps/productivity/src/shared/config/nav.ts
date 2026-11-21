/** A role that opens an administration (the server's: an instance, the workspace). */
export type AdminRole = 'INSTANCE_ADMIN' | 'WORKSPACE_ADMIN';

/**
 * A destination in a side menu: its address, label and Solar meaning name. isHidden keeps it out of the menu while it
 * still names its pages.
 */
export type NavEntry = { path: string; label: string; icon: string; color?: string | null; isHidden?: boolean; isGroup?: boolean; children?: NavEntry[] };
/** A titled group of entries (the title hidden for the menu's first, unnamed group); role: for those who hold it only. */
export type NavSection = { title: string; isHeaderHidden?: boolean; isLabel?: boolean; role?: AdminRole; entries: NavEntry[] };

/**
 * A side menu the frame shows, one per place in the app: the main menu, or one opened from it (내 계정, a project, an
 * administration), which replaces it and leads back with back. The address decides which (spaceOf).
 */
export type NavSpace = {
  id: 'workspace' | 'account' | 'project' | 'project-settings' | 'instance' | 'workspace-admin';
  title: string;
  back?: { label: string; path: string };
  sections: NavSection[];
};

const entry = (path: string, label: string, icon: string, isHidden?: boolean): NavEntry => ({ path, label, icon, isHidden });

/**
 * 어느 공간에도 속하지 않는 것(인스턴스의 주소): 탐색 · 알림함 · 내 업무. 워크스페이스 메뉴 맨 위에 서고, 내 계정 · 관리 ·
 * 프로젝트 설정의 메뉴에는 두지 않는다.
 */
/** 어디서나 보이는 묶음의 이름(머리는 그리지 않는다): 휴대폰 하단의 핵심 메뉴를 셀 때 이 묶음을 뺀다. */
export const GLOBAL_TITLE = '전체';
const GLOBAL: NavSection = { title: GLOBAL_TITLE, isHeaderHidden: true, entries: [
  entry('/search', '탐색', 'search'),
  entry('/inbox', '알림함', 'inbox'),
  entry('/my-work', '내 업무', 'user'),
] };

/** 공간에 속하지 않는 메뉴가 탐색에서 놓이는 곳의 이름. */
export const INSTANCE_WHERE = '인스턴스';

/** The top space: the workspace is the only one. */
export type HomeSpace = 'workspace';

/** 워크스페이스: the projects and the members, then (AppFrame) the projects one is in with their places under them. */
export const WORKSPACE: NavSpace = {
  id: 'workspace', title: '워크스페이스', sections: [
    GLOBAL,
    { title: '워크스페이스', isLabel: true, entries: [
      entry('/workspace/projects', '프로젝트', 'projects'),
      // 업무 공간의 사람들(Linear의 Members): 누가 어느 프로젝트에 속하는지. 프로젝트마다의 멤버 메뉴는 여기로 모았다(2026-11-14).
      entry('/workspace/members', '멤버', 'people'),
    ] },
    // The administrations open from the foot of the menu and one's own menu: their entries stay, hidden, so their
    // addresses keep their routes and 탐색 finds them.
    { title: '관리', entries: [
      entry('/instance', '인스턴스 관리', 'shield', true),
      entry('/workspace/settings', '워크스페이스 관리', 'projects', true),
    ] },
  ],
};

/** The header's tabs: the top space each stands for and where it opens. */
export const TOP_SPACES = [
  { id: 'workspace', label: '코워크', path: '/workspace/projects', icon: 'work' },
] as const;

/** The header tab an address is under: an administration or a project under the space it serves, 내 계정 and 인스턴스 none. */
export function topSpaceOf(space: NavSpace): HomeSpace | undefined {
  if (space.id === 'workspace' || space.id === 'project' || space.id === 'project-settings' || space.id === 'workspace-admin') return 'workspace';
  return undefined;
}

/** The role each of 관리's entries needs. */
const ADMIN_ROLE: Record<string, AdminRole> = { '/instance': 'INSTANCE_ADMIN', '/workspace/settings': 'WORKSPACE_ADMIN' };

const BACK = { label: '돌아가기', path: '/' };

/** 내 계정, opened from one's picture: one's details, notifications, display, agent tokens. */
export const ACCOUNT: NavSpace = {
  id: 'account', title: '내 계정', back: BACK, sections: [
    { title: '내 계정', isHeaderHidden: true, entries: [
      entry('/account/profile', '내 정보', 'user'),
      entry('/account/notifications', '알림 설정', 'bell'),
      entry('/account/display', '화면 설정', 'computer'),
      entry('/account/agents', '내 AI 에이전트', 'agent'),
    ] },
  ],
};

/**
 * 인스턴스 관리: 로고 옆 전환(코워크 ⇕ 인스턴스 관리)에서 연다. 돌아가기 줄 없이 그 전환으로 돌아간다.
 */
export const INSTANCE: NavSpace = {
  id: 'instance', title: '인스턴스 관리', sections: [
    { title: '인스턴스', isHeaderHidden: true, entries: [
      entry('/instance/members', '구성원 · 권한', 'people'),
      entry('/instance/system-status', '시스템 현황', 'dashboard'),
      entry('/instance/push-deliveries', '알림 발송 현황', 'bell'),
    ] },
  ],
};

/** 워크스페이스 관리 across every project, as BIT's workspace settings: general, roles, labels, work types. */
export const WORKSPACE_ADMIN: NavSpace = {
  id: 'workspace-admin', title: '워크스페이스 관리', back: { label: '돌아가기', path: '/workspace/projects' }, sections: [
    { title: '워크스페이스 관리', isHeaderHidden: true, entries: [
      entry('/workspace/settings/general', '일반', 'settings'),
      entry('/workspace/settings/roles', '역할', 'shield'),
      entry('/workspace/settings/work-item-labels', '업무 라벨', 'tag'),
      entry('/workspace/settings/document-labels', '문서 라벨', 'tag'),
      entry('/workspace/settings/work-item-types', '업무 유형', 'tasks'),
    ] },
  ],
};

/** A project's own places (업무 · 사이클 · 문서 · 멤버): under the project in 업무's side menu (Linear's team), and its pages' path. */
export const projectPlaces = (key: string): NavEntry[] => projectSpace(key, key).sections[0]!.entries.filter(each => !each.isHidden);

/**
 * A project's settings (Workspace administrators), as Linear's team settings: a side menu of its own while one is in them,
 * leading back to the project's work items.
 */
export function projectSettingsSpace(key: string, name: string): NavSpace {
  const project = projectSpace(key, name);
  return { id: 'project-settings', title: `${name} 설정`, back: { label: name, path: `/workspace/projects/${key}/work-items` }, sections: [{ ...project.sections[1]!, isHeaderHidden: true }] };
}

/** One project's places and settings, as BIT's: the path of its pages (crumbsOf) and the settings' menu. */
export function projectSpace(key: string, name: string): NavSpace {
  const at = (path: string) => `/workspace/projects/${key}${path}`;
  return {
    id: 'project', title: name, back: { label: '프로젝트 목록', path: '/workspace/projects' }, sections: [
      { title: name, isHeaderHidden: true, entries: [
        // 프로젝트의 일정은 메뉴에서 뺐다(워크스페이스 일정으로 본다). 주소는 남는다.
        // 개요가 프로젝트의 첫 화면이다(주소는 프로젝트 자체, 2026-11-15).
        entry(at(''), '개요', 'home'),
        entry(at('/work-items'), '업무', 'tasks'),
        entry(at('/cycles'), '사이클', 'repeat'),
        entry(at('/documents'), '문서', 'folder'),
        // 프로젝트 메뉴에서는 뺐다(업무 › 워크스페이스 › 멤버로 모음). 주소와 경로 표시는 남는다.
        entry(at('/members'), '멤버', 'people', true),
      ] },
      // 그 프로젝트의 관리자가 본다(주소의 문지기가 can.manage로 막는다, router projectSettingsRoute).
      { title: '관리', entries: [
        entry(at('/settings/general'), '일반', 'settings'),
        entry(at('/settings/workflow'), '워크플로', 'workflow'),
        entry(at('/settings/cycles'), '사이클', 'repeat'),
        entry(at('/settings/members'), '멤버', 'people'),
        entry(at('/settings/integrations'), '저장소 연동', 'branch'),
      ] },
    ],
  };
}

/** The project key an address is in (/workspace/projects/cowork/work-items → cowork), none for the list. */
export function projectKeyOf(pathname: string): string | undefined {
  const key = /^\/workspace\/projects\/([^/]+)/.exec(pathname)?.[1];
  return key ? decodeURIComponent(key) : undefined;
}

/** The place an address is in, for its pages' path (crumbsOf): a project's own when it is in one. */
function placeOf(pathname: string, projectName?: string): NavSpace {
  const key = projectKeyOf(pathname);
  return key ? projectSpace(key, projectName ?? key) : spaceOf(pathname, projectName);
}

/**
 * The side menu an address shows; a project's needs its name (projectName), its key standing in until it is known. A
 * project's pages stay in 업무's menu, the project unfolded there with its places (Linear, 2026-11-14); its settings have
 * a menu of their own.
 */
export function spaceOf(pathname: string, projectName?: string): NavSpace {
  if (pathname === '/account' || pathname.startsWith('/account/')) return ACCOUNT;
  if (pathname.startsWith('/instance')) return INSTANCE;
  if (pathname.startsWith('/workspace/settings')) return WORKSPACE_ADMIN;
  const key = projectKeyOf(pathname);
  if (key && /^\/workspace\/projects\/[^/]+\/settings(\/|$)/.test(pathname)) return projectSettingsSpace(key, projectName ?? key);
  return WORKSPACE;
}

/** A menu as one holding these roles sees it: sections for a role they lack left out, 관리's entries likewise. */
export function visibleSections(space: NavSpace, roles: readonly string[]): NavSection[] {
  return space.sections
    .filter(section => !section.role || roles.includes(section.role))
    .map(section => ({ ...section, entries: section.entries.filter(item => !item.isHidden && (!ADMIN_ROLE[item.path] || roles.includes(ADMIN_ROLE[item.path]))) }))
    .filter(section => section.entries.length > 0);
}

/** A page one can go to by name (검색): its menu's entry, and where it stands (워크스페이스, 내 계정, 워크스페이스 관리). */
export type NavPlace = NavEntry & { where: string };

/**
 * Every page of the fixed menus one may open, as 검색 finds them by name: the main menu's (받은 알림 among them, kept out
 * of the menu itself), 내 계정's, and each administration whose role one holds.
 */
export function navPlaces(roles: readonly string[]): NavPlace[] {
  return FIXED_SPACES.filter(space => { const role = roleOfSpace(space); return !role || roles.includes(role); })
    .flatMap(space => space.sections.filter(section => !section.role || roles.includes(section.role)).flatMap(section => section.entries
      .filter(item => !ADMIN_ROLE[item.path] || roles.includes(ADMIN_ROLE[item.path]))
      // 탐색 · 알림함 · 내 업무는 어느 공간의 것도 아니다: 인스턴스로 적는다(두 공간 메뉴에 함께 서도).
      .map(item => ({ ...item, where: GLOBAL.entries.some(each => each.path === item.path) ? INSTANCE_WHERE : space.title }))));
}

/** The entry in view: the longest path the address is or starts with. */
export function entryOf(space: NavSpace, pathname: string): NavEntry | undefined {
  return space.sections.flatMap(section => section.entries)
    .filter(item => pathname === item.path || pathname.startsWith(`${item.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];
}

/** Every entry of the fixed menus, for the router; a project's are made per key. */
export const FIXED_SPACES: NavSpace[] = [WORKSPACE, ACCOUNT, INSTANCE, WORKSPACE_ADMIN];

/** The role an administration's addresses need. */
export const roleOfSpace = (space: NavSpace): AdminRole | undefined =>
  space.id === 'instance' ? 'INSTANCE_ADMIN' : space.id === 'workspace-admin' ? 'WORKSPACE_ADMIN' : undefined;

/** The path to a page in its head: the menu's section (or the space's title off the main menu), then the entry. */
export function crumbsOf(pathname: string, projectName?: string): { label: string; icon?: string; href?: string }[] {
  const space = placeOf(pathname, projectName);
  const item = entryOf(space, pathname);
  if (!item) return [{ label: space.title }];
  // The top spaces' pages stand by their own name, as Linear's: the space and its group titles are not steps.
  if (space.id === 'workspace') return [{ label: item.label, icon: item.icon }];
  if (space.id === 'project') return [{ label: '프로젝트', href: '/workspace/projects' }, { label: space.title, icon: 'projects' }, { label: item.label, icon: item.icon }];
  return [{ label: space.title }, { label: item.label, icon: item.icon }];
}

