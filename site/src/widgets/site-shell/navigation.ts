import { contentGroups, skillGroups } from 'virtual:guide-docs';
import { docs } from '@/entities/document';
import type { IconName } from '@/shared/ui/foundations/icons/solar-icon';
import type { NavEntry, NavSpace } from '@/shared/ui/layouts/app/nav';
const entriesOf = (groups: { path: string; label: string; icon: string }[]): NavEntry[] => groups.map(group => ({
  path: group.path, label: group.label, icon: group.icon as IconName,
  children: docs.filter(doc => doc.group === group.path).map(doc => ({ path: doc.path, label: doc.group.startsWith('/webcraft/rules/') && doc.path === doc.group ? '개요' : doc.title })),
}));
const content = (dirs: string[]) => contentGroups.filter(item => dirs.some(dir => item.dir === dir || item.dir.startsWith(`${dir}/`)))
  .map(item => ({ path: `/webcraft/${item.dir}/`, label: item.label, icon: item.icon }));

const rules = (skills: string[]) => skillGroups.filter(item => skills.includes(item.skill))
  .map(item => ({ path: `/webcraft/rules/${item.skill}/`, label: item.label, icon: item.icon }));

/**
 * 메뉴: 소개 → 공통(작업 방식·구조·연결) → 클라이언트(지침·화면 해설·견본) → 서버(지침). 문서 종류가 아니라 영역으로 묶어
 * 화면을 만드는 사람이 지침·해설·견본을 한 묶음 안에서 오간다.
 */
export const guideSpace: NavSpace = {
  id: 'webcraft', title: 'Webcraft',
  sections: [
    { title: '소개', isHeaderHidden: true, entries: [{ path: '/webcraft/', label: '소개', icon: 'home' }] },
    { title: '공통', entries: entriesOf(rules(['webcraft-mode', 'architecture', 'manage-workflow'])) },
    { title: '클라이언트', entries: [...entriesOf(rules(['frontend', 'design-system'])), ...entriesOf(content(['common', 'app-shell', 'catalog']))] },
    { title: '서버', entries: entriesOf(rules(['backend', 'api', 'database'])) },
  ],
};

export const blogSpace: NavSpace = { id: 'blog', title: 'Blog', sections: [{ title: '개발 기록', isHeaderHidden: true, entries: [{ path: '/blog/', label: '모든 글', icon: 'book' }, ...docs.filter(doc => doc.kind === 'post').map(doc => ({ path: doc.path, label: doc.title, icon: 'document' as const }))] }] };

export const settingsSpace: NavSpace = { id: 'settings', title: '설정', back: { path: '/blog/', label: '사이트로' }, sections: [{ title: '설정', isHeaderHidden: true, entries: [{ path: '/settings/appearance/', label: '화면', icon: 'sun' }, { path: '/settings/plugins/', label: '플러그인', icon: 'settings' }] }] };
