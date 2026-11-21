import { ActionMenu as KitActionMenu } from '@/shared/ui/kit/action-menu';
import { EllipsisIcon } from '@/shared/ui/kit/icon';
import type { MenuAction } from './ActionMenu';
import { iconOf } from './icon-of';

/**
 * A row's … at its end (an administration's list, a card's entries): the kit's ActionMenu at a row's size, its actions in a
 * popover, a bottom sheet on a phone. label names the button and titles the sheet.
 */
export function RowMenu({ label, actions }: { label: string; actions: MenuAction[] }) {
  return <div className="flex justify-end">
    <KitActionMenu label={label} size="row" actions={actions.map(action => ({
      // The kit's menu draws an icon on every row; one given none keeps the … in its place.
      label: action.label, icon: action.icon ? iconOf(action.icon) : EllipsisIcon, onSelect: () => action.onSelect?.(),
    }))} />
  </div>;
}
