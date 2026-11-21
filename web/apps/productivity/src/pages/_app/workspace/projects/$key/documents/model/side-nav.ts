import type { MouseEvent } from 'react';
import type { DocumentRow } from '@/entities/document';

export type SideNavState = { pages: DocumentRow[]; base: string; currentId: string; open: (id: string) => (event: MouseEvent) => void };

/**
 * 본문이 비어 있고 하위 페이지만 묶는 페이지: 사이드바에서 누를 항목이 아니라 구역 제목이다. 따로 설정하지 않고 본문으로
 * 판단하므로, 그 페이지에 본문을 쓰면 다시 누를 수 있는 항목이 된다.
 */
export const isSectionPage = (page: DocumentRow, pages: readonly DocumentRow[]) =>
  !page.excerpt?.trim() && pages.some(each => each.parentId === page.id);

/** 맨 위 문서의 하위를 차례대로 묶는다: 구역 페이지는 제목과 그 하위, 나머지는 이어진 것끼리 제목 없는 묶음. */
export function groupsOf(children: DocumentRow[], pages: DocumentRow[]) {
  const groups: { section?: DocumentRow; items: DocumentRow[] }[] = [{ items: [] }];
  for (const page of children) {
    if (isSectionPage(page, pages)) groups.push({ section: page, items: pages.filter(each => each.parentId === page.id) });
    else if (groups.at(-1)!.section) groups.push({ items: [page] });
    else groups.at(-1)!.items.push(page);
  }
  return groups;
}
