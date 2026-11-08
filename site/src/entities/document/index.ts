import type { ComponentType } from 'react';
import { contentGroups, docs, skillGroups } from 'virtual:guide-docs';
import type { GuideDoc } from '../../../content-plugin';

export type { GuideDoc };
export { docs };

// 문서 본문은 열 때 불러온다. 키는 vite가 이 파일 기준 상대 경로로 준다.
const loaders = import.meta.glob<{ default: ComponentType }>(['../../../../plugins/webcraft/skills/**/*.md', '../../../content/**/*.{md,mdx}']);
const keyOf = (doc: GuideDoc) => doc.source.startsWith('site/') ? `../../../${doc.source.slice('site/'.length)}` : `../../../../${doc.source}`;

export async function loadDoc(doc: GuideDoc) {
  const load = loaders[keyOf(doc)];
  if (!load) throw new Error(`문서 본문이 없습니다: ${doc.source}`);
  return (await load()).default;
}

export const docAt = (path: string) => docs.find(doc => doc.path === path);
const label = (group: string) => group === '/blog/' ? 'Blog' : [...skillGroups.map(item => ({ path: `/webcraft/rules/${item.skill}/`, label: item.label })),
  ...contentGroups.map(item => ({ path: `/webcraft/${item.dir}/`, label: item.label }))].find(item => item.path === group)?.label ?? '';
export const groupLabel = label;

/** 묶음 주소(예: /app-shell/)의 첫 문서. 지침은 묶음 주소가 곧 그 지침의 첫 장이다. */
export const firstOf = (group: string) => docs.find(doc => doc.group === group)?.path;

/** 문서 찾기 목록. */
export const searchEntries = docs.map(doc => ({ id: doc.path, label: doc.title, group: label(doc.group), description: doc.description }));
