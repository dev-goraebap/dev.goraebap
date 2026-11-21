import type { ReactNode } from 'react';
import type { DocumentRow } from '@/entities/document';
import { FolderIcon, PenSquareIcon, PlusIcon, Trash2Icon } from '@/shared/ui/kit/icon';
import { MarkIcon } from '@/shared/ui/mark-picker';
import { RowMenu, type MenuAction } from '@/shared/ui/popup';
import { MANAGED_ROW, useManagePages } from '../model/manage-pages-context';
import { ManagedPageTitleInput } from './ManagedPageTitleInput';

export function ManagedPageRow({ page, grip }: { page: DocumentRow; grip: ReactNode }) {
  const manage = useManagePages();
  if (manage.draft?.kind === 'rename' && manage.draft.id === page.id)
    return <ManagedPageTitleInput label="페이지 이름" initial={page.title} onDone={text => manage.rename(page, text)} />;
  const actions: MenuAction[] = [
    { id: 'child', label: '하위 페이지 추가', icon: PlusIcon, onSelect: () => manage.setDraft({ kind: 'new', parentId: page.id }) },
    { id: 'rename', label: '이름 바꾸기', icon: PenSquareIcon, onSelect: () => manage.setDraft({ kind: 'rename', id: page.id }) },
    { id: 'move', label: '다른 위치로 옮기기', icon: FolderIcon, onSelect: () => manage.onMove(page) },
    { id: 'delete', label: '삭제', icon: Trash2Icon, onSelect: () => manage.onDelete(page) },
  ];
  return <div className={MANAGED_ROW}>
    {grip}
    <span className="grid w-6 shrink-0 place-items-center text-icon-muted"><MarkIcon name={page.icon ?? 'document'} className="size-4" /></span>
    <span className="min-w-0 flex-1 truncate">{page.title}</span>
    <RowMenu label={`${page.title} 메뉴`} actions={actions} />
  </div>;
}
