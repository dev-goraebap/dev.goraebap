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

const rules = (skills: string[]) => skillGroups.filter(item => skills.includes(item.skill))
  .map(item => ({ path: `/rules/${item.skill}/`, label: item.label, icon: item.icon }));

/**
 * 메뉴: 소개 → 공통(작업 방식·구조·연결) → 클라이언트(지침·화면 해설·견본) → 서버(지침). 문서 종류가 아니라 영역으로 묶어
 * 화면을 만드는 사람이 지침·해설·견본을 한 묶음 안에서 오간다.
 */
export const guideSpace: NavSpace = {
  id: 'guide', title: '웹 플랫폼 매뉴얼',
  sections: [
    { title: '소개', isHeaderHidden: true, entries: [{ path: '/', label: '소개', icon: 'home' }] },
    { title: '공통', entries: entriesOf(rules(['goraebap-mode', 'architecture', 'manage-workflow'])) },
    { title: '클라이언트', entries: [...entriesOf(rules(['frontend', 'design-system'])), ...entriesOf(content(['common', 'app-shell', 'catalog']))] },
    { title: '서버', entries: entriesOf(rules(['backend', 'api', 'database'])) },
  ],
};
