import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { saveDocumentLabels, type DocumentLabel, type DocumentRow } from '@/entities/document';
import { FormDialog } from '@/shared/ui/kit/form-dialog';
import { LabelChoices } from './LabelChoices';

export function LabelsDialog({ projectKey, document, labels, canManageLabels = false, initial, onDone, onClose }: {
  projectKey: string; document: DocumentRow; labels: DocumentLabel[]; canManageLabels?: boolean; initial: string[]; onDone: () => void; onClose: () => void;
}) {
  const [chosen, setChosen] = useState(initial);
  const save = useMutation({ mutationFn: () => saveDocumentLabels(projectKey, document.id, document.version, chosen), onSuccess: onDone });
  return <FormDialog open onOpenChange={open => { if (!open) onClose(); }} title="문서 라벨" submitLabel="저장"
    isPending={save.isPending} onSubmit={() => save.mutate()}>
    <div className="rounded-lg border">
      <LabelChoices labels={labels} value={chosen} onChange={setChosen} canCreate={canManageLabels} />
    </div>
    {save.error ? <p role="alert" className="text-sm text-destructive">{save.error.message}</p> : null}
  </FormDialog>;
}
