import type { ComponentType } from 'react';
import { contentGroups, docs, skillGroups } from 'virtual:guide-docs';
import type { IconName } from '@kit/foundations/icons/solar-icon';
import type { NavEntry, NavSpace } from '@kit/layouts/app/nav';
import type { GuideDoc } from '../content-plugin';

export type { GuideDoc };
export { docs };

// 문서 본문은 열 때 불러온다. 키는 vite가 이 파일 기준 상대 경로로 준다.
const loaders = import.meta.glob<{ default: ComponentType }>(['../../../plugin/skills/**/*.md', '../content/**/*.{md,mdx}']);
const keyOf = (doc: GuideDoc) => (doc.source.startsWith('kit/guide/') ? `../${doc.source.slice('kit/guide/'.length)}` : `../../../${doc.source}`);

export async function loadDoc(doc: GuideDoc) {
  const load = loaders[keyOf(doc)];
  if (!load) throw new Error(`문서 본문이 없습니다: ${doc.source}`);
  return (await load()).default;
}

export const docAt = (path: string) => docs.find(doc => doc.path === path);
const label = (group: string) => [...skillGroups.map(item => ({ path: `/rules/${item.skill}/`, label: item.label })),
  ...contentGroups.map(item => ({ path: `/${item.dir}/`, label: item.label }))].find(item => item.path === group)?.label ?? '';
export const groupLabel = label;

/** 묶음 주소(예: /app-shell/)의 첫 문서. 지침은 묶음 주소가 곧 그 지침의 첫 장이다. */
export const firstOf = (group: string) => docs.find(doc => doc.group === group)?.path;

/** 문서 찾기 목록. */
export const searchEntries = docs.map(doc => ({ id: doc.path, label: doc.title, group: label(doc.group), description: doc.description }));

const entriesOf = (groups: { path: string; label: string; icon: string }[]): NavEntry[] => groups.map(group => ({
  path: group.path, label: group.label, icon: group.icon as IconName,
  children: docs.filter(doc => doc.group === group.path).map(doc => ({ path: doc.path, label: doc.group.startsWith('/rules/') && doc.path === doc.group ? '개요' : doc.title })),
}));
const content = (dirs: string[]) => contentGroups.filter(item => dirs.some(dir => item.dir === dir || item.dir.startsWith(`${dir}/`)))
  .map(item => ({ path: `/${item.dir}/`, label: item.label, icon: item.icon }));

/** 메뉴: 시작하기 → 지침(플러그인 스킬) → 화면 해설 → 견본 → 참고. */
export const guideSpace: NavSpace = {
  id: 'guide', title: '고래밥 지침',
  sections: [
    { title: '시작하기', isHeaderHidden: true, entries: entriesOf(content(['start'])) },
    { title: '지침', entries: entriesOf(skillGroups.map(item => ({ path: `/rules/${item.skill}/`, label: item.label, icon: item.icon }))) },
    { title: '화면 해설', entries: entriesOf(content(['common', 'app-shell', 'landing'])) },
    { title: '견본', entries: entriesOf(content(['catalog'])) },
    { title: '참고', entries: entriesOf(content(['references'])) },
  ],
};
