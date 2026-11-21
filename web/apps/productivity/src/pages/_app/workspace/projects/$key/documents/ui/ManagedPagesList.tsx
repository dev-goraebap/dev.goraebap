import { cn } from 'cn';
import { rowReorderStyles as rows, useRowReorder } from '@/shared/lib/row-reorder';
import { GripIcon } from '@/shared/ui/kit/icon';
import { useManagePages } from '../model/manage-pages-context';
import { ManagedPageRow } from './ManagedPageRow';
import { ManagedPageTitleInput } from './ManagedPageTitleInput';

/** 한 층의 페이지들: 손잡이로 순서를 바꾸고, 그 아래 층을 들여 그린다. 새 페이지 입력은 그 층의 끝에 놓인다. */
export function ManagedPagesList({ parentId }: { parentId: string }) {
  const manage = useManagePages();
  const siblings = manage.pages.filter(page => page.parentId === parentId);
  const reorder = useRowReorder(siblings.map(page => ({ id: page.id, name: page.title })), { word: '페이지', object: '페이지를', topic: '페이지는' },
    rows.ghost, ids => manage.order(ids, parentId), manage.onError);
  const isAdding = manage.draft?.kind === 'new' && manage.draft.parentId === parentId;
  if (!siblings.length && !isAdding) return null;
  return <div ref={reorder.list} className="flex min-w-0 flex-col gap-1">
    <p id={reorder.hint} className={rows.spoken}>손잡이를 끌거나 Alt와 위아래 화살표로 페이지 순서를 바꿉니다.</p>
    <p role="status" aria-live="polite" className={rows.spoken}>{reorder.said}</p>
    {reorder.order.map(id => {
      const page = siblings.find(each => each.id === id);
      if (!page) return null;
      return <div key={id} {...reorder.rowProps(id)} className={cn(rows.row, 'flex flex-col gap-1')}>
        <ManagedPageRow page={page} grip={<button type="button" className={rows.grip} {...reorder.gripProps({ id, name: page.title })}><GripIcon /></button>} />
        <div className="pl-4"><ManagedPagesList parentId={id} /></div>
      </div>;
    })}
    {isAdding ? <ManagedPageTitleInput label="새 페이지 제목" initial="" withMark onDone={(text, mark) => manage.create(parentId, text, mark)} /> : null}
  </div>;
}
