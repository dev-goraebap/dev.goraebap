import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { saveDocumentView, type DocumentLabel, type DocumentSavedView } from '@/entities/document';
import { FormDialog } from '@/shared/ui/kit/form-dialog';
import { MarkNameField } from '@/shared/ui/mark-picker';
import { LabelChoices } from './LabelChoices';

export function ViewDialog({
  projectKey,
  labels,
  initial,
  onDone,
  onClose,
}: {
  projectKey: string;
  labels: DocumentLabel[];
  initial: Omit<DocumentSavedView, 'id' | 'version'> & Partial<Pick<DocumentSavedView, 'id' | 'version'>>;
  onDone: (id?: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initial);
  const save = useMutation({
    mutationFn: async () =>
      await saveDocumentView(projectKey, value, initial.id ? (initial as DocumentSavedView) : undefined),
    onSuccess: (id) => onDone(typeof id === 'string' ? id : initial.id),
  });
  return (
    <FormDialog
      open
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={initial.id ? '뷰 편집' : '현재 조건을 새 뷰로 저장'}
      submitLabel="저장"
      onSubmit={() => save.mutate()}
      isSubmitDisabled={!value.name.trim()}
      isPending={save.isPending}
    >
      <MarkNameField mark={{ label: '뷰 아이콘과 색상', value: { icon: value.icon ?? 'filter', color: value.color ?? null }, onChange: mark => setValue({ ...value, ...mark }) }}
        input={{ label: '이름', placeholder: '뷰 이름', value: value.name, onChange: name => setValue({ ...value, name }), hasAutoFocus: true }} />
      <div className="rounded-lg border">
        <LabelChoices labels={labels} value={value.labels} onChange={(chosen) => setValue({ ...value, labels: chosen })} />
      </div>
      {save.error ? <p role="alert" className="text-sm text-destructive">{save.error.message}</p> : null}
    </FormDialog>
  );
}
