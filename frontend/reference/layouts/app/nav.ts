import type { IconName } from '../../foundations/icons/solar-icon';

/** 메뉴의 목적지: 주소, 이름, 아이콘 의미 이름. children은 펼칠 수 있는 하위 목적지이며 상위의 아이콘을 이어받아 아이콘을 생략할 수 있다. */
export type NavEntry = { path: string; label: string; icon?: IconName; children?: NavEntry[]; badge?: number };
/** 이름 있는 묶음. 첫 묶음처럼 이름이 필요 없으면 isHeaderHidden. */
export type NavSection = { title: string; isHeaderHidden?: boolean; entries: NavEntry[] };
/**
 * 화면에 보이는 메뉴 한 벌. 주 메뉴, 또는 주 메뉴에서 연 하위 공간(내 계정·관리 등)이 주 메뉴를 대체하고 back으로
 * 돌아간다. 어느 공간인지는 주소가 정한다.
 */
export type NavSpace = { id: string; title: string; back?: { label: string; path: string }; sections: NavSection[] };

/** 주소에 해당하는 메뉴 항목: 가장 긴 접두사. */
export function entryOf(space: NavSpace, pathname: string): NavEntry | undefined {
  const entries = space.sections.flatMap(section => section.entries).flatMap(entry => [entry, ...(entry.children ?? [])]);
  return entries
    .filter(entry => { const base = entry.path.split('?')[0]; return pathname === base || pathname.startsWith(`${base}/`); })
    .sort((a, b) => b.path.length - a.path.length)[0];
}
