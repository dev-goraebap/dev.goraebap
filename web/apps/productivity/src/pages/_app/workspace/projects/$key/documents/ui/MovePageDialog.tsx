import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { moveDocumentPage, type DocumentRow } from '@/entities/document';
import { FormDialog } from '@/shared/ui/kit/form-dialog';
import { OptionList } from '@/shared/ui/kit/option-list';

/** 페이지 하나를 다른 페이지 아래(또는 문서함 맨 위)로 옮긴다. 자기 자신과 그 하위로는 옮길 수 없다. */
export function MovePageDialog({ projectKey, document, pages, onDone, onClose }: {
  projectKey: string; document: DocumentRow; pages: DocumentRow[]; onDone: () => void; onClose: () => void;
}) {
  const [parent, setParent] = useState(document.parentId ?? '');
  const excluded = new Set([document.id]);
  let changed;
  do {
    changed = false;
    for (const page of pages) if (page.parentId && excluded.has(page.parentId) && !excluded.has(page.id)) { excluded.add(page.id); changed = true; }
  } while (changed);
  const save = useMutation({ mutationFn: () => moveDocumentPage(projectKey, document, parent || null), onSuccess: onDone });
  return <FormDialog open onOpenChange={open => { if (!open) onClose(); }} title="페이지 이동" submitLabel="이동"
    isPending={save.isPending} onSubmit={() => save.mutate()}>
    <div className="rounded-lg border">
      <OptionList label="상위 페이지 검색" isSearchable chosen={[parent]} onPick={setParent}
        options={[{ value: '', label: '문서함 최상위' }, ...pages.filter(page => !excluded.has(page.id)).map(page => ({ value: page.id, label: page.title }))]} />
    </div>
    {save.error ? <p role="alert" className="text-sm text-destructive">{save.error.message}</p> : null}
  </FormDialog>;
}
