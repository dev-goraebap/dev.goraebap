import type { MouseEvent } from 'react';
import type { DocumentRow } from '@/entities/document';
import { useStoredWidth } from '@/shared/lib/use-stored-width';
import { Button } from '@/shared/ui/kit/button';
import { SettingsIcon } from '@/shared/ui/kit/icon';
import { PaneResizeHandle } from '@/shared/ui/kit/pane-resize-handle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/kit/tooltip';
import { groupsOf, isSectionPage, type SideNavState } from '../model/side-nav';
import { SideNavPageItem } from './SideNavPageItem';
import { SideNavPageLink } from './SideNavPageLink';

export { isSectionPage };

const NAV_MIN = 220;
const NAV_MAX = 440;

/**
 * 하위 페이지가 있는 문서의 페이지 메뉴(앱 사이드바와 같은 줄 모양 · 선택 표시 · 구역 제목 · 접기). 맨 위 문서가 첫 항목이고, 본문 없이
 * 하위만 묶는 1단계 페이지는 구역 제목(앱 사이드바의 '관리'처럼)이 되어 그 하위를 들여쓰기 없이 늘어놓는다. 손잡이나 추가 버튼은
 * 두지 않고, 관리는 머리 줄의 톱니(onManage)가 여는 페이지 관리에서 한다. 바탕은 본문과 같은 면이고(앱 바닥색과 구분된다) 선으로 나눈다. 머리 줄은 옆 페이지 머리 줄과 같은 높이 · 아래 선이고,
 * 오른쪽 가장자리를 끌어 너비를 바꾼다(이 브라우저에 남는다).
 */
export function DocumentSideNav({ root, pages, currentId, base, onOpen, onManage }: {
  root: DocumentRow; pages: DocumentRow[]; currentId: string; base: string;
  onOpen: (id: string) => void; onManage?: () => void;
}) {
  const [width, resize] = useStoredWidth({ key: 'cowork.document-nav-width', min: NAV_MIN, max: NAV_MAX, initial: 288 });
  const open = (id: string) => (event: MouseEvent) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    onOpen(id);
  };
  const nav: SideNavState = { pages, base, currentId, open };
  const groups = groupsOf(pages.filter(page => page.parentId === root.id), pages);
  return <>
    {/* check-ui: allow-style 목차 칸의 너비는 사용자가 끌어 정한 값이다. */}
    <aside aria-label={`${root.title} 페이지`} style={{ width }} className="flex min-h-0 shrink-0 flex-col border-r bg-background">
      <header className="flex h-13 shrink-0 items-center justify-between gap-2 border-b pr-2 pl-4">
        <h2 className="text-sm font-semibold">목차</h2>
        <div className="flex items-center gap-0.5">
          {onManage ? (
            <Tooltip>
              <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label="페이지 관리" onClick={onManage} />}><SettingsIcon /></TooltipTrigger>
              <TooltipContent>페이지 관리</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </header>
      <nav aria-label={`${root.title} 목차`} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-2">
        {groups.map((group, index) => index > 0 && !group.items.length ? null
          : <section key={group.section?.id ?? `pages-${index}`} aria-label={group.section?.title ?? root.title} className="flex flex-col gap-0.5">
            {group.section ? <h3 className="flex h-8 items-center px-2 text-xs font-medium text-muted-foreground">{group.section.title}</h3> : null}
            <ul className="flex flex-col gap-0.5">
              {index === 0 ? <li className="flex"><SideNavPageLink page={root} nav={nav} /></li> : null}
              {group.items.map(page => <SideNavPageItem key={page.id} page={page} nav={nav} />)}
            </ul>
          </section>)}
      </nav>
    </aside>
    <PaneResizeHandle label="목차 너비" value={width} min={NAV_MIN} max={NAV_MAX} onChange={resize} />
  </>;
}
