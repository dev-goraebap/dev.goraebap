// 가이드 메뉴: 문서 폴더를 묶음으로, 문서를 그 아래 목적지로 둔다. 순서는 이 표와 각 문서의 sidebar.order가 정한다.
import { getCollection } from 'astro:content';
import type { IconName } from '@kit/foundations/icons/solar-icon';
import type { NavSpace } from '@kit/layouts/app/nav';

type Group = { dir: string; label: string; icon: IconName };
type Section = { title: string; isHeaderHidden?: boolean; groups: Group[] };

const sections: Section[] = [
  { title: '규칙', isHeaderHidden: true, groups: [
    { dir: 'start', label: '시작하기', icon: 'book' },
    { dir: 'common', label: '공통', icon: 'layout-grid' },
    { dir: 'app-shell', label: '앱 셸', icon: 'sidebar' },
    { dir: 'landing', label: '랜딩 (준비 중)', icon: 'home' },
  ] },
  { title: '견본', groups: [
    { dir: 'catalog/foundations', label: 'Foundations (디자인 기초)', icon: 'sun' },
    { dir: 'catalog/primitives', label: 'Primitives (기본 부품)', icon: 'edit' },
    { dir: 'catalog/composites', label: 'Composites (조합 부품)', icon: 'copy' },
    { dir: 'catalog/layouts', label: 'Layouts (레이아웃)', icon: 'layout-board' },
    { dir: 'catalog/patterns', label: 'Patterns (사용 패턴)', icon: 'grip' },
    { dir: 'catalog/playground', label: 'Playground (플레이그라운드)', icon: 'library' },
  ] },
  { title: '참고', groups: [{ dir: 'references', label: '레퍼런스', icon: 'link' }] },
];

export type GuidePage = { path: string; title: string; description?: string; group: string; groupPath: string; id: string };

const pathOf = (id: string) => (id === 'index' ? '/' : `/${id.replace(/\/index$/, '')}/`);

/** 메뉴 순서대로 늘어선 모든 문서. */
export async function guidePages(): Promise<GuidePage[]> {
  const docs = await getCollection('docs');
  return sections.flatMap((section) => section.groups).flatMap((group) => docs
    .filter((doc) => doc.id.startsWith(`${group.dir}/`) || doc.id === group.dir)
    .sort((a, b) => (a.data.sidebar?.order ?? 99) - (b.data.sidebar?.order ?? 99) || a.data.title.localeCompare(b.data.title))
    .map((doc) => ({ path: pathOf(doc.id), title: doc.data.title, description: doc.data.description, group: group.label, groupPath: `/${group.dir}/`, id: doc.id })));
}

export async function guideSpace(): Promise<NavSpace> {
  const pages = await guidePages();
  return {
    id: 'guide', title: '고래밥 화면 규칙',
    sections: sections.map((section) => ({
      title: section.title, isHeaderHidden: section.isHeaderHidden,
      entries: section.groups.map((group) => ({
        path: `/${group.dir}/`, label: group.label, icon: group.icon,
        children: pages.filter((page) => page.groupPath === `/${group.dir}/`).map((page) => ({ path: page.path, label: page.title })),
      })),
    })),
  };
}

/** 묶음 주소(예: /app-shell/)로 들어오면 그 묶음의 첫 문서로 보낸다. */
export async function groupEntries() {
  const pages = await guidePages();
  return sections.flatMap((section) => section.groups).map((group) => ({
    path: `/${group.dir}/`, first: pages.find((page) => page.groupPath === `/${group.dir}/`)?.path,
  })).filter((group): group is { path: string; first: string } => !!group.first && group.first !== group.path);
}
