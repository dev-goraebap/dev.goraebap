import { cn } from 'cn';
import { Button } from '@/shared/ui/kit/button';
import { CheckIcon, type Icon } from '@/shared/ui/kit/icon';
import { iconOf } from './icon-of';

/**
 * One row of an ActionMenu. icon is a kit icon (CheckIcon) or a meaning name ('edit'), kept for the pages not yet moved;
 * isChosen draws it in Bold Duotone with a check at the end (a choice among several, the section in view).
 */
export type MenuAction = { id: string; label: string; icon?: string | Icon; isChosen?: boolean; onSelect?: () => void };

/**
 * A short list of actions or choices as a popover or a bottom sheet holds it (AdaptivePopover): each its icon and name, a
 * check at the end of a chosen one, under an optional title. Rows as the kit's ActionMenu draws them: 36px, 14px type and
 * a 16px icon on a desktop; 48px, 15px and 20px on a phone. onDone is called after a choice (to close what holds it).
 * A … button with its menu is the kit's ActionMenu (@/shared/ui/action-menu), or RowMenu at a row's end.
 */
export function ActionMenu({ title, actions, onDone }: { title?: string; actions: MenuAction[]; onDone?: () => void }) {
  return <div className="flex flex-col">
    {title ? <p className="px-2 pt-1 pb-1.5 text-xs font-medium text-muted-foreground">{title}</p> : null}
    {actions.map(action => {
      const ActionIcon = action.icon ? iconOf(action.icon) : undefined;
      return <Button key={action.id} variant="ghost" aria-current={action.isChosen || undefined}
        className={cn('h-9 justify-start max-md:h-12 max-md:gap-3 max-md:text-[0.9375rem]', action.isChosen && 'font-medium')}
        onClick={() => { action.onSelect?.(); onDone?.(); }}>
        {ActionIcon ? <ActionIcon chosen={action.isChosen} data-icon="inline-start" className="size-4 max-md:size-5" /> : null}
        <span className="min-w-0 flex-1 truncate text-left">{action.label}</span>
        {action.isChosen ? <CheckIcon data-icon="inline-end" className="size-4 max-md:size-5" /> : null}
      </Button>;
    })}
  </div>;
}
