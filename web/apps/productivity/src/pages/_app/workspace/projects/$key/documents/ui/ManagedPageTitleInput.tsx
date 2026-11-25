import { useState } from 'react';
import { cn } from 'cn';
import { Button } from '@goraebap/ui-react/compact/button';
import { Input } from '@goraebap/ui-react/compact/input';
import { Spinner } from '@goraebap/ui-react/components/spinner';
import { MarkPicker } from '@/shared/ui/mark-picker';
import { MANAGED_ROW, useManagePages } from '../model/manage-pages-context';

/** 이름 입력 줄: Enter로 저장, Esc로 취소. 새 페이지를 만들 때는(withMark) 이름 앞에서 표식(아이콘·색)도 고른다. */
export function ManagedPageTitleInput({ label, initial, withMark = false, onDone }: {
  label: string; initial: string; withMark?: boolean; onDone: (text: string, mark?: { icon: string | null; color: string | null }) => void;
}) {
  const manage = useManagePages();
  const [text, setText] = useState(initial);
  const [mark, setMark] = useState<{ icon: string | null; color: string | null }>({ icon: 'document', color: null });
  const submit = () => onDone(text, withMark ? mark : undefined);
  return <div className={cn(MANAGED_ROW, 'gap-2 hover:bg-transparent')}>
    {withMark ? <MarkPicker label="새 페이지 표식" value={{ icon: mark.icon ?? 'document', color: mark.color }} isDisabled={manage.busy}
      onChange={next => setMark({ icon: next.icon, color: next.color })} /> : null}
    <Input aria-label={label} placeholder={label} value={text} autoFocus disabled={manage.busy} className="min-w-0 flex-1"
      onChange={event => setText(event.target.value.slice(0, 200))}
      onKeyDown={event => {
        if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); submit(); }
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); manage.setDraft(null); }
      }} />
    <Button size="sm" disabled={!text.trim() || manage.busy} onClick={submit}>{manage.busy ? <Spinner data-icon="inline-start" /> : null}저장</Button>
    <Button variant="ghost" size="sm" onClick={() => manage.setDraft(null)}>취소</Button>
  </div>;
}
