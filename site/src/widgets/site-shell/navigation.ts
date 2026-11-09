import { architectureSections, contentGroups, skillGroups } from 'virtual:guide-docs';
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

const sectionPath = (id: string) => `/webcraft/architecture/${id.replace('.', '-')}/`;
/** 지침이 먼저, 화면 해설이 뒤에. 같은 종류 안에서는 문서 목록의 순서를 지킨다. */
const isRule = (source: string) => source.startsWith('plugins/');
/** 절에 놓이는 문서: 프론트매터 arc42의 첫 값이 그 절인 것. */
const docsIn = (id: string): NavEntry[] => docs.filter(doc => doc.arc42?.[0] === id)
  .sort((a, b) => Number(isRule(b.source)) - Number(isRule(a.source)))
  .map(doc => ({ path: doc.path, label: doc.title }));
const sectionEntry = (section: (typeof architectureSections)[number]): NavEntry => {
  const subsections = architectureSections.filter(item => item.id.startsWith(`${section.id}.`));
  return { path: sectionPath(section.id), label: `${section.id}. ${section.label}`, icon: section.icon as IconName | undefined,
    children: subsections.length ? subsections.map(sectionEntry) : docsIn(section.id) };
};

/**
 * 메뉴: 소개(작업 방식·프로젝트 연결) → 아키텍처(arc42 절, 지침과 해설을 절마다) → UI 키트(부품과 견본). 규칙은 아키텍처의
 * 절에서 찾고, 규칙대로 만든 부품과 견본은 UI 키트에서 본다. 백엔드·프론트를 따로 나누지 않고 8절의 하위 절로 가른다.
 */
export const guideSpace: NavSpace = {
  id: 'webcraft', title: 'Webcraft',
  sections: [
    { title: '소개', isHeaderHidden: true, entries: [{ path: '/webcraft/', label: '소개', icon: 'home' }, ...entriesOf(rules(['goraebap-mode', 'manage-workflow']))] },
    { title: '아키텍처', entries: architectureSections.filter(section => !section.id.includes('.')).map(sectionEntry) },
    { title: 'UI 키트', entries: entriesOf(content(['catalog'])) },
  ],
};

export const blogSpace: NavSpace = { id: 'blog', title: 'Blog', sections: [{ title: '개발 기록', isHeaderHidden: true, entries: [{ path: '/blog/', label: '모든 글', icon: 'book' }, ...docs.filter(doc => doc.kind === 'post').map(doc => ({ path: doc.path, label: doc.title, icon: 'document' as const }))] }] };

export const settingsSpace: NavSpace = { id: 'settings', title: '설정', back: { path: '/blog/', label: '사이트로' }, sections: [{ title: '설정', isHeaderHidden: true, entries: [{ path: '/settings/appearance/', label: '화면', icon: 'sun' }, { path: '/settings/plugins/', label: '플러그인', icon: 'settings' }] }] };
