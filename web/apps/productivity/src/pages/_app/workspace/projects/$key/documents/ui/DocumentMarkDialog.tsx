import { useState } from 'react';
import type { Mark } from '@/entities/document';
import { Button } from '@/shared/ui/kit/button';
import { FormDialog } from '@/shared/ui/kit/form-dialog';
import { MarkPicker } from '@/shared/ui/mark-picker';

export function DocumentMarkDialog({ name, value, isPending = false, onSave, onClose }: {
  name: string; value: Mark; isPending?: boolean; onSave: (mark: Mark) => void; onClose: () => void;
}) {
  const [mark, setMark] = useState(value);
  return <FormDialog open onOpenChange={open => { if (!open) onClose(); }} title="표식 바꾸기" description={name} submitLabel="바꾸기"
    isPending={isPending} onSubmit={() => onSave(mark)}>
    <div className="flex items-center gap-3">
      <MarkPicker size="md" label="표식" value={{ icon: mark.icon ?? 'document', color: mark.color }} onChange={setMark} />
      <Button type="button" variant="secondary" size="sm" disabled={isPending} onClick={() => setMark({ icon: null, color: null })}>기본으로</Button>
    </div>
  </FormDialog>;
}
