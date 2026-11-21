import { cn } from 'cn';
import type { DocumentRow } from '@/entities/document';
import { MarkIcon } from '@/shared/ui/mark-picker';
import type { SideNavState } from '../model/side-nav';
import { TREE_LINK } from './DocumentPages';

export function SideNavPageLink({ page, nav }: { page: DocumentRow; nav: SideNavState }) {
  const isCurrent = page.id === nav.currentId;
  return <a href={`${nav.base}/${page.id}`} aria-current={isCurrent ? 'page' : undefined} className={TREE_LINK} onClick={nav.open(page.id)}>
    <MarkIcon name={page.icon ?? 'document'} isChosen={isCurrent} className={cn('size-4 shrink-0', !isCurrent && 'text-icon-muted')} />
    <span className="truncate">{page.title}</span>
  </a>;
}
