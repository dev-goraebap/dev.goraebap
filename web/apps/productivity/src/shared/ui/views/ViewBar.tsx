import { useState } from 'react';
import { ActionMenu, type MenuAction } from '@/shared/ui/kit/action-menu';
import { Button } from '@/shared/ui/kit/button';
import { ConfirmDialog } from '@/shared/ui/kit/confirm-dialog';
import { ArrowUpDownIcon, PenSquareIcon, PlusIcon, Trash2Icon } from '@/shared/ui/kit/icon';
import { ViewMark } from './ViewMark';
import { ViewOrderDialog } from './ViewOrderDialog';

/** A view's pill: its name and its mark (icon and colour). */
export type ViewPill = { id: string; label: string; icon: string; color?: string | null };

/**
 * What the … after the views does, the same on every page with saved views: 현재 조건을 새 뷰로 저장 (what the list shows
 * now, named in the page's own dialog), editing the view in view, 순서 편집 (a dialog of the views, each dragged by its
 * grip) and deleting the view in view (asked first). Each is offered only when given.
 */
export type ViewMenuActions = {
  onSaveNew?: () => void;
  /** Edits the view in view; none when it cannot be changed (a built-in view, another's shared view). */
  onEdit?: () => void;
  /** The views that may be put in order and how the new order is kept; none when the member may not order them. */
  order?: { views: ViewPill[]; onSave: (ids: string[]) => Promise<unknown> };
  /** Deletes the view in view once agreed; none when it cannot be deleted. */
  onDelete?: () => Promise<unknown>;
  /** What deleting a view leaves alone, said when asking (문서는 삭제하지 않습니다). */
  deleteNote?: string;
};

/**
 * A page's saved views as pills (the kit's PageViews look: the one in view a step deeper), each its mark in its colour,
 * and after them one … (the kit's ActionMenu) holding what is done to views.
 */
export function ViewBar({ views, value, onChange, actions }: {
  views: ViewPill[]; value: string; onChange: (id: string) => void; actions: ViewMenuActions;
}) {
  const [dialog, setDialog] = useState<'order' | 'delete' | null>(null);
  const [isDeleting, setDeleting] = useState(false);
  const [failure, setFailure] = useState<string>();
  const current = views.find(view => view.id === value);
  const { onSaveNew, onEdit, order, onDelete } = actions;
  const items: MenuAction[] = [
    ...(onSaveNew ? [{ label: '현재 조건을 새 뷰로 저장', icon: PlusIcon, onSelect: onSaveNew }] : []),
    ...(onEdit && current ? [{ label: `'${current.label}' 편집`, icon: PenSquareIcon, onSelect: onEdit }] : []),
    ...(order && order.views.length > 1 ? [{ label: '순서 편집', icon: ArrowUpDownIcon, onSelect: () => setDialog('order') }] : []),
    ...(onDelete && current ? [{ label: '삭제', icon: Trash2Icon, onSelect: () => { setFailure(undefined); setDialog('delete'); } }] : []),
  ];
  const remove = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try { await onDelete(); setDialog(null); } catch (error) { setFailure(error instanceof Error ? error.message : '뷰를 삭제하지 못했습니다.'); } finally { setDeleting(false); }
  };
  return <div className="flex items-center gap-1.5">
    {views.map(view => {
      const isCurrent = view.id === value;
      return <Button key={view.id} variant={isCurrent ? 'view-active' : 'view'} aria-pressed={isCurrent} className="px-3 max-md:h-8"
        onClick={() => onChange(view.id)}>
        <ViewMark view={view} isCurrent={isCurrent} />
        {view.label}
      </Button>;
    })}
    {items.length ? <ActionMenu label="뷰 더보기" title="뷰" actions={items} /> : null}
    {dialog === 'order' && order ? <ViewOrderDialog views={order.views} onSave={order.onSave} onClose={() => setDialog(null)} /> : null}
    <ConfirmDialog open={dialog === 'delete'} onOpenChange={open => { if (!open && !isDeleting) setDialog(null); }}
      title={current ? `'${current.label}' 뷰를 삭제할까요?` : '뷰를 삭제할까요?'} description={failure ?? actions.deleteNote ?? '뷰만 지웁니다.'}
      action={{ label: '삭제', onAction: () => void remove(), isPending: isDeleting }} />
  </div>;
}
