import { useId, useState } from 'react';
import { Field, FieldLabel } from '@goraebap/ui-react/components/field';
import { FormDialog } from '@/shared/ui/kit/form-dialog';
import { Switch } from '@goraebap/ui-react/components/switch';
import { MarkNameField } from '../mark-picker';
import type { ViewDraft } from './types';

/**
 * Making or changing a view over what the list shows now (its filters, order and layout): its mark (icon and colour, MarkPicker,
 * beside the name), its name, and whether only I see it. How it lays items out is the 표시 menu's, kept as shown. The kit's
 * FormDialog: a dialog on a desktop, a bottom sheet on a phone.
 */
export function ViewEditor({ title, initial, onSave, onClose }: {
  title: string; initial?: ViewDraft; onSave: (draft: ViewDraft) => void; onClose: () => void;
}) {
  const privateId = useId();
  const [draft, setDraft] = useState<ViewDraft>(initial ?? { label: '', icon: 'layout-list', layout: 'list' });
  const set = (change: Partial<ViewDraft>) => setDraft(current => ({ ...current, ...change }));
  return <FormDialog open onOpenChange={open => { if (!open) onClose(); }} title={title}
    submitLabel="저장" isSubmitDisabled={!draft.label.trim()} onSubmit={() => onSave({ ...draft, label: draft.label.trim() })}>
    <MarkNameField mark={{ label: '뷰 아이콘과 색상', value: { icon: draft.icon, color: draft.color ?? null },
      onChange: mark => set({ icon: mark.icon ?? draft.icon, color: mark.color ?? undefined }) }}
      input={{ label: '이름', placeholder: '뷰 이름', value: draft.label, onChange: label => set({ label }), hasAutoFocus: true }} />
    <Field orientation="horizontal">
      <Switch appearance="compact" id={privateId} checked={draft.isPrivate ?? false} onCheckedChange={isPrivate => set({ isPrivate })} />
      <FieldLabel htmlFor={privateId}>나만 보기</FieldLabel>
    </Field>
  </FormDialog>;
}
