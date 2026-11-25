import type { ComponentProps } from 'react';
import { Input } from '@goraebap/ui-react/compact/input';
import { MarkPicker } from './MarkPicker';

/** The name's text box beside the mark (a project's, a view's, an agent's). onChange takes the text. */
export type MarkNameInput = {
  label: string; value: string; onChange: (value: string) => void;
  placeholder?: string; isRequired?: boolean; isDisabled?: boolean; hasAutoFocus?: boolean; 'aria-invalid'?: boolean;
};

/** A mark picker and a name side by side, the picker the input's height (BIT's icon and name field). */
export function MarkNameField({ mark, input }: { mark: Omit<ComponentProps<typeof MarkPicker>, 'size'>; input: MarkNameInput }) {
  return (
    <div className="flex items-center gap-2">
      <MarkPicker {...mark} size="field" />
      <Input className="min-w-0 flex-1" aria-label={input.label} placeholder={input.placeholder} value={input.value}
        required={input.isRequired} disabled={input.isDisabled} autoFocus={input.hasAutoFocus} aria-invalid={input['aria-invalid'] || undefined}
        onChange={event => input.onChange(event.target.value)} />
    </div>
  );
}
