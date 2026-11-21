import { useState } from 'react';
import type { DocumentRow } from '@/entities/document';
import { rowReorderStyles as rows, useRowReorder } from '@/shared/lib/row-reorder';
import { cn } from 'cn';
import { Button } from '@/shared/ui/kit/button';
import { ChevronDownIcon, ChevronRightIcon, GripIcon } from '@/shared/ui/kit/icon';
import { MarkIcon } from '@/shared/ui/mark-picker';

/** 페이지 트리의 한 줄 링크: 앱 사이드바 메뉴 줄과 같은 모양, 지금 페이지는 진한 바탕. */
export const TREE_LINK = cn(
  'flex min-h-8 min-w-0 flex-1 items-center gap-2 rounded-[0.625rem] px-2 py-1 text-sm wrap-anywhere outline-none hover:bg-sidebar-accent',
  'focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-medium max-md:min-h-12 max-md:text-base',
);

export function DocumentPages({ pages, parentId, currentId, base, canManage, onOpen, onOrder, onError }: {
  pages: DocumentRow[]; parentId: string | null; currentId: string; base: string; canManage: boolean;
  onOpen: (id: string) => void; onOrder: (ids: string[], parentId: string | null) => Promise<void>; onError: (error: unknown) => void;
}) {
  const siblings = pages.filter(page => (page.parentId ?? null) === parentId);
  const [closed, setClosed] = useState<string[]>([]);
  const reorder = useRowReorder(siblings.map(page => ({ id: page.id, name: page.title })), { word: '페이지', object: '페이지를', topic: '페이지는' }, rows.ghost, ids => onOrder(ids, parentId), onError);
  return <div ref={reorder.list} className="flex flex-col gap-0.5">
    <p id={reorder.hint} className={rows.spoken}>손잡이를 끌거나 Alt와 위아래 화살표로 페이지 순서를 바꿉니다.</p>
    <p role="status" aria-live="polite" className={rows.spoken}>{reorder.said}</p>
    {reorder.order.map(id => {
      const page = siblings.find(item => item.id === id)!;
      const hasChildren = pages.some(child => child.parentId === id);
      const isClosed = closed.includes(id);
      return <div key={id} {...reorder.rowProps(id)} className="group/reorder-row relative flex flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-1">
          {canManage ? <button type="button" className={rows.grip} {...reorder.gripProps({ id, name: page.title })}><GripIcon /></button> : null}
          {hasChildren
            ? <Button variant="ghost" size="icon-xs" className="text-icon-muted max-md:size-11" aria-label={`${page.title} 하위 페이지 ${isClosed ? '펼치기' : '접기'}`}
              aria-expanded={!isClosed} onClick={() => setClosed(old => old.includes(id) ? old.filter(each => each !== id) : [...old, id])}>
              {isClosed ? <ChevronRightIcon /> : <ChevronDownIcon />}
            </Button>
            : <span className="grid w-6 shrink-0 place-items-center text-icon-muted max-md:w-11"><MarkIcon name={page.icon ?? 'document'} className="size-4" /></span>}
          <a className={TREE_LINK} href={`${base}/${id}`} aria-current={id === currentId ? 'page' : undefined}
            onClick={event => { if (event.ctrlKey || event.metaKey || event.shiftKey) return; event.preventDefault(); onOpen(id); }}>{page.title}</a>
        </div>
        {hasChildren && !isClosed ? <div className="pl-4"><DocumentPages {...{ pages, currentId, base, canManage, onOpen, onOrder, onError }} parentId={id} /></div> : null}
      </div>;
    })}
  </div>;
}
