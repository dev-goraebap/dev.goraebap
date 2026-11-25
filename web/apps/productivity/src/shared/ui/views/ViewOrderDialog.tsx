import { useState } from 'react';
import { cn } from 'cn';
import { rowReorderStyles as rows, useRowReorder } from '@/shared/lib/row-reorder';
import { Button } from '@goraebap/ui-react/compact/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@goraebap/ui-react/compact/dialog';
import { GripIcon } from '@/shared/ui/kit/icon';
import { ReorderAnnouncer } from '@/shared/ui/kit/reorder';
import type { ViewPill } from './ViewBar';
import { ViewMark } from './ViewMark';

/**
 * 순서 편집: the views in their order, each carried to its place by its grip (Alt + ↑ / ↓ on the grip too). Each move is
 * kept at once; a refused one puts the saved order back and says why.
 */
export function ViewOrderDialog({ views, onSave, onClose }: {
  views: ViewPill[]; onSave: (ids: string[]) => Promise<unknown>; onClose: () => void;
}) {
  const [failure, setFailure] = useState<string>();
  const reorder = useRowReorder(views.map(view => ({ id: view.id, name: view.label })), { word: '뷰', object: '뷰를', topic: '뷰는' }, rows.ghost,
    async ids => { setFailure(undefined); await onSave(ids); },
    error => setFailure(error instanceof Error ? error.message : '순서를 저장하지 못했습니다.'));
  const byId = new Map(views.map(view => [view.id, view]));
  const shown = reorder.order.map(id => byId.get(id)).filter((view): view is ViewPill => !!view);
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>뷰 순서 편집</DialogTitle>
        <DialogDescription>손잡이를 끌어 순서를 바꿉니다. 바꾸면 바로 저장됩니다.</DialogDescription>
      </DialogHeader>
      <div ref={reorder.list} role="list" aria-label="뷰 순서" className={cn(rows.list, 'overflow-hidden rounded-xl border bg-card')}>
        {shown.map(view => <div key={view.id} role="listitem" {...reorder.rowProps(view.id)}
          className={cn(rows.row, 'flex items-center gap-2 py-1.5 pr-3 pl-1.5')}>
          <button type="button" className={rows.grip} {...reorder.gripProps({ id: view.id, name: view.label })}><GripIcon /></button>
          <ViewMark view={view} />
          <span className="min-w-0 truncate text-sm">{view.label}</span>
        </div>)}
      </div>
      <ReorderAnnouncer reorder={reorder} />
      {failure ? <p role="alert" className="text-sm text-destructive">{failure}</p> : null}
      <DialogFooter>
        <Button onClick={onClose}>완료</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
